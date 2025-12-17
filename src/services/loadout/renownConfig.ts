import type { Loadout } from '../../types';

export type RenownAbilityKey = keyof NonNullable<Loadout['renownAbilities']>;

export interface RenownAbilityDef {
  key: RenownAbilityKey;
  label: string;
  stat: string;
  iconUrl?: string;
  percent?: boolean;
  customTotals?: number[]; // effect totals per level (0..5)
  costTotals?: number[];   // cumulative cost per level (0..5)
  capLevel?: number;       // visible/selectable cap level
}

// Default cumulative costs for 5-level abilities
export const DEFAULT_COST_TOTALS = [0, 1, 4, 10, 20, 34];

const icon = (id: number) => `https://armory.returnofreckoning.com/icon/${id}`;

export const RENOWN_ABILITIES: RenownAbilityDef[] = [
  // Basic stat abilities (from AdvancedRenownTrainingAbilities.lua BasicRenownAbilitiesCreateTable)
  { key: 'might', label: 'Might', stat: 'Strength', iconUrl: icon(22261) },
  { key: 'bladeMaster', label: 'Blade Master', stat: 'Weapon Skill', iconUrl: icon(22255) },
  { key: 'marksman', label: 'Marksman', stat: 'Ballistic Skill', iconUrl: icon(22260) },
  { key: 'impetus', label: 'Impetus', stat: 'Initiative', iconUrl: icon(22259) },
  { key: 'acumen', label: 'Acumen', stat: 'Intelligence', iconUrl: icon(22251) },
  { key: 'resolve', label: 'Resolve', stat: 'Willpower', iconUrl: icon(22267) },
  { key: 'fortitude', label: 'Fortitude', stat: 'Toughness', iconUrl: icon(22711) },
  { key: 'vigor', label: 'Vigor', stat: 'Wounds', iconUrl: icon(22250) },
  // Advanced offensive/healing crit and regen (from AdvancedRenownAbilitiesCreateTable)
  { key: 'opportunist', label: 'Opportunist', stat: 'Offensive Critical Hit', iconUrl: icon(22263), percent: true, customTotals: [0, 2, 5, 9, 14, 14], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  { key: 'spiritualRefinement', label: 'Spiritual Refinement', stat: 'Healing Critical Hit', iconUrl: icon(22271), percent: true, customTotals: [0, 2, 5, 9, 14, 14], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  // 3-tier ability with flat effect and custom costs
  { key: 'regeneration', label: 'Regeneration', stat: 'Health Regen', iconUrl: icon(26), customTotals: [0, 7, 17, 35, 35, 35], capLevel: 3, costTotals: [0, 10, 25, 45, 45, 45] },
  // Defensive tree (from DefensiveRenownAbilitiesCreateTable)
  // Reflexes: Parry%
  { key: 'reflexes', label: 'Reflexes', stat: 'Parry', iconUrl: icon(22264), percent: true, customTotals: [0, 3, 7, 12, 18, 18], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Defender: Block%
  // Spec totals aligned with cumulative cost levels: I=1, II=3, III=6, IV=10
  { key: 'defender', label: 'Defender', stat: 'Block', iconUrl: icon(22274), percent: true, customTotals: [0, 1, 3, 6, 10, 10], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Deft Defender: Dodge/Disrupt%
  { key: 'deftDefender', label: 'Deft Defender', stat: 'Dodge / Disrupt', iconUrl: icon(22276), percent: true, customTotals: [0, 3, 7, 12, 18, 18], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Hardy Concession: Incoming/Outgoing Damage
  { key: 'hardyConcession', label: 'Hardy Concession', stat: 'Incoming / Outgoing Damage', iconUrl: icon(22265), percent: true, customTotals: [0, -1, -3, -6, -10, -15], costTotals: [0, 1, 4, 10, 20, 34] },
  // Futile Strikes: Crit Rate Reduction
  { key: 'futileStrikes', label: 'Futile Strikes', stat: 'Critical Hit Reduction', iconUrl: icon(22253), percent: true, customTotals: [0, 3, 8, 15, 24, 24], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  // Trivial Blows: Crit Damage Reduction
  { key: 'trivialBlows', label: 'Trivial Blows', stat: 'Critical Damage Reduction', iconUrl: icon(22266), percent: true, customTotals: [0, 4, 12, 24, 40, 40], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
];
