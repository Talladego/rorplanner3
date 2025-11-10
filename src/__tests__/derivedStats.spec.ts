import {
  applyDR,
  computeDerivedDefenses,
  computeDerivedCritReductionFromInitiative,
  computeDerivedArmorPenetrationFromWeaponSkill,
  computeDerivedParryStrikethroughFromStrength,
  computeDerivedEvadeStrikethroughFromBallisticSkill,
  computeDerivedDisruptStrikethroughFromIntelligence,
  computeDerivedBlockStrikethroughFromStrength,
  computeDerivedBlockStrikethroughFromBallisticSkill,
  computeDerivedBlockStrikethroughFromIntelligence,
} from '../utils/derivedStats';
import type { StatsSummary } from '../types';

const zeroStats: StatsSummary = {
  strength: 0, agility: 0, willpower: 0, toughness: 0, wounds: 0, initiative: 0,
  weaponSkill: 0, ballisticSkill: 0, intelligence: 0, spiritResistance: 0,
  elementalResistance: 0, corporealResistance: 0, incomingDamage: 0, incomingDamagePercent: 0,
  outgoingDamage: 0, outgoingDamagePercent: 0, armor: 0, velocity: 0, block: 0,
  parry: 0, evade: 0, disrupt: 0, actionPointRegen: 0, moraleRegen: 0, cooldown: 0, buildTime: 0,
  criticalDamage: 0, range: 0, radius: 0, autoAttackSpeed: 0, autoAttackDamage: 0,
  meleePower: 0, rangedPower: 0, magicPower: 0, criticalHitRate: 0, meleeCritRate: 0,
  rangedCritRate: 0, magicCritRate: 0, armorPenetration: 0, healingPower: 0, healthRegen: 0,
  maxActionPoints: 0, fortitude: 0, armorPenetrationReduction: 0, criticalDamageTakenReduction: 0,
  criticalHitRateReduction: 0, blockStrikethrough: 0, blockStrikethroughMelee: 0,
  blockStrikethroughRanged: 0, blockStrikethroughMagic: 0, parryStrikethrough: 0,
  evadeStrikethrough: 0, disruptStrikethrough: 0, healCritRate: 0, mastery1Bonus: 0,
  mastery2Bonus: 0, mastery3Bonus: 0, outgoingHealPercent: 0, incomingHealPercent: 0,
  goldLooted: 0, xpReceived: 0, renownReceived: 0, influenceReceived: 0, hateCaused: 0, hateReceived: 0,
};

describe('derivedStats utils', () => {
  it('applyDR thresholds and cap', () => {
    const level = 40; // threshold=1050, cap=1650
    expect(applyDR(500, level)).toBe(500);
  expect(applyDR(1250, level)).toBe(1150); // 1050 + (200/2)=1150
    expect(applyDR(5000, level)).toBe(1650); // capped
  });

  it('computeDerivedDefenses without DR and with DR', () => {
    const stats = { ...zeroStats, initiative: 200, willpower: 300, toughness: 400 };
    const lvl = 40;
    const noDR = computeDerivedDefenses(stats, lvl, { applyDR: false });
    expect(noDR.parry).toBeCloseTo(6); // 200/100*3
    expect(noDR.evade).toBeCloseTo(6);
    expect(noDR.disrupt).toBeCloseTo(9); // 300/100*3
    expect(noDR.block).toBeCloseTo(2); // 400/200

  const withDR = computeDerivedDefenses(stats, lvl, { applyDR: true });
  // Values should not increase when applying DR
  expect((withDR.parry ?? 0)).toBeLessThanOrEqual((noDR.parry ?? 0));
  expect((withDR.evade ?? 0)).toBeLessThanOrEqual((noDR.evade ?? 0));
  expect((withDR.disrupt ?? 0)).toBeLessThanOrEqual((noDR.disrupt ?? 0));
  expect((withDR.block ?? 0)).toBeLessThanOrEqual((noDR.block ?? 0));
  });

  it('computeDerivedCritReductionFromInitiative applies DR when above threshold by default', () => {
    const stats = { ...zeroStats, initiative: 1300 }; // above threshold -> DR halves excess
    const lvl = 40;
    const rawNoDr = (1300 / 100) * 5; // 65
    const v = computeDerivedCritReductionFromInitiative(stats, lvl); // should be less than rawNoDr
    expect(v).toBeLessThan(rawNoDr);
    expect(v).toBeGreaterThan(0);
  });

  it('armor penetration from WS behaves with level ratio and DR toggle', () => {
    const stats = { ...zeroStats, weaponSkill: 600 };
    const lvl = 40;
    const noDR = computeDerivedArmorPenetrationFromWeaponSkill(stats, lvl, {});
    const withDR = computeDerivedArmorPenetrationFromWeaponSkill(stats, lvl, { applyDR: true });
    expect(withDR).toBeLessThanOrEqual(noDR);
  });

  it('strikethroughs from primary stats', () => {
    const lvl = 40;
    expect(computeDerivedParryStrikethroughFromStrength({ ...zeroStats, strength: 400 }, lvl, { applyDR: false })).toBeCloseTo(4);
    expect(computeDerivedEvadeStrikethroughFromBallisticSkill({ ...zeroStats, ballisticSkill: 350 }, lvl, { applyDR: false })).toBeCloseTo(3.5);
    expect(computeDerivedDisruptStrikethroughFromIntelligence({ ...zeroStats, intelligence: 270 }, lvl, { applyDR: false })).toBeCloseTo(2.7);
    expect(computeDerivedBlockStrikethroughFromStrength({ ...zeroStats, strength: 400 }, lvl, { applyDR: false })).toBeCloseTo(2);
    expect(computeDerivedBlockStrikethroughFromBallisticSkill({ ...zeroStats, ballisticSkill: 300 }, lvl, { applyDR: false })).toBeCloseTo(1.5);
    expect(computeDerivedBlockStrikethroughFromIntelligence({ ...zeroStats, intelligence: 200 }, lvl, { applyDR: false })).toBeCloseTo(1);
  });
});
