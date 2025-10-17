/*
  Probe: find items that have OUTGOING_DAMAGE(_PERCENT) either on the item stats or via their item set bonuses
  Usage:
    npm run probe:items-outgoing-damage-any
*/

import { gqlRequest } from './gqlClient';

type ItemNode = {
  id: string;
  name: string;
  itemLevel: number;
  stats?: Array<{ stat: string; value: number; percentage: boolean }>;
  itemSet?: {
    id: string;
    name: string;
    bonuses: Array<{
      itemsRequired: number;
      bonus: (
        | { __typename: 'ItemStat'; stat: string; value: number; percentage: boolean }
        | { __typename: 'Ability'; name: string; description: string }
      );
    }>;
  } | null;
};

async function main() {
  const query = `#graphql
    query PageItems($first: Int, $after: String, $where: ItemFilterInput) {
      items(
        first: $first,
        after: $after,
        where: $where,
        order: [ { rarity: DESC }, { itemLevel: DESC }, { name: ASC } ]
      ) {
        pageInfo { endCursor hasNextPage }
        nodes {
          id
          name
          itemLevel
          stats { stat value percentage }
          itemSet {
            id
            name
            bonuses {
              itemsRequired
              bonus {
                __typename
                ... on ItemStat { stat value percentage }
                ... on Ability { name description }
              }
            }
          }
        }
      }
    }
  `;

  const matches: ItemNode[] = [];
  const seen = new Set<string>();
  let after: string | undefined = undefined;
  let page = 0;
  const MAX_PAGES = 50; // up to ~2500 items

  function hasOutgoing(n: ItemNode): boolean {
    const direct = (n.stats || []).some((s) => s.stat === 'OUTGOING_DAMAGE' || s.stat === 'OUTGOING_DAMAGE_PERCENT');
    const viaSet = !!n.itemSet && n.itemSet.bonuses?.some((b) => b.bonus.__typename === 'ItemStat' && ((b.bonus as any).stat === 'OUTGOING_DAMAGE' || (b.bonus as any).stat === 'OUTGOING_DAMAGE_PERCENT'));
    return direct || viaSet;
  }

  do {
  const where = { itemLevel: { gte: 50 } } as any;
  const data: { items: { nodes: ItemNode[]; pageInfo: { endCursor: string; hasNextPage: boolean } } } = await gqlRequest(query, { first: 50, after, where });
    const nodes = data.items?.nodes ?? [];
    for (const n of nodes) {
      if (hasOutgoing(n) && !seen.has(n.id)) {
        seen.add(n.id);
        matches.push(n);
      }
    }
    after = data.items?.pageInfo?.hasNextPage ? data.items.pageInfo.endCursor : undefined;
    page++;
  } while (after && page < MAX_PAGES);

  console.log(`Found ${matches.length} items with OUTGOING_DAMAGE(_PERCENT) in stats or set bonuses (scanned ${page * 50} items).`);
  for (const it of matches.slice(0, 200)) {
    const direct = (it.stats || [])
      .filter((s) => s.stat === 'OUTGOING_DAMAGE' || s.stat === 'OUTGOING_DAMAGE_PERCENT')
      .map((s) => `${s.stat}=${s.value}${s.percentage ? '%' : ''}`)
      .join(', ');
    const setStats = (it.itemSet?.bonuses || [])
      .filter((b) => b.bonus.__typename === 'ItemStat' && (((b.bonus as any).stat === 'OUTGOING_DAMAGE') || ((b.bonus as any).stat === 'OUTGOING_DAMAGE_PERCENT')))
      .map((b) => `${(b.bonus as any).stat}=${(b.bonus as any).value}${(b.bonus as any).percentage ? '%' : ''} (at ${b.itemsRequired}pc)`)
      .join(', ');
    const summary = [direct && `Direct: ${direct}`, setStats && `Set: ${setStats}`].filter(Boolean).join(' | ');
    console.log(`- ilvl ${it.itemLevel} ${it.name} (#${it.id}) — ${summary}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
