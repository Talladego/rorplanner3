/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsSummary } from '../../types';
import { loadoutStoreAdapter } from '../../store/loadoutStoreAdapter';
import { isShieldType } from '../../utils/items';
import { getItemColor } from '../../utils/rarityColors';
import { STAT_TO_SUMMARY_KEY, SUMMARY_KEY_TO_STAT } from '../../constants/statMaps';

/**
 * Compute aggregate stats for a specific loadout id.
 * Applies shield-specific handling (armor-as-block) and set bonuses.
 */
export function computeStatsForLoadout(loadoutId: string): StatsSummary {
  const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
  const zero: StatsSummary = {
    strength: 0, agility: 0, willpower: 0, toughness: 0, wounds: 0, initiative: 0,
    weaponSkill: 0, ballisticSkill: 0, intelligence: 0, spiritResistance: 0, elementalResistance: 0, corporealResistance: 0,
    incomingDamage: 0, incomingDamagePercent: 0, outgoingDamage: 0, outgoingDamagePercent: 0,
    armor: 0, velocity: 0, block: 0, parry: 0, evade: 0, disrupt: 0, actionPointRegen: 0, moraleRegen: 0,
    cooldown: 0, buildTime: 0, criticalDamage: 0, range: 0, radius: 0, autoAttackSpeed: 0, autoAttackDamage: 0, meleePower: 0, rangedPower: 0, magicPower: 0,
    criticalHitRate: 0, meleeCritRate: 0, rangedCritRate: 0, magicCritRate: 0, armorPenetration: 0, healingPower: 0, healthRegen: 0, maxActionPoints: 0, fortitude: 0,
    armorPenetrationReduction: 0, criticalDamageTakenReduction: 0, criticalHitRateReduction: 0, blockStrikethrough: 0, blockStrikethroughMelee: 0, blockStrikethroughRanged: 0, blockStrikethroughMagic: 0, parryStrikethrough: 0, evadeStrikethrough: 0, disruptStrikethrough: 0,
    healCritRate: 0, mastery1Bonus: 0, mastery2Bonus: 0, mastery3Bonus: 0, outgoingHealPercent: 0, incomingHealPercent: 0,
    goldLooted: 0, xpReceived: 0, renownReceived: 0, influenceReceived: 0, hateCaused: 0, hateReceived: 0,
  };
  if (!loadout) return zero;
  const statToKey = STAT_TO_SUMMARY_KEY;
  const result = { ...zero };
  const isEligible = (it: any | null): boolean => {
    if (!it) return false;
    const levelOk = !it.levelRequirement || it.levelRequirement <= loadout.level;
    const rrOk = !it.renownRankRequirement || it.renownRankRequirement <= loadout.renownRank;
    return levelOk && rrOk;
  };
  const addStat = (statsArr?: any[]) => {
    (statsArr || []).forEach(s => {
      const key = statToKey[s.stat as string];
      if (key && key in result) {
        (result as any)[key] += Number(s.value) || 0;
      }
    });
  };
  Object.values(loadout.items).forEach(({ item, talismans }) => {
    const itemEligible = isEligible(item);
    if (item && itemEligible) {
      if (item.armor) {
        if (isShieldType(item.type as unknown as string)) {
          const blockFromShield = (Number(item.armor) || 0) / 100 * 3;
          (result.block as number) += blockFromShield;
        } else {
          (result.armor as number) += Number(item.armor) || 0;
        }
      }
      addStat(item.stats);
    }
    (talismans || []).forEach(t => {
      const talismanEligible = isEligible(t);
      if (t && itemEligible && talismanEligible) {
        if (t.armor) (result.armor as number) += Number(t.armor) || 0;
        addStat(t.stats);
      }
    });
  });
  const setCounts: Record<string, { count: number; bonuses: any[] } > = {};
  Object.values(loadout.items).forEach(({ item }) => {
    if (item && item.itemSet && isEligible(item)) {
      const name = item.itemSet.name;
      if (!setCounts[name]) setCounts[name] = { count: 0, bonuses: item.itemSet.bonuses || [] };
      setCounts[name].count += 1;
    }
  });
  Object.values(setCounts).forEach(({ count, bonuses }) => {
    (bonuses || []).forEach((b: any) => {
      if (count >= b.itemsRequired && b.bonus && 'stat' in b.bonus) {
        const key = statToKey[b.bonus.stat];
        if (key) (result as any)[key] += Number(b.bonus.value) || 0;
      }
    });
  });
  return result;
}

/**
 * Return a breakdown of contributions to a given summary stat from items, talismans, and set bonuses.
 */
export function getStatContributionsForLoadout(loadoutId: string, statKey: keyof StatsSummary | string) {
  const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
  if (!loadout) return [] as Array<{ name: string; count: number; totalValue: number; percentage: boolean; color?: string }>;
  const target = SUMMARY_KEY_TO_STAT[String(statKey)] || '';
  const res = new Map<string, { name: string; count: number; totalValue: number; percentage: boolean; color?: string }>();
  const isEligible = (it: any | null): boolean => {
    if (!it) return false;
    const levelOk = !it.levelRequirement || it.levelRequirement <= loadout.level;
    const rrOk = !it.renownRankRequirement || it.renownRankRequirement <= loadout.renownRank;
    return levelOk && rrOk;
  };
  Object.values(loadout.items).forEach(({ item, talismans }) => {
    const itemEligible = isEligible(item);
    if (item && itemEligible) {
      if (target === 'ARMOR' && item.armor) {
        if (!isShieldType(item.type as unknown as string)) {
          const key = item.name + '|armor';
          const prev = res.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: false, color: getItemColor(item) };
          prev.count += 1; prev.totalValue += Number(item.armor) || 0; res.set(key, prev);
        }
      }
      if (target === 'BLOCK' && item.armor && isShieldType(item.type as unknown as string)) {
        const key = item.name + '|shield-block';
        const prev = res.get(key) || { name: item.name + ' (Shield)', count: 0, totalValue: 0, percentage: true, color: getItemColor(item) };
        prev.count += 1; prev.totalValue += ((Number(item.armor) || 0) / 100) * 3; res.set(key, prev);
      }
      (item.stats || []).forEach((s: any) => {
        if (s.stat === target) {
          const key = item.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
          const prev = res.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(item) };
          prev.count += 1; prev.totalValue += Number(s.value) || 0; prev.percentage = !!s.percentage; res.set(key, prev);
        }
      });
    }
    (talismans || []).forEach(t => {
      const talismanEligible = isEligible(t);
      if (t && itemEligible && talismanEligible) {
        if (target === 'ARMOR' && t.armor) {
          const key = t.name + '|armor';
          const prev = res.get(key) || { name: t.name, count: 0, totalValue: 0, percentage: false, color: getItemColor(t) };
          prev.count += 1; prev.totalValue += Number(t.armor) || 0; res.set(key, prev);
        }
        (t.stats || []).forEach((s: any) => {
          if (s.stat === target) {
            const key = t.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
            const prev = res.get(key) || { name: t.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(t) };
            prev.count += 1; prev.totalValue += Number(s.value) || 0; prev.percentage = !!s.percentage; res.set(key, prev);
          }
        });
      }
    });
  });
  const counts: Record<string, number> = {};
  const bonusesMap: Record<string, any[]> = {};
  Object.values(loadout.items).forEach(({ item }) => {
    if (item && item.itemSet && isEligible(item)) {
      const name = item.itemSet.name;
      counts[name] = (counts[name] || 0) + 1;
      if (!bonusesMap[name]) bonusesMap[name] = item.itemSet.bonuses || [];
    }
  });
  Object.entries(bonusesMap).forEach(([setName, bonuses]) => {
    const pieces = counts[setName] || 0;
    bonuses.forEach((b: any) => {
      if (pieces >= b.itemsRequired && b.bonus && 'stat' in b.bonus) {
        const s = b.bonus;
        if (s.stat === target) {
          const key = setName + '|set|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
          const prev = res.get(key) || { name: setName, count: 1, totalValue: 0, percentage: !!s.percentage, color: '#4ade80' };
          prev.count = 1; prev.totalValue += Number(s.value) || 0; prev.percentage = !!s.percentage; res.set(key, prev);
        }
      }
    });
  });
  return Array.from(res.values()).filter(r => r.totalValue !== 0).sort((a, b) => b.totalValue - a.totalValue || a.name.localeCompare(b.name));
}
