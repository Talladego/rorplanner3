/*
  Probe: fetch deeper info for an item's buffs (Ability + AbilityInfo)
  Usage:
    npm run probe:item-buffs            # defaults to 10408 (Bloodlord Chaosaxe)
    npm run probe:item-buffs -- 3205    # specify a different id
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const argId = process.argv[2];
  const id = (argId ?? '10408').trim();

  const query = `#graphql
    query GetItemBuffs($id: ID!) {
      item(id: $id) {
        id
        name
        buffs {
          id
          name
          description
          info {
            id
            name
            iconUrl
            abilityType
            specialization
            actionPointCost
            moraleLevel
            moraleCost
            castTime
            range
            minRange
            minLevel
            cooldown
            labels
          }
        }
      }
    }
  `;

  const data = await gqlRequest<{ item: any }>(query, { id });
  if (!data || !data.item) {
    console.error(`Item not found for id ${id}`);
    process.exit(2);
  }

  const item = data.item;
  console.log(`Item ${item.id}: ${item.name}`);
  if (!item.buffs || item.buffs.length === 0) {
    console.log('No buffs on item.');
    return;
  }

  for (const b of item.buffs) {
    console.log('---');
    console.log(`Buff: ${b.name} (id=${b.id})`);
    console.log(`Description: ${b.description}`);
    if (b.info) {
      console.log('Info:');
      const {
        id: aid, name, iconUrl, abilityType, specialization, actionPointCost, moraleLevel, moraleCost, castTime, range, minRange, minLevel, cooldown, labels,
      } = b.info;
      console.log({ aid, name, iconUrl, abilityType, specialization, actionPointCost, moraleLevel, moraleCost, castTime, range, minRange, minLevel, cooldown, labels });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
