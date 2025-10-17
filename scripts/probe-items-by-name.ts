/*
  Probe: search items by name, then check for OUTGOING_DAMAGE_PERCENT in set bonuses
  Usage:
    npm run probe:items-by-name -- Vanquisher
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const nameArg = process.argv[2] || 'Vanquisher';
  const name = String(nameArg);

  const query = `#graphql
    query ItemsByName($first: Int, $where: ItemFilterInput) {
      items(
        first: $first,
        where: $where,
        order: [ { itemLevel: DESC }, { name: ASC } ]
      ) {
        totalCount
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

  const where = { name: { contains: name } } as any;
  const data = await gqlRequest<{ items: { totalCount: number; nodes: any[] } }>(query, { first: 50, where });
  const nodes = data.items?.nodes || [];

  const withOutgoing = nodes.filter((n) => (n.itemSet?.bonuses || []).some((b: any) => b.bonus.__typename === 'ItemStat' && b.bonus.stat === 'OUTGOING_DAMAGE_PERCENT'));

  console.log(`Found ${nodes.length} items matching '${name}'. With OUTGOING_DAMAGE_PERCENT in set bonuses: ${withOutgoing.length}`);
  for (const it of withOutgoing) {
    const setStats = (it.itemSet?.bonuses || [])
      .filter((b: any) => b.bonus.__typename === 'ItemStat' && b.bonus.stat === 'OUTGOING_DAMAGE_PERCENT')
      .map((b: any) => `${b.bonus.stat}=${b.bonus.value}${b.bonus.percentage ? '%' : ''} (at ${b.itemsRequired}pc)`).join(', ');
    console.log(`- ilvl ${it.itemLevel} ${it.name} (#${it.id}) — ${setStats}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
