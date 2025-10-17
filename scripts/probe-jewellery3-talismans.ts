/*
  Probe: list talismans compatible with JEWELLERY3 (i.e., ENHANCEMENT items for JEWELLERY slots)
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const query = `#graphql
    query GetTalismans($first: Int, $where: ItemFilterInput) {
      items(
        where: $where,
        first: $first,
        order: [ { rarity: DESC }, { itemLevel: DESC }, { name: ASC } ]
      ) {
        totalCount
        nodes {
          id
          name
          slot
          rarity
          levelRequirement
          itemLevel
          stats { stat value percentage }
        }
      }
    }
  `;

  const where = {
    type: { eq: 'ENHANCEMENT' },
    // Note: server treats JEWELLERY slots compatibly; JEWELLERY3 is index-mapped in app but filter by any jewellery slot.
    slot: { in: ['JEWELLERY1', 'JEWELLERY2', 'JEWELLERY3', 'JEWELLERY4'] },
  };

  const data = await gqlRequest<{ items: { totalCount: number; nodes: any[] } }>(query, { first: 50, where });
  const items = data.items?.nodes ?? [];

  console.log(`Total returned: ${items.length} (server totalCount may be larger)`);
  for (const it of items) {
    const statStr = (it.stats || []).map((s: any) => `${s.percentage ? s.value + '%' : s.value} ${s.stat}`).join(', ');
    console.log(`- [${it.rarity}] ilvl ${it.itemLevel} L${it.levelRequirement} ${it.name} — ${statStr}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
