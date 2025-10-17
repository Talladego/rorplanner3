/*
  Probe: fetch all main properties for an item by ID and print as JSON
  Usage:
    npm run probe:item            # defaults to 3205
    npm run probe:item -- 1234    # specify a different id
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const argId = process.argv[2];
  const id = (argId ?? '3205').trim();

  const query = `#graphql
    query GetItem($id: ID!) {
      item(id: $id) {
        id
        name
        description
        type
        slot
        rarity
        armor
        dps
        speed
        levelRequirement
        renownRankRequirement
        itemLevel
        uniqueEquipped
        stats { stat value percentage }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
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
        abilities { name description }
        buffs { name description }
      }
    }
  `;

  const data = await gqlRequest<{ item: any }>(query, { id });
  if (!data || !data.item) {
    console.error(`Item not found for id ${id}`);
    process.exit(2);
  }
  console.log(JSON.stringify(data.item, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
