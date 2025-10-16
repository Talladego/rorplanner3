import { loadoutService } from '../services/loadoutService';
import type { StatsSummary } from '../types';
import { getCareerBaseStats, withBaseStats, isBaseStatKey, type BaseStatKey } from '../constants/careerBaseStats';
import {
  computeDerivedDefenses,
  computeDerivedCritReductionFromInitiative,
  computeDerivedArmorPenetrationFromWeaponSkill,
  computeDerivedParryStrikethroughFromStrength,
  computeDerivedEvadeStrikethroughFromBallisticSkill,
  computeDerivedDisruptStrikethroughFromIntelligence,
  computeDerivedBlockStrikethroughFromStrength,
  computeDerivedBlockStrikethroughFromBallisticSkill,
  computeDerivedBlockStrikethroughFromIntelligence,
} from './derivedStats';
import type { Contribution } from '../components/stats/StatRow';

// Derived stats application: DR is always applied in derived computations
export const APPLY_DR: boolean = true;

export const buildEmptySummary = (): StatsSummary => ({
  strength: 0,
  agility: 0,
  willpower: 0,
  toughness: 0,
  wounds: 0,
  initiative: 0,
  weaponSkill: 0,
  ballisticSkill: 0,
  intelligence: 0,
  spiritResistance: 0,
  elementalResistance: 0,
  corporealResistance: 0,
  incomingDamage: 0,
  incomingDamagePercent: 0,
  outgoingDamage: 0,
  outgoingDamagePercent: 0,
  armor: 0,
  velocity: 0,
  block: 0,
  parry: 0,
  evade: 0,
  disrupt: 0,
  actionPointRegen: 0,
  moraleRegen: 0,
  cooldown: 0,
  buildTime: 0,
  criticalDamage: 0,
  range: 0,
  radius: 0,
  autoAttackSpeed: 0,
  autoAttackDamage: 0,
  meleePower: 0,
  rangedPower: 0,
  magicPower: 0,
  criticalHitRate: 0,
  meleeCritRate: 0,
  rangedCritRate: 0,
  magicCritRate: 0,
  armorPenetration: 0,
  healingPower: 0,
  healthRegen: 0,
  maxActionPoints: 0,
  fortitude: 0,
  armorPenetrationReduction: 0,
  criticalDamageTakenReduction: 0,
  criticalHitRateReduction: 0,
  blockStrikethrough: 0,
  blockStrikethroughMelee: 0,
  blockStrikethroughRanged: 0,
  blockStrikethroughMagic: 0,
  parryStrikethrough: 0,
  evadeStrikethrough: 0,
  disruptStrikethrough: 0,
  healCritRate: 0,
  mastery1Bonus: 0,
  mastery2Bonus: 0,
  mastery3Bonus: 0,
  outgoingHealPercent: 0,
  incomingHealPercent: 0,
  goldLooted: 0,
  xpReceived: 0,
  renownReceived: 0,
  influenceReceived: 0,
  hateCaused: 0,
  hateReceived: 0,
});

export type RowDef = { key: keyof StatsSummary };

export const rowDefs = {
  base: [
    { key: 'strength' as const },
    { key: 'ballisticSkill' as const },
    { key: 'intelligence' as const },
    { key: 'toughness' as const },
    { key: 'weaponSkill' as const },
    { key: 'initiative' as const },
    { key: 'willpower' as const },
    { key: 'wounds' as const },
  ] satisfies RowDef[],

  defense: [
    { key: 'armor' as const },
    { key: 'spiritResistance' as const },
    { key: 'corporealResistance' as const },
    { key: 'elementalResistance' as const },
    { key: 'block' as const },
    { key: 'parry' as const },
    { key: 'evade' as const },
    { key: 'disrupt' as const },
    { key: 'incomingDamagePercent' as const },
    { key: 'criticalDamageTakenReduction' as const },
    { key: 'armorPenetrationReduction' as const },
    { key: 'criticalHitRateReduction' as const },
    { key: 'fortitude' as const },
  ] satisfies RowDef[],

  melee: [
    { key: 'meleePower' as const },
    { key: 'meleeCritRate' as const },
    { key: 'parryStrikethrough' as const },
    { key: 'blockStrikethroughMelee' as const },
    { key: 'outgoingDamagePercent' as const },
  ] satisfies RowDef[],

  ranged: [
    { key: 'rangedPower' as const },
    { key: 'rangedCritRate' as const },
    { key: 'evadeStrikethrough' as const },
    { key: 'blockStrikethroughRanged' as const },
  ] satisfies RowDef[],

  magic: [
    { key: 'magicPower' as const },
    { key: 'magicCritRate' as const },
    { key: 'disruptStrikethrough' as const },
    { key: 'blockStrikethroughMagic' as const },
  ] satisfies RowDef[],

  offense: [
    { key: 'armorPenetration' as const },
    { key: 'criticalDamage' as const },
    { key: 'autoAttackSpeed' as const },
    { key: 'autoAttackDamage' as const },
  ] satisfies RowDef[],

  healing: [
    { key: 'healingPower' as const },
    { key: 'healCritRate' as const },
    { key: 'outgoingHealPercent' as const },
    { key: 'incomingHealPercent' as const },
  ] satisfies RowDef[],

  other: [
    { key: 'range' as const },
    { key: 'radius' as const },
    { key: 'actionPointRegen' as const },
    { key: 'healthRegen' as const },
    { key: 'moraleRegen' as const },
    { key: 'goldLooted' as const },
    { key: 'xpReceived' as const },
    { key: 'renownReceived' as const },
    { key: 'influenceReceived' as const },
    { key: 'hateCaused' as const },
    { key: 'hateReceived' as const },
  ] satisfies RowDef[],
};

export function computeTotalStatsForSide(
  side: 'A' | 'B',
  id: string | null,
  empty: StatsSummary,
  includeBaseStats: boolean,
  includeDerivedStats: boolean,
): StatsSummary {
  const base = id ? loadoutService.getLoadoutForSide(side) : null;
  let total = id ? { ...empty, ...loadoutService.computeStatsForLoadout(id) } : empty;
  if (!base) return total;

  if (includeBaseStats) {
    const baseStats = getCareerBaseStats(base.career, base.level);
    total = withBaseStats(total, baseStats);
  }

  if (includeDerivedStats) {
    // Derived defenses based on currently displayed totals
    const add = computeDerivedDefenses(total, base.level, { applyDR: APPLY_DR });
    total = {
      ...total,
      block: (total.block || 0) + (add.block || 0),
      parry: (total.parry || 0) + (add.parry || 0),
      evade: (total.evade || 0) + (add.evade || 0),
      disrupt: (total.disrupt || 0) + (add.disrupt || 0),
    };

    const initCritReduc = computeDerivedCritReductionFromInitiative(total, base.level, { applyDR: APPLY_DR });
    total = { ...total, criticalHitRateReduction: (total.criticalHitRateReduction || 0) + initCritReduc };

    const ap = computeDerivedArmorPenetrationFromWeaponSkill(total, base.level, { applyDR: APPLY_DR });
    total = { ...total, armorPenetration: (total.armorPenetration || 0) + ap };

    const ps = computeDerivedParryStrikethroughFromStrength(total, base.level, { applyDR: APPLY_DR });
    total = { ...total, parryStrikethrough: (total.parryStrikethrough || 0) + ps };

    const es = computeDerivedEvadeStrikethroughFromBallisticSkill(total, base.level, { applyDR: APPLY_DR });
    total = { ...total, evadeStrikethrough: (total.evadeStrikethrough || 0) + es };

    const ds = computeDerivedDisruptStrikethroughFromIntelligence(total, base.level, { applyDR: APPLY_DR });
    total = { ...total, disruptStrikethrough: (total.disruptStrikethrough || 0) + ds };

    const bsm = computeDerivedBlockStrikethroughFromStrength(total, base.level, { applyDR: APPLY_DR });
    const bsr = computeDerivedBlockStrikethroughFromBallisticSkill(total, base.level, { applyDR: APPLY_DR });
    const bsg = computeDerivedBlockStrikethroughFromIntelligence(total, base.level, { applyDR: APPLY_DR });
    const itemBST = total.blockStrikethrough || 0; // flat from items
    total = {
      ...total,
      blockStrikethroughMelee: itemBST + bsm,
      blockStrikethroughRanged: itemBST + bsr,
      blockStrikethroughMagic: itemBST + bsg,
    };
  }

  // Fold global crit into specifics
  const globalCrit = total.criticalHitRate || 0;
  if (globalCrit) {
    total = {
      ...total,
      meleeCritRate: (total.meleeCritRate || 0) + globalCrit,
      rangedCritRate: (total.rangedCritRate || 0) + globalCrit,
      magicCritRate: (total.magicCritRate || 0) + globalCrit,
      healCritRate: (total.healCritRate || 0) + globalCrit,
    };
  }

  return total;
}

const derivedLabel = (key: string): string => {
  if (key === 'block') return 'From Toughness';
  if (key === 'parry' || key === 'evade') return 'From Initiative';
  if (key === 'disrupt') return 'From Willpower';
  return 'From Stats';
};

export function buildContributionsForKeyForSide(
  side: 'A' | 'B',
  id: string | null,
  key: keyof StatsSummary | string,
  stats: StatsSummary,
  includeBaseStats: boolean,
  includeDerivedStats: boolean,
): Contribution[] {
  const raw: Contribution[] = id ? loadoutService.getStatContributionsForLoadout(id, key as keyof StatsSummary) : [];
  const base = id ? loadoutService.getLoadoutForSide(side) : null;
  let contrib: Contribution[] = (key === 'blockStrikethroughMelee' || key === 'blockStrikethroughRanged' || key === 'blockStrikethroughMagic')
    ? [
        ...raw,
        ...(id ? loadoutService.getStatContributionsForLoadout(id, 'blockStrikethrough') : []),
      ]
    : raw;

  const extra: Contribution[] = [];

  if (includeDerivedStats && (key === 'block' || key === 'parry' || key === 'evade' || key === 'disrupt')) {
    if (base) {
      const dr = computeDerivedDefenses(stats, base.level, { applyDR: APPLY_DR });
      const derivedVal = Number(dr[key as keyof StatsSummary] ?? 0);
      if (derivedVal !== 0) extra.push({ name: derivedLabel(String(key)), count: 1, totalValue: derivedVal, percentage: true });
    }
  }

  if (includeDerivedStats && base && (key === 'blockStrikethroughMelee' || key === 'blockStrikethroughRanged' || key === 'blockStrikethroughMagic')) {
    if (key === 'blockStrikethroughMelee') {
      const v = computeDerivedBlockStrikethroughFromStrength(stats, base.level, { applyDR: APPLY_DR });
      if (v !== 0) extra.push({ name: 'From Strength', count: 1, totalValue: v, percentage: true });
    } else if (key === 'blockStrikethroughRanged') {
      const v = computeDerivedBlockStrikethroughFromBallisticSkill(stats, base.level, { applyDR: APPLY_DR });
      if (v !== 0) extra.push({ name: 'From Ballistic Skill', count: 1, totalValue: v, percentage: true });
    } else if (key === 'blockStrikethroughMagic') {
      const v = computeDerivedBlockStrikethroughFromIntelligence(stats, base.level, { applyDR: APPLY_DR });
      if (v !== 0) extra.push({ name: 'From Intelligence', count: 1, totalValue: v, percentage: true });
    }
  }

  if (includeBaseStats && base && isBaseStatKey(key)) {
    const baseStats = getCareerBaseStats(base.career, base.level);
    const bs = baseStats[key as BaseStatKey] || 0;
    if (bs !== 0) extra.push({ name: 'From Career', count: 1, totalValue: bs, percentage: false });
  }

  if (key === 'evadeStrikethrough' && base && includeDerivedStats) {
    const es = computeDerivedEvadeStrikethroughFromBallisticSkill(stats, base.level, { applyDR: APPLY_DR });
    if (es !== 0) extra.push({ name: 'From Ballistic Skill', count: 1, totalValue: es, percentage: true });
  }
  if (key === 'criticalHitRateReduction' && base && includeDerivedStats) {
    const fromInit = computeDerivedCritReductionFromInitiative(stats, base.level, { applyDR: APPLY_DR });
    if (fromInit !== 0) extra.push({ name: 'From Initiative', count: 1, totalValue: fromInit, percentage: true });
  }
  if (key === 'armorPenetration' && base && includeDerivedStats) {
    const ap = computeDerivedArmorPenetrationFromWeaponSkill(stats, base.level, { applyDR: APPLY_DR });
    if (ap !== 0) extra.push({ name: 'From Weapon Skill', count: 1, totalValue: ap, percentage: true });
  }
  if (key === 'parryStrikethrough' && base && includeDerivedStats) {
    const ps = computeDerivedParryStrikethroughFromStrength(stats, base.level, { applyDR: APPLY_DR });
    if (ps !== 0) extra.push({ name: 'From Strength', count: 1, totalValue: ps, percentage: true });
  }
  if (key === 'disruptStrikethrough' && base && includeDerivedStats) {
    const ds = computeDerivedDisruptStrikethroughFromIntelligence(stats, base.level, { applyDR: APPLY_DR });
    if (ds !== 0) extra.push({ name: 'From Intelligence', count: 1, totalValue: ds, percentage: true });
  }

  if (key === 'meleeCritRate' || key === 'rangedCritRate' || key === 'magicCritRate' || key === 'healCritRate') {
    const g = id ? loadoutService.getStatContributionsForLoadout(id, 'criticalHitRate') : [];
    if (g.length > 0) contrib = [...contrib, ...g];
  }

  contrib = [...contrib, ...extra];
  return contrib;
}
