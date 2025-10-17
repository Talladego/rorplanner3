/*
  Probe: fetch AbilityInfo by id with parameterized description(stats)
  Usage:
    npm run probe:ability            # defaults to 30013 (Bloodlord Buff)
    npm run probe:ability -- 1136    # e.g., Vanquisher Ward
*/

import { gqlRequest } from './gqlClient';

async function main() {
  const argId = process.argv[2];
  const id = (argId ?? '30013').trim();

  const query = `#graphql
    query GetAbility($id: ID!, $stats: CharacterStatsInput!) {
      ability(id: $id) {
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
        description(stats: $stats)
      }
    }
  `;

  // Basic defaults; tweak as needed for class probes
  const stats = {
    level: 40,
    strength: 250,
    ballisticSkill: 0,
    intelligence: 0,
    willpower: 0,
  };

  const data = await gqlRequest<{ ability: any }>(query, { id, stats });
  if (!data || !data.ability) {
    console.error(`Ability not found for id ${id}`);
    process.exit(2);
  }
  console.log(JSON.stringify(data.ability, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
