import type { StatsSummary } from '../types';

/**
 * Options controlling how derived defenses are computed.
 * Note: Live client Lua does NOT apply stat DR when computing these defenses.
 * We keep an option to apply DR for experimentation/what-if analysis.
 */
export type DerivedDefenseOptions = {
  /** If true, apply the CharacterWindow stat DR curve to the source stats before deriving. Defaults to false. */
  applyDR?: boolean;
};

// Apply diminishing returns similar to client Lua basic stats display:
// threshold = 25*level + 50, cap = 40*level + 50, above threshold halves gains
export function applyDR(value: number, level: number): number {
  const threshold = (25 * level) + 50;
  const cap = (40 * level) + 50;
  if (value > threshold) {
    value = threshold + (value - threshold) / 2;
  }
  if (value > cap) value = cap;
  return Math.floor(value); // client truncates for nicer output
}

/**
 * Compute the contributions to defense chances that come purely from base stats.
 * This intentionally excludes item sources, which are already part of the computed summary:
 * - Item +Block%, +Parry%, +Evade%, +Disrupt% lines are included in StatsSummary by loadoutService.
 * - Shield “block rating” is converted to % and included in StatsSummary.block by loadoutService.
 *
 * Derived from client Lua (CharacterWindow):
 * - Block += Toughness / 200
 * - Parry += Initiative / 100 * 3
 * - Evade += Initiative / 100 * 3
 * - Disrupt += Willpower / 100 * 3
 *
 * No server DR is applied to these in the client’s computation. We expose an optional DR toggle for analysis only.
 */
export function computeDerivedDefenses(summary: StatsSummary, level: number, opts: DerivedDefenseOptions = {}): Partial<StatsSummary> {
  const useDR = !!opts.applyDR;
  const pick = (v: number) => (useDR ? applyDR(v, level) : v);

  const initiative = pick(summary.initiative || 0);
  const willpower = pick(summary.willpower || 0);
  const toughness = pick(summary.toughness || 0);

  const parry = (initiative / 100) * 3;
  const evade = (initiative / 100) * 3;
  const disrupt = (willpower / 100) * 3;
  const block = (toughness / 200);

  return {
    parry,
    evade,
    disrupt,
    block,
  } as Partial<StatsSummary>;
}

/**
 * Compute Initiative-based reduction to "Chance to be critically hit".
 * Client Lua uses g_currentInitiative (after DR) in: CritHit = ... - (Initiative/100)*5
 * We return just the Initiative contribution: Initiative/100*5 (percentage points).
 * Default behavior here applies DR to Initiative to mirror the client.
 */
export function computeDerivedCritReductionFromInitiative(summary: StatsSummary, level: number, opts: DerivedDefenseOptions = {}): number {
  const useDR = opts.applyDR !== undefined ? opts.applyDR : true; // default true for Initiative to match client UI
  const init = useDR ? applyDR(summary.initiative || 0, level) : (summary.initiative || 0);
  const critReduction = (init / 100) * 5;
  return critReduction;
}

/**
 * Compute Armor Penetration (%) derived from Weapon Skill.
 * Based on client Lua (CharacterWindow.CalcArmorPenetration):
 * AP% = WS' * (battleLevel / battleLevelWithRenown) / (battleLevel*7.5 + 50) * 25
 * where WS' may be DR'd if toggled. The ratio battleLevel/battleLevelWithRenown
 * defaults to 1 when the "with renown" value isn't provided (typical case).
 */
export function computeDerivedArmorPenetrationFromWeaponSkill(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean; battleLevelWithRenown?: number } = {}
): number {
  const useDR = !!opts.applyDR;
  const ws = useDR ? applyDR(summary.weaponSkill || 0, level) : (summary.weaponSkill || 0);
  const bl = level > 0 ? level : 1;
  const blwr = opts.battleLevelWithRenown && opts.battleLevelWithRenown > 0 ? opts.battleLevelWithRenown : bl;
  const ratio = bl > 0 && blwr > 0 ? (bl / blwr) : 1;
  const denom = (bl * 7.5) + 50;
  if (denom <= 0) return 0;
  const ap = (ws * ratio / denom) * 25;
  return ap;
}

/**
 * Compute Parry Strikethrough (%) derived from Strength.
 * From client Lua (CharacterWindow.GetStrengthTooltipDesc):
 * Parry Strikethrough = Strength / 100
 * We optionally apply DR to Strength based on the shared toggle.
 */
export function computeDerivedParryStrikethroughFromStrength(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const str = useDR ? applyDR(summary.strength || 0, level) : (summary.strength || 0);
  const ps = (str / 100);
  return ps;
}

/**
 * Compute Evade (Dodge) Strikethrough (%) derived from Ballistic Skill.
 * From client Lua (CharacterWindow.GetBallisticSkillTooltipDesc):
 * Dodge Strikethrough = Ballistic Skill / 100
 * We optionally apply DR to Ballistic Skill based on the shared toggle.
 */
export function computeDerivedEvadeStrikethroughFromBallisticSkill(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const bs = useDR ? applyDR(summary.ballisticSkill || 0, level) : (summary.ballisticSkill || 0);
  const es = (bs / 100);
  return es;
}

/**
 * Compute Disrupt Strikethrough (%) derived from Intelligence.
 * From client Lua (CharacterWindow.GetIntelligenceTooltipDesc):
 * Disrupt Strikethrough = Intelligence / 100
 * We optionally apply DR to Intelligence based on the shared toggle.
 */
export function computeDerivedDisruptStrikethroughFromIntelligence(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const int = useDR ? applyDR(summary.intelligence || 0, level) : (summary.intelligence || 0);
  const ds = (int / 100);
  return ds;
}

/**
 * Compute Block Strikethrough (%) variants derived from primary stats.
 * From client Lua tooltips:
 * - Strength -> Block Strikethrough = Strength / 200 (melee)
 * - Ballistic Skill -> Block Strikethrough = Ballistic Skill / 200 (ranged)
 * - Intelligence -> Block Strikethrough = Intelligence / 200 (magic)
 * Items can add flat Block Strikethrough; the compare panel will add that to the derived values per-variant.
 */
export function computeDerivedBlockStrikethroughFromStrength(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const str = useDR ? applyDR(summary.strength || 0, level) : (summary.strength || 0);
  return (str / 200);
}

export function computeDerivedBlockStrikethroughFromBallisticSkill(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const bs = useDR ? applyDR(summary.ballisticSkill || 0, level) : (summary.ballisticSkill || 0);
  return (bs / 200);
}

export function computeDerivedBlockStrikethroughFromIntelligence(
  summary: StatsSummary,
  level: number,
  opts: { applyDR?: boolean } = {}
): number {
  const useDR = !!opts.applyDR;
  const int = useDR ? applyDR(summary.intelligence || 0, level) : (summary.intelligence || 0);
  return (int / 200);
}
