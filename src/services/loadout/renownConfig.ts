import type { Loadout } from '../../types';

export type RenownAbilityKey = keyof NonNullable<Loadout['renownAbilities']>;

export interface RenownAbilityDef {
  key: RenownAbilityKey;
  label: string;
  stat: string;
  iconUrl?: string;
  percent?: boolean;
  customTotals?: number[]; // effect totals per level (0..5), cumulative
  costTotals?: number[];   // cumulative cost per level (0..5)
  capLevel?: number;       // visible/selectable cap level
}

/**
 * Patch 17/09/2026 lists per-rank Cost | Value (incremental).
 * The planner stores cumulative totals at each rank.
 *
 * Primary stats: 1|4, 3|12, 6|24, 10|40, 10|40
 *   costs  [0, 1, 4, 10, 20, 30]
 *   values [0, 4, 16, 40, 80, 120]
 */
export const DEFAULT_STAT_TOTALS = [0, 4, 16, 40, 80, 120];
export const DEFAULT_COST_TOTALS = [0, 1, 4, 10, 20, 30];

/** 4-rank combat abilities: 5, 5, 10, 10 incremental → 5 / 10 / 20 / 30 cumulative. */
const COMBAT_COST_TOTALS = [0, 5, 10, 20, 30, 30];

const icon = (id: number) => `https://armory.returnofreckoning.com/icon/${id}`;

export const RENOWN_ABILITIES: RenownAbilityDef[] = [
  { key: 'might', label: 'Might', stat: 'Strength', iconUrl: icon(22261) },
  { key: 'bladeMaster', label: 'Blade Master', stat: 'Weapon Skill', iconUrl: icon(22255) },
  { key: 'marksman', label: 'Marksman', stat: 'Ballistic Skill', iconUrl: icon(22260) },
  { key: 'impetus', label: 'Impetus', stat: 'Initiative', iconUrl: icon(22259) },
  { key: 'acumen', label: 'Acumen', stat: 'Intelligence', iconUrl: icon(22251) },
  { key: 'resolve', label: 'Resolve', stat: 'Willpower', iconUrl: icon(22267) },
  { key: 'fortitude', label: 'Fortitude', stat: 'Toughness', iconUrl: icon(22711) },
  { key: 'vigor', label: 'Vigor', stat: 'Wounds', iconUrl: icon(22250) },
  // 5|2%, 5|2%, 10|4%, 10|4% → 2 / 4 / 8 / 12
  { key: 'opportunist', label: 'Opportunist', stat: 'Offensive Crit Chance', iconUrl: icon(22263), percent: true, customTotals: [0, 2, 4, 8, 12, 12], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  { key: 'spiritualRefinement', label: 'Spiritual Refinement', stat: 'Healing Crit Chance', iconUrl: icon(22271), percent: true, customTotals: [0, 2, 4, 8, 12, 12], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  // New: 5|2%, 5|2%, 10|4%, 10|5% → 2 / 4 / 8 / 13 Parry/Dodge/Disrupt Strikethrough
  { key: 'focusedPower', label: 'Focused Power', stat: 'Parry, Dodge and Disrupt Strikethrough', iconUrl: icon(22257), percent: true, customTotals: [0, 2, 4, 8, 13, 13], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  // 5|2%, 5|2%, 10|4%, 10|5% → 2 / 4 / 8 / 13
  { key: 'reflexes', label: 'Reflexes', stat: 'Parry', iconUrl: icon(22264), percent: true, customTotals: [0, 2, 4, 8, 13, 13], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  // 5|2%, 5|2%, 10|3%, 10|3% → 2 / 4 / 7 / 10 (rank IV still 10% block)
  { key: 'defender', label: 'Defender', stat: 'Block', iconUrl: icon(22274), percent: true, customTotals: [0, 2, 4, 7, 10, 10], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  { key: 'deftDefender', label: 'Deft Defender', stat: 'Dodge / Disrupt', iconUrl: icon(22276), percent: true, customTotals: [0, 2, 4, 8, 13, 13], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  // Reduced incoming/outgoing damage and outgoing healing: 2 / 4 / 7 / 10
  { key: 'hardyConcession', label: 'Hardy Concession', stat: 'Incoming / Outgoing Damage', iconUrl: icon(22265), percent: true, customTotals: [0, -2, -4, -7, -10, -10], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  { key: 'futileStrikes', label: 'Futile Strikes', stat: 'Reduced chance to be critically hit', iconUrl: icon(22253), percent: true, customTotals: [0, 2, 4, 8, 12, 12], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
  { key: 'trivialBlows', label: 'Trivial Blows', stat: 'Reduced critical damage taken', iconUrl: icon(22266), percent: true, customTotals: [0, 4, 8, 16, 24, 24], capLevel: 4, costTotals: COMBAT_COST_TOTALS },
];

export function emptyRenownAbilities(): NonNullable<Loadout['renownAbilities']> {
  return {
    might: 0,
    bladeMaster: 0,
    marksman: 0,
    impetus: 0,
    acumen: 0,
    resolve: 0,
    fortitude: 0,
    vigor: 0,
    opportunist: 0,
    spiritualRefinement: 0,
    focusedPower: 0,
    reflexes: 0,
    defender: 0,
    deftDefender: 0,
    hardyConcession: 0,
    futileStrikes: 0,
    trivialBlows: 0,
  };
}

/**
 * Packed share-URL order. `regeneration` is a retired slot kept so old `ra=`
 * strings stay aligned; encode/decode always treat it as 0.
 */
export const RENOWN_PACK_KEYS = [
  'might', 'bladeMaster', 'marksman', 'impetus', 'acumen', 'resolve', 'fortitude', 'vigor',
  'opportunist', 'spiritualRefinement', 'regeneration', 'reflexes', 'defender', 'deftDefender',
  'hardyConcession', 'futileStrikes', 'trivialBlows', 'focusedPower',
] as const;

export function getRenownDef(key: string): RenownAbilityDef | undefined {
  return RENOWN_ABILITIES.find((ab) => ab.key === key);
}

export function getRenownEffectAtLevel(key: string, level: number): number {
  const def = getRenownDef(key);
  if (!def) return 0;
  const totals = (def.customTotals && def.customTotals.length) ? def.customTotals : DEFAULT_STAT_TOTALS;
  const lvl = Math.max(0, Math.min(5, Math.trunc(level)));
  return totals[Math.max(0, Math.min(totals.length - 1, lvl))] || 0;
}

export function getRenownCostAtLevel(key: string, level: number): number {
  const def = getRenownDef(key);
  const totals = (def?.costTotals && def.costTotals.length) ? def.costTotals : DEFAULT_COST_TOTALS;
  const lvl = Math.max(0, Math.min(5, Math.trunc(level)));
  return totals[Math.max(0, Math.min(totals.length - 1, lvl))] || 0;
}

export function isActiveRenownAbilityKey(key: string): key is RenownAbilityKey {
  return RENOWN_ABILITIES.some((ab) => ab.key === key);
}
