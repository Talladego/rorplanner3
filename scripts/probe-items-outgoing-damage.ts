/*
  Probe: find items that have OUTGOING_DAMAGE or OUTGOING_DAMAGE_PERCENT in their stats
  Usage:
    npm run probe:items-outgoing-damage
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const query = `#graphql
    query FindOutgoingDamageItems($first: Int, $after: String, $hasStats: [Stat!]) {
      items(
        hasStats: $hasStats,
        first: $first,
        after: $after,
        order: [ { rarity: DESC }, { itemLevel: DESC }, { name: ASC } ]
      ) {
        totalCount
        pageInfo { endCursor hasNextPage }
        nodes {
          id
          name
          type
          slot
          rarity
          itemLevel
          stats { stat value percentage }
        }
      }
    }
  `;

  async function fetchAll(hasStats: string[]): Promise<any[]> {
    const acc: any[] = [];
    let after: string | undefined = undefined;
    let page = 0;
    do {
      const data: { items: { nodes: any[]; pageInfo: { endCursor: string; hasNextPage: boolean } } } = await gqlRequest<{ items: { nodes: any[]; pageInfo: { endCursor: string; hasNextPage: boolean } } }>(query, { first: 50, after, hasStats });
      const nodes = data.items?.nodes ?? [];
      acc.push(...nodes);
      after = data.items?.pageInfo?.hasNextPage ? data.items.pageInfo.endCursor : undefined;
      page++;
    } while (after && page < 10);
    return acc;
  }

  const uniqueById = (list: any[]) => {
    const map = new Map<string, any>();
    for (const it of list) map.set(String(it.id), it);
    return Array.from(map.values());
  };

  const a = await fetchAll(['OUTGOING_DAMAGE']);
  const b = await fetchAll(['OUTGOING_DAMAGE_PERCENT']);
  const all = uniqueById([...a, ...b]);

  console.log(`Found ${all.length} unique items with OUTGOING_DAMAGE or OUTGOING_DAMAGE_PERCENT (up to 1000 scanned).`);
  for (const it of all.slice(0, 200)) {
    const statStr = (it.stats || [])
      .filter((s: any) => s.stat === 'OUTGOING_DAMAGE' || s.stat === 'OUTGOING_DAMAGE_PERCENT')
      .map((s: any) => `${s.stat}=${s.value}${s.percentage ? '%' : ''}`)
      .join(', ');
    console.log(`- [${it.rarity}] ilvl ${it.itemLevel} ${it.name} (#${it.id}) — ${statStr}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
