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

export const RENOWN_ABILITIES: RenownAbilityDef[] = [
  { key: 'might', label: 'Might', stat: 'Strength' },
  { key: 'bladeMaster', label: 'Blade Master', stat: 'Weapon Skill' },
  { key: 'marksman', label: 'Marksman', stat: 'Ballistic Skill' },
  { key: 'impetus', label: 'Impetus', stat: 'Initiative' },
  { key: 'acumen', label: 'Acumen', stat: 'Intelligence' },
  { key: 'resolve', label: 'Resolve', stat: 'Willpower' },
  { key: 'fortitude', label: 'Fortitude', stat: 'Toughness' },
  { key: 'vigor', label: 'Vigor', stat: 'Wounds' },
  // 4-tier abilities with percent effects and higher costs
  { key: 'opportunist', label: 'Opportunist', stat: 'Offensive Critical Hit', percent: true, customTotals: [0, 2, 5, 9, 14, 14], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  { key: 'spiritualRefinement', label: 'Spiritual Refinement', stat: 'Healing Critical Hit', percent: true, customTotals: [0, 2, 5, 9, 14, 14], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  // 3-tier ability with flat effect and custom costs
  { key: 'regeneration', label: 'Regeneration', stat: 'Health Regen', customTotals: [0, 7, 17, 35, 35, 35], capLevel: 3, costTotals: [0, 10, 25, 45, 45, 45] },
  // New 4-tier defensive abilities with custom cumulative costs [0,1,5,15,35]
  // Reflexes: Parry%
  { key: 'reflexes', label: 'Reflexes', stat: 'Parry', percent: true, customTotals: [0, 3, 7, 12, 18, 18], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Defender: Block%
  { key: 'defender', label: 'Defender', stat: 'Block', percent: true, customTotals: [0, 3, 7, 12, 18, 18], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Deft Defender: Dodge/Disrupt% (applies to both Evade and Disrupt)
  { key: 'deftDefender', label: 'Deft Defender', stat: 'Dodge / Disrupt', percent: true, customTotals: [0, 3, 7, 12, 18, 18], capLevel: 4, costTotals: [0, 1, 4, 10, 20, 20] },
  // Hardy Concession: affects both Incoming and Outgoing Damage (percent). 5 tiers with default costs
  { key: 'hardyConcession', label: 'Hardy Concession', stat: 'Incoming / Outgoing Damage', percent: true, customTotals: [0, -1, -3, -6, -10, -15], costTotals: [0, 1, 4, 10, 20, 34] },
  // Futile Strikes: Critical Hit Rate Reduction (percent), 4 tiers
  { key: 'futileStrikes', label: 'Futile Strikes', stat: 'Critical Hit Reduction', percent: true, customTotals: [0, 3, 8, 15, 24, 24], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
  // Trivial Blows: Critical Damage Taken Reduction (percent), 4 tiers
  { key: 'trivialBlows', label: 'Trivial Blows', stat: 'Critical Damage Reduction', percent: true, customTotals: [0, 4, 12, 24, 40, 40], capLevel: 4, costTotals: [0, 5, 15, 30, 45, 45] },
];
