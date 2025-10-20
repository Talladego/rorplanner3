import { Career, StatsSummary } from '../types';
import GENERATED_CAREER_BASE_STATS from './careerBaseStats.generated';

// Base stat keys we support from provided data and used in Compare panel
export type BaseStatKey =
  | 'strength'
  | 'willpower'
  | 'toughness'
  | 'wounds'
  | 'initiative'
  | 'weaponSkill'
  | 'ballisticSkill'
  | 'intelligence';

export type BaseStats = Record<BaseStatKey, number>;

// Data structure: per career → per level → base stats (with no gear)
// Seeded with level 1 values provided by user. Add level 40 anchors when available.
// Merge generated full per-level stats with any hand-maintained anchors as fallback/overrides
const MANUAL_CAREER_BASE_STATS: Partial<Record<Career, Record<number, BaseStats>>> = {
  [Career.IRON_BREAKER]: {
    1: { strength: 50, willpower: 55, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 60, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 147, ballisticSkill: 98, intelligence: 74, toughness: 221, weaponSkill: 196, initiative: 123, willpower: 172, wounds: 606 },
  },
  [Career.SLAYER]: {
    1: { strength: 65, willpower: 45, toughness: 55, wounds: 50, initiative: 50, weaponSkill: 60, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 221, ballisticSkill: 96, intelligence: 72, toughness: 172, weaponSkill: 197, initiative: 148, willpower: 123, wounds: 518 },
  },
  [Career.RUNE_PRIEST]: {
    1: { strength: 50, willpower: 55, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 60, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 98, ballisticSkill: 74, intelligence: 226, toughness: 172, weaponSkill: 120, initiative: 147, willpower: 222, wounds: 391 },
  },
  [Career.ENGINEER]: {
    1: { strength: 40, willpower: 45, toughness: 55, wounds: 50, initiative: 60, weaponSkill: 50, ballisticSkill: 65, intelligence: 35 },
    40: { strength: 137, ballisticSkill: 221, intelligence: 74, toughness: 172, weaponSkill: 108, initiative: 196, willpower: 123, wounds: 440 },
  },
  [Career.BLACK_ORC]: {
    1: { strength: 55, willpower: 50, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 60, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 172, ballisticSkill: 98, intelligence: 74, toughness: 221, weaponSkill: 196, initiative: 123, willpower: 147, wounds: 606 },
  },
  [Career.CHOPPA]: {
    1: { strength: 65, willpower: 45, toughness: 50, wounds: 50, initiative: 60, weaponSkill: 55, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 221, ballisticSkill: 98, intelligence: 74, toughness: 147, weaponSkill: 172, initiative: 196, willpower: 123, wounds: 518 },
  },
  [Career.SHAMAN]: {
    1: { strength: 40, willpower: 65, toughness: 50, wounds: 40, initiative: 55, weaponSkill: 45, ballisticSkill: 35, intelligence: 60 },
    26: { strength: 77, ballisticSkill: 60, intelligence: 147, toughness: 112, weaponSkill: 95, initiative: 130, willpower: 165, wounds: 265 },
    40: { strength: 98, ballisticSkill: 74, intelligence: 196, toughness: 147, weaponSkill: 123, initiative: 172, willpower: 221, wounds: 391 },
  },
  [Career.SQUIG_HERDER]: {
    1: { strength: 50, willpower: 40, toughness: 45, wounds: 50, initiative: 60, weaponSkill: 55, ballisticSkill: 65, intelligence: 35 },
    40: { strength: 147, ballisticSkill: 221, intelligence: 74, toughness: 123, weaponSkill: 172, initiative: 196, willpower: 98, wounds: 440 },
  },
  [Career.WITCH_HUNTER]: {
    1: { strength: 55, willpower: 40, toughness: 45, wounds: 50, initiative: 60, weaponSkill: 65, ballisticSkill: 65, intelligence: 35 },
    40: { strength: 172, ballisticSkill: 123, intelligence: 74, toughness: 142, weaponSkill: 226, initiative: 196, willpower: 118, wounds: 518 },
  },
  [Career.KNIGHT_OF_THE_BLAZING_SUN]: {
    1: { strength: 60, willpower: 50, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 55, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 197, ballisticSkill: 74, intelligence: 99, toughness: 221, weaponSkill: 172, initiative: 123, willpower: 148, wounds: 606 },
  },
  [Career.BRIGHT_WIZARD]: {
    1: { strength: 40, willpower: 60, toughness: 50, wounds: 40, initiative: 55, weaponSkill: 45, ballisticSkill: 35, intelligence: 65 },
    40: { strength: 99, ballisticSkill: 74, intelligence: 221, toughness: 148, weaponSkill: 123, initiative: 172, willpower: 197, wounds: 391 },
  },
  [Career.WARRIOR_PRIEST]: {
    1: { strength: 55, willpower: 65, toughness: 50, wounds: 50, initiative: 45, weaponSkill: 60, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 172, ballisticSkill: 74, intelligence: 99, toughness: 148, weaponSkill: 196, initiative: 123, willpower: 221, wounds: 440 },
  },
  [Career.CHOSEN]: {
    1: { strength: 60, willpower: 50, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 55, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 197, ballisticSkill: 74, intelligence: 99, toughness: 221, weaponSkill: 172, initiative: 123, willpower: 148, wounds: 606 },
  },
  [Career.MARAUDER]: {
    1: { strength: 65, willpower: 60, toughness: 50, wounds: 50, initiative: 45, weaponSkill: 55, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 221, ballisticSkill: 99, intelligence: 74, toughness: 148, weaponSkill: 172, initiative: 123, willpower: 197, wounds: 518 },
  },
  [Career.ZEALOT]: {
    1: { strength: 40, willpower: 65, toughness: 55, wounds: 40, initiative: 50, weaponSkill: 45, ballisticSkill: 35, intelligence: 60 },
    40: { strength: 99, ballisticSkill: 74, intelligence: 196, toughness: 147, weaponSkill: 123, initiative: 172, willpower: 221, wounds: 391 },
  },
  [Career.MAGUS]: {
    1: { strength: 40, willpower: 55, toughness: 50, wounds: 40, initiative: 60, weaponSkill: 45, ballisticSkill: 35, intelligence: 65 },
    40: { strength: 98, ballisticSkill: 74, intelligence: 221, toughness: 147, weaponSkill: 123, initiative: 196, willpower: 172, wounds: 391 },
  },
  [Career.SWORD_MASTER]: {
    1: { strength: 50, willpower: 40, toughness: 60, wounds: 60, initiative: 55, weaponSkill: 65, ballisticSkill: 35, intelligence: 45 },
    40: { strength: 147, ballisticSkill: 74, intelligence: 123, toughness: 196, weaponSkill: 221, initiative: 172, willpower: 98, wounds: 606 },
  },
  [Career.SHADOW_WARRIOR]: {
    1: { strength: 55, willpower: 40, toughness: 45, wounds: 50, initiative: 50, weaponSkill: 60, ballisticSkill: 65, intelligence: 35 },
    20: { strength: 112, ballisticSkill: 141, intelligence: 54, toughness: 83, weaponSkill: 126, initiative: 97, willpower: 68, wounds: 240 },
    40: { strength: 172, ballisticSkill: 221, intelligence: 74, toughness: 123, weaponSkill: 196, initiative: 147, willpower: 98, wounds: 440 },
  },
  [Career.WHITE_LION]: {
    1: { strength: 60, willpower: 45, toughness: 50, wounds: 50, initiative: 55, weaponSkill: 65, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 196, ballisticSkill: 74, intelligence: 98, toughness: 147, weaponSkill: 221, initiative: 172, willpower: 123, wounds: 518 },
  },
  [Career.ARCHMAGE]: {
    1: { strength: 40, willpower: 65, toughness: 50, wounds: 40, initiative: 55, weaponSkill: 45, ballisticSkill: 35, intelligence: 60 },
    16: { strength: 62, ballisticSkill: 50, intelligence: 112, toughness: 87, weaponSkill: 75, initiative: 100, willpower: 125, wounds: 175 },
    30: { strength: 83, ballisticSkill: 64, intelligence: 161, toughness: 122, weaponSkill: 103, initiative: 142, willpower: 181, wounds: 301 },
    40: { strength: 98, ballisticSkill: 74, intelligence: 196, toughness: 147, weaponSkill: 123, initiative: 172, willpower: 221, wounds: 391 },
  },
  [Career.BLACK_GUARD]: {
    1: { strength: 50, willpower: 55, toughness: 65, wounds: 60, initiative: 45, weaponSkill: 60, ballisticSkill: 40, intelligence: 35 },
    40: { strength: 147, ballisticSkill: 98, intelligence: 74, toughness: 182, weaponSkill: 216, initiative: 162, willpower: 133, wounds: 606 },
  },
  [Career.WITCH_ELF]: {
    1: { strength: 55, willpower: 50, toughness: 45, wounds: 50, initiative: 65, weaponSkill: 60, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 172, ballisticSkill: 74, intelligence: 98, toughness: 137, weaponSkill: 196, initiative: 221, willpower: 147, wounds: 518 },
  },
  [Career.DISCIPLE_OF_KHAINE]: {
    1: { strength: 55, willpower: 65, toughness: 50, wounds: 50, initiative: 45, weaponSkill: 60, ballisticSkill: 35, intelligence: 40 },
    40: { strength: 172, ballisticSkill: 74, intelligence: 98, toughness: 147, weaponSkill: 196, initiative: 123, willpower: 221, wounds: 440 },
  },
  // Note: API enum is SORCERER while the CSV used Sorceress
  [Career.SORCERER]: {
    1: { strength: 40, willpower: 60, toughness: 50, wounds: 40, initiative: 55, weaponSkill: 45, ballisticSkill: 35, intelligence: 65 },
    40: { strength: 98, ballisticSkill: 74, intelligence: 221, toughness: 147, weaponSkill: 123, initiative: 172, willpower: 196, wounds: 391 },
  },
};

// Combine generated and manual, where manual entries override when both present
const merged: Partial<Record<Career, Record<number, BaseStats>>> = { ...GENERATED_CAREER_BASE_STATS };
for (const career of Object.keys(MANUAL_CAREER_BASE_STATS) as Career[]) {
  const manual = MANUAL_CAREER_BASE_STATS[career]!;
  const generatedForCareer = (GENERATED_CAREER_BASE_STATS as Partial<Record<Career, Record<number, BaseStats>>>)[career] || {};
  merged[career] = { ...generatedForCareer, ...manual } as Record<number, BaseStats>;
}

export const CAREER_BASE_STATS = merged as Record<Career, Record<number, BaseStats>>;

const ZERO_BASE: BaseStats = {
  strength: 0,
  willpower: 0,
  toughness: 0,
  wounds: 0,
  initiative: 0,
  weaponSkill: 0,
  ballisticSkill: 0,
  intelligence: 0,
};

// Returns base stats for a given career+level using exact values when present.
// If both a lower and higher anchor exist, performs linear interpolation.
// If only one anchor exists, returns the nearest known anchor.
export function getCareerBaseStats(career: Career | null | undefined, level: number): BaseStats {
  if (!career || !CAREER_BASE_STATS[career]) return ZERO_BASE;
  const perLevel = CAREER_BASE_STATS[career];
  if (perLevel[level]) return perLevel[level];
  const levels = Object.keys(perLevel).map(n => Number(n)).sort((a, b) => a - b);
  const lower = [...levels].filter(l => l < level).pop();
  const upper = levels.find(l => l > level);
  if (lower != null && upper == null) {
    if (typeof window !== 'undefined' && level === 40 && !perLevel[40]) {
      // Informative warning to surface missing level-40 anchors during development
      console.warn(`[BaseStats] Missing level-40 anchor for ${career}. Using nearest lower anchor (level ${lower}).`);
    }
    return perLevel[lower];
  }
  if (upper != null && lower == null) return perLevel[upper];
  if (lower != null && upper != null) {
    const lo = perLevel[lower];
    const hi = perLevel[upper];
    const t = (level - lower) / (upper - lower);
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
    return {
      strength: lerp(lo.strength, hi.strength),
      willpower: lerp(lo.willpower, hi.willpower),
      toughness: lerp(lo.toughness, hi.toughness),
      wounds: lerp(lo.wounds, hi.wounds),
      initiative: lerp(lo.initiative, hi.initiative),
      weaponSkill: lerp(lo.weaponSkill, hi.weaponSkill),
      ballisticSkill: lerp(lo.ballisticSkill, hi.ballisticSkill),
      intelligence: lerp(lo.intelligence, hi.intelligence),
    };
  }
  return ZERO_BASE;
}

// Utility to add base stats into a StatsSummary clone (only base-keys are affected)
export function withBaseStats(summary: StatsSummary, base: BaseStats): StatsSummary {
  return {
    ...summary,
    strength: (summary.strength || 0) + base.strength,
    willpower: (summary.willpower || 0) + base.willpower,
    toughness: (summary.toughness || 0) + base.toughness,
    wounds: (summary.wounds || 0) + base.wounds,
    initiative: (summary.initiative || 0) + base.initiative,
    weaponSkill: (summary.weaponSkill || 0) + base.weaponSkill,
    ballisticSkill: (summary.ballisticSkill || 0) + base.ballisticSkill,
    intelligence: (summary.intelligence || 0) + base.intelligence,
  } as StatsSummary;
}

export function isBaseStatKey(key: string): key is BaseStatKey {
  return (
    key === 'strength' || key === 'willpower' || key === 'toughness' || key === 'wounds' ||
    key === 'initiative' || key === 'weaponSkill' || key === 'ballisticSkill' || key === 'intelligence'
  );
}
