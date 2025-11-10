import type { StatsSummary } from '../types';
import { applyDR } from './derivedStats';

/** Options controlling bonus calculation behavior. */
export interface DamageHealingBonusOptions {
  /** Apply diminishing returns to the primary stat before computing (matches CharacterWindow UI). Defaults to false. */
  applyDR?: boolean;
  /** Character level required if applyDR=true. */
  level?: number;
  /** Number of decimal places to keep (default 1 like the live client). */
  precision?: number;
}

/** Internal helper to round to N decimals (defaults to 1). */
function round(value: number, precision = 1): number {
  const p = Math.max(0, precision);
  const f = 10 ** p;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/**
 * Base formula extracted from the live client Lua (characterwindowstats.lua):
 *   total = (primaryStat / 5) + (POWER_STAT / 5)
 * where POWER_STAT is the accumulated bonus of EBONUS_DAMAGE_MELEE / RANGED / MAGIC or EBONUS_HEALING_POWER.
 * We already aggregate the item/renown contributions into StatsSummary.{meleePower,rangedPower,magicPower,healingPower}.
 * Outgoing Damage % and Outgoing Heal % are displayed separately and live in StatsSummary.outgoingDamagePercent / outgoingHealPercent.
 */
function computeBonus(primaryStatRaw: number, powerStat: number, opts?: DamageHealingBonusOptions): number {
  const precision = opts?.precision ?? 1;
  const level = opts?.level ?? 0;
  const apply = !!opts?.applyDR && level > 0;
  const primaryStat = apply ? applyDR(primaryStatRaw, level) : primaryStatRaw;
  const total = (primaryStat / 5) + (powerStat / 5);
  return round(total, precision);
}

export function computeMeleeDamageBonus(summary: StatsSummary, opts?: DamageHealingBonusOptions): number {
  return computeBonus(summary.strength || 0, summary.meleePower || 0, opts);
}

export function computeRangedDamageBonus(summary: StatsSummary, opts?: DamageHealingBonusOptions): number {
  return computeBonus(summary.ballisticSkill || 0, summary.rangedPower || 0, opts);
}

export function computeMagicDamageBonus(summary: StatsSummary, opts?: DamageHealingBonusOptions): number {
  return computeBonus(summary.intelligence || 0, summary.magicPower || 0, opts);
}

export function computeHealingBonus(summary: StatsSummary, opts?: DamageHealingBonusOptions): number {
  return computeBonus(summary.willpower || 0, summary.healingPower || 0, opts);
}

/** Convenience bulk computation returning all four bonuses. */
export function computeAllDamageHealingBonuses(summary: StatsSummary, opts?: DamageHealingBonusOptions) {
  return {
    meleeDamageBonus: computeMeleeDamageBonus(summary, opts),
    rangedDamageBonus: computeRangedDamageBonus(summary, opts),
    magicDamageBonus: computeMagicDamageBonus(summary, opts),
    healingBonus: computeHealingBonus(summary, opts),
    outgoingDamagePercent: summary.outgoingDamagePercent || 0,
    outgoingHealPercent: summary.outgoingHealPercent || 0,
  };
}
