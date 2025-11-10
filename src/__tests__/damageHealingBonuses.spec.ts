import { describe, it, expect } from 'vitest';
import { computeMeleeDamageBonus, computeRangedDamageBonus, computeMagicDamageBonus, computeHealingBonus, computeAllDamageHealingBonuses } from '../utils/damageHealingBonuses';

const makeSummary = (over: Partial<import('../types').StatsSummary>): import('../types').StatsSummary => ({
  strength: 0, agility: 0, willpower: 0, toughness: 0, wounds: 0, initiative: 0,
  weaponSkill: 0, ballisticSkill: 0, intelligence: 0, spiritResistance: 0, elementalResistance: 0, corporealResistance: 0,
  incomingDamage: 0, incomingDamagePercent: 0, outgoingDamage: 0, outgoingDamagePercent: 0,
  armor: 0, velocity: 0, block: 0, parry: 0, evade: 0, disrupt: 0, actionPointRegen: 0, moraleRegen: 0,
  cooldown: 0, buildTime: 0, criticalDamage: 0, range: 0, radius: 0, autoAttackSpeed: 0, autoAttackDamage: 0, meleePower: 0, rangedPower: 0, magicPower: 0,
  criticalHitRate: 0, meleeCritRate: 0, rangedCritRate: 0, magicCritRate: 0, armorPenetration: 0, healingPower: 0, healthRegen: 0, maxActionPoints: 0, fortitude: 0,
  armorPenetrationReduction: 0, criticalDamageTakenReduction: 0, criticalHitRateReduction: 0, blockStrikethrough: 0, blockStrikethroughMelee: 0, blockStrikethroughRanged: 0, blockStrikethroughMagic: 0, parryStrikethrough: 0, evadeStrikethrough: 0, disruptStrikethrough: 0,
  healCritRate: 0, mastery1Bonus: 0, mastery2Bonus: 0, mastery3Bonus: 0, outgoingHealPercent: 0, incomingHealPercent: 0,
  goldLooted: 0, xpReceived: 0, renownReceived: 0, influenceReceived: 0, hateCaused: 0, hateReceived: 0,
  ...over,
});

describe('damage/healing bonus calculations', () => {
  it('computes melee bonus = strength/5 + meleePower/5', () => {
    const summary = makeSummary({ strength: 500, meleePower: 125 }); // 100 + 25 = 125
    expect(computeMeleeDamageBonus(summary)).toBe(125);
  });
  it('computes ranged bonus = ballisticSkill/5 + rangedPower/5', () => {
    const summary = makeSummary({ ballisticSkill: 245, rangedPower: 55 }); // 49 + 11 = 60 -> one decimal rounding results 60
    expect(computeRangedDamageBonus(summary)).toBe(60);
  });
  it('computes magic bonus = intelligence/5 + magicPower/5', () => {
    const summary = makeSummary({ intelligence: 301, magicPower: 99 }); // 60.2 + 19.8 = 80.0 (rounded)
    expect(computeMagicDamageBonus(summary)).toBe(80);
  });
  it('computes healing bonus = willpower/5 + healingPower/5', () => {
    const summary = makeSummary({ willpower: 405, healingPower: 95 }); // 81 + 19 = 100
    expect(computeHealingBonus(summary)).toBe(100);
  });
  it('bulk helper returns all four plus outgoing percents', () => {
    const summary = makeSummary({ strength: 100, meleePower: 50, ballisticSkill: 80, rangedPower: 20, intelligence: 90, magicPower: 10, willpower: 70, healingPower: 30, outgoingDamagePercent: 12, outgoingHealPercent: 5 });
    const all = computeAllDamageHealingBonuses(summary);
    expect(all).toEqual({
      meleeDamageBonus: 30, // 20 + 10
      rangedDamageBonus: 20, // 16 + 4
      magicDamageBonus: 20, // 18 + 2
      healingBonus: 20, // 14 + 6
      outgoingDamagePercent: 12,
      outgoingHealPercent: 5,
    });
  });
  it('supports DR option (simple smoke test)', () => {
    const summary = makeSummary({ strength: 1200, meleePower: 0 });
    const noDr = computeMeleeDamageBonus(summary, { applyDR: false }); // 240
    const withDr = computeMeleeDamageBonus(summary, { applyDR: true, level: 40 });
    expect(noDr).toBe(240);
    expect(withDr).toBeLessThan(noDr); // DR reduces large stat values
  });
});
