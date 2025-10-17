/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsSummary } from '../../types';
import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { isShieldType } from '../../utils/items';
import { getItemColor } from '../../utils/rarityColors';
import { STAT_TO_SUMMARY_KEY, SUMMARY_KEY_TO_STAT } from '../../constants/statMaps';

/**
 * Compute aggregate stats for a specific loadout id.
 * Applies shield-specific handling (armor-as-block) and set bonuses.
 */
export function computeStatsForLoadout(loadoutId: string, opts?: { includeRenown?: boolean }): StatsSummary {
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
  // Apply renown ability bonuses (each level contributes cumulative total per spec)
  const includeRenown = opts?.includeRenown !== false;
  if (includeRenown) {
  const ra = loadout.renownAbilities || {
    might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0, opportunist: 0, spiritualRefinement: 0, regeneration: 0,
    reflexes: 0, defender: 0, deftDefender: 0,
  };
  const levelToTotal = (lvl: number) => {
    // Cumulative totals per provided table: 0,4,16,38,72,120
    const totals = [0, 4, 16, 38, 72, 120];
    return totals[Math.max(0, Math.min(5, Math.trunc(lvl)))];
  };
  (result.strength as number) += levelToTotal(ra.might || 0);
  (result.weaponSkill as number) += levelToTotal(ra.bladeMaster || 0);
  (result.ballisticSkill as number) += levelToTotal(ra.marksman || 0);
  (result.initiative as number) += levelToTotal(ra.impetus || 0);
  (result.intelligence as number) += levelToTotal(ra.acumen || 0);
  (result.willpower as number) += levelToTotal(ra.resolve || 0);
  (result.toughness as number) += levelToTotal(ra.fortitude || 0);
  (result.wounds as number) += levelToTotal(ra.vigor || 0);
  // Opportunist: Offensive Critical Hit affects melee, ranged, magic crit rates (percentage values)
  const oppTable = [0, 2, 5, 9, 14, 14]; // Levels 0..5; cap at IV=14 per request
  const opp = oppTable[Math.max(0, Math.min(5, Math.trunc(ra.opportunist || 0)))];
  (result.meleeCritRate as number) += opp;
  (result.rangedCritRate as number) += opp;
  (result.magicCritRate as number) += opp;
  const srTable = [0, 2, 5, 9, 14, 14];
  const sr = srTable[Math.max(0, Math.min(5, Math.trunc(ra.spiritualRefinement || 0)))];
  (result.healCritRate as number) += sr;
  const regenTable = [0, 7, 17, 35, 35, 35];
  const regen = regenTable[Math.max(0, Math.min(5, Math.trunc(ra.regeneration || 0)))];
  (result.healthRegen as number) += regen;
  // Reflexes (Parry%), Defender (Block%), Deft Defender (Dodge/Disrupt%)
  const defTable = [0, 3, 7, 12, 18, 18];
  const rfx = defTable[Math.max(0, Math.min(5, Math.trunc(ra.reflexes || 0)))];
  const dfn = defTable[Math.max(0, Math.min(5, Math.trunc(ra.defender || 0)))];
  const dd = defTable[Math.max(0, Math.min(5, Math.trunc(ra.deftDefender || 0)))];
  (result.parry as number) += rfx;
  (result.block as number) += dfn;
  (result.evade as number) += dd;
  (result.disrupt as number) += dd;
    // Hardy Concession: applies negative percent to both Incoming and Outgoing Damage
  const hcTable = [0, -1, -3, -6, -10, -15];
  const hc = hcTable[Math.max(0, Math.min(5, Math.trunc((ra as any).hardyConcession || 0)))];
  (result.incomingDamagePercent as number) += hc;
  (result.outgoingDamagePercent as number) += hc;
  // HC also reduces outgoing healing; include as a negative percent modifier
  (result.outgoingHealPercent as number) += hc;

    // Futile Strikes: Critical Hit Rate Reduction
    const fsTable = [0, 3, 8, 15, 24, 24];
    const fs = fsTable[Math.max(0, Math.min(5, Math.trunc((ra as any).futileStrikes || 0)))];
    (result.criticalHitRateReduction as number) += fs;

    // Trivial Blows: Critical Damage Taken Reduction
    const tbTable = [0, 4, 12, 24, 40, 40];
    const tb = tbTable[Math.max(0, Math.min(5, Math.trunc((ra as any).trivialBlows || 0)))];
    (result.criticalDamageTakenReduction as number) += tb;
  }
  return result;
}

/**
 * Return a breakdown of contributions to a given summary stat from items, talismans, and set bonuses.
 */
export function getStatContributionsForLoadout(loadoutId: string, statKey: keyof StatsSummary | string, opts?: { includeRenown?: boolean }) {
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
  // Add Renown contribution for primary stats (optional)
  if (opts?.includeRenown !== false) {
    const ra = loadout.renownAbilities || { might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0, opportunist: 0, spiritualRefinement: 0, regeneration: 0, reflexes: 0, defender: 0, deftDefender: 0 };
    const levelToTotal = (lvl: number) => {
      const totals = [0, 4, 16, 38, 72, 120];
      return totals[Math.max(0, Math.min(5, Math.trunc(lvl)))];
    };
    const roman = (lvl: number) => ['','I','II','III','IV','V'][Math.max(0, Math.min(5, Math.trunc(lvl)))] || '';
    // Primary stat abilities mapping
    const primaryDefs: Array<{ key: keyof typeof ra; label: string; gql: string; sumKey: keyof StatsSummary }>= [
      { key: 'might', label: 'Might', gql: 'STRENGTH', sumKey: 'strength' },
      { key: 'bladeMaster', label: 'Blade Master', gql: 'WEAPON_SKILL', sumKey: 'weaponSkill' },
      { key: 'marksman', label: 'Marksman', gql: 'BALLISTIC_SKILL', sumKey: 'ballisticSkill' },
      { key: 'impetus', label: 'Impetus', gql: 'INITIATIVE', sumKey: 'initiative' },
      { key: 'acumen', label: 'Acumen', gql: 'INTELLIGENCE', sumKey: 'intelligence' },
      { key: 'resolve', label: 'Resolve', gql: 'WILLPOWER', sumKey: 'willpower' },
      { key: 'fortitude', label: 'Fortitude', gql: 'TOUGHNESS', sumKey: 'toughness' },
      { key: 'vigor', label: 'Vigor', gql: 'WOUNDS', sumKey: 'wounds' },
    ];
    primaryDefs.forEach(({ key, label, gql, sumKey }) => {
      const lvl = ra[key] || 0;
      const val = levelToTotal(lvl);
      if (!val) return;
      if (String(statKey) === sumKey || target === gql) {
        const mapKey = `RENOWN|${String(key).toUpperCase()}|${gql}`;
        const prev = res.get(mapKey) || { name: `From Renown (${label} ${roman(lvl)})`, count: 1, totalValue: 0, percentage: false };
        prev.totalValue += val;
        prev.name = `From Renown (${label} ${roman(lvl)})`;
        res.set(mapKey, prev);
      }
    });

    // Opportunist contributions to crit rates
    const oppLvl = Math.max(0, Math.min(5, Math.trunc(ra.opportunist || 0)));
    const oppTable = [0, 2, 5, 9, 14, 14];
    const opp = oppTable[oppLvl];
    if (opp) {
      const maybeAdd = (sumKey: keyof StatsSummary, gql: string) => {
        if (String(statKey) === sumKey || target === gql) {
          const k = 'RENOWN|OPPORTUNIST|' + gql;
          const prev = res.get(k) || { name: `From Renown (Opportunist ${roman(oppLvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += opp;
          prev.name = `From Renown (Opportunist ${roman(oppLvl)})`;
          res.set(k, prev);
        }
      };
      maybeAdd('meleeCritRate', 'MELEE_CRIT_RATE');
      maybeAdd('rangedCritRate', 'RANGED_CRIT_RATE');
      maybeAdd('magicCritRate', 'MAGIC_CRIT_RATE');
    }
    const srLvl = Math.max(0, Math.min(5, Math.trunc(ra.spiritualRefinement || 0)));
    const srTable = [0, 2, 5, 9, 14, 14];
    const sr = srTable[srLvl];
    if (sr) {
      const k = 'RENOWN|SPIRITUAL_REFINEMENT|HEAL_CRIT_RATE';
      if (String(statKey) === 'healCritRate' || target === 'HEAL_CRIT_RATE') {
        const prev = res.get(k) || { name: `From Renown (Spiritual Refinement ${roman(srLvl)})`, count: 1, totalValue: 0, percentage: true };
        prev.totalValue += sr;
        prev.name = `From Renown (Spiritual Refinement ${roman(srLvl)})`;
        res.set(k, prev);
      }
    }
    // Regeneration contributions to healthRegen
    const regenLvl = Math.max(0, Math.min(5, Math.trunc(ra.regeneration || 0)));
    const regenTable = [0, 7, 17, 35, 35, 35];
    const regen = regenTable[regenLvl];
    if (regen) {
      if (String(statKey) === 'healthRegen' || target === 'HEALTH_REGEN') {
        const k = 'RENOWN|REGENERATION|HEALTH_REGEN';
        const prev = res.get(k) || { name: `From Renown (Regeneration ${roman(regenLvl)})`, count: 1, totalValue: 0, percentage: false };
        prev.totalValue += regen;
        prev.name = `From Renown (Regeneration ${roman(regenLvl)})`;
        res.set(k, prev);
      }
    }
    // Reflexes (Parry%)
  const defLvlRfx = Math.max(0, Math.min(5, Math.trunc(ra.reflexes || 0)));
  const defTable = [0, 3, 7, 12, 18, 18];
    const rfx = defTable[defLvlRfx];
    if (rfx) {
      if (String(statKey) === 'parry' || target === 'PARRY') {
        const k = 'RENOWN|REFLEXES|PARRY';
        const prev = res.get(k) || { name: `From Renown (Reflexes ${roman(defLvlRfx)})`, count: 1, totalValue: 0, percentage: true };
        prev.totalValue += rfx;
        prev.name = `From Renown (Reflexes ${roman(defLvlRfx)})`;
        res.set(k, prev);
      }
    }
    // Defender (Block%)
  const defLvlDfn = Math.max(0, Math.min(5, Math.trunc(ra.defender || 0)));
  const dfn = defTable[defLvlDfn];
    if (dfn) {
      if (String(statKey) === 'block' || target === 'BLOCK') {
        const k = 'RENOWN|DEFENDER|BLOCK';
        const prev = res.get(k) || { name: `From Renown (Defender ${roman(defLvlDfn)})`, count: 1, totalValue: 0, percentage: true };
        prev.totalValue += dfn;
        prev.name = `From Renown (Defender ${roman(defLvlDfn)})`;
        res.set(k, prev);
      }
    }
    // Deft Defender (Dodge/Disrupt%)
  const defLvlDd = Math.max(0, Math.min(5, Math.trunc(ra.deftDefender || 0)));
  const dd = defTable[defLvlDd];
    if (dd) {
      const maybeAdd = (sumKey: keyof StatsSummary, gql: string) => {
        if (String(statKey) === sumKey || target === gql) {
          const k = 'RENOWN|DEFT_DEFENDER|' + gql;
          const prev = res.get(k) || { name: `From Renown (Deft Defender ${roman(defLvlDd)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += dd;
          prev.name = `From Renown (Deft Defender ${roman(defLvlDd)})`;
          res.set(k, prev);
        }
      };
      maybeAdd('evade', 'EVADE');
      maybeAdd('disrupt', 'DISRUPT');
    }
    // Hardy Concession contributions
    {
      const lvl = Math.max(0, Math.min(5, Math.trunc((ra as any).hardyConcession || 0)));
      const table = [0, -1, -3, -6, -10, -15];
      const val = table[lvl];
      if (val) {
        const roman = (l: number) => ['', 'I', 'II', 'III', 'IV', 'V'][l] || '';
        if (String(statKey) === 'incomingDamagePercent' || target === 'INCOMING_DAMAGE_PERCENT') {
          const k = 'RENOWN|HARDY_CONCESSION|INCOMING_DAMAGE_PERCENT';
          const prev = res.get(k) || { name: `From Renown (Hardy Concession ${roman(lvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += val;
          prev.name = `From Renown (Hardy Concession ${roman(lvl)})`;
          res.set(k, prev);
        }
        if (String(statKey) === 'outgoingDamagePercent' || target === 'OUTGOING_DAMAGE_PERCENT') {
          const k = 'RENOWN|HARDY_CONCESSION|OUTGOING_DAMAGE_PERCENT';
          const prev = res.get(k) || { name: `From Renown (Hardy Concession ${roman(lvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += val;
          prev.name = `From Renown (Hardy Concession ${roman(lvl)})`;
          res.set(k, prev);
        }
        if (String(statKey) === 'outgoingHealPercent' || target === 'OUTGOING_HEAL_PERCENT') {
          const k = 'RENOWN|HARDY_CONCESSION|OUTGOING_HEAL_PERCENT';
          const prev = res.get(k) || { name: `From Renown (Hardy Concession ${roman(lvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += val;
          prev.name = `From Renown (Hardy Concession ${roman(lvl)})`;
          res.set(k, prev);
        }
      }
    }
    // Futile Strikes contributions
    {
      const lvl = Math.max(0, Math.min(5, Math.trunc((ra as any).futileStrikes || 0)));
      const table = [0, 3, 8, 15, 24, 24];
      const val = table[lvl];
      if (val) {
        const roman = (l: number) => ['', 'I', 'II', 'III', 'IV', 'V'][l] || '';
        if (String(statKey) === 'criticalHitRateReduction' || target === 'CRITICAL_HIT_RATE_REDUCTION') {
          const k = 'RENOWN|FUTILE_STRIKES|CRITICAL_HIT_RATE_REDUCTION';
          const prev = res.get(k) || { name: `From Renown (Futile Strikes ${roman(lvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += val;
          prev.name = `From Renown (Futile Strikes ${roman(lvl)})`;
          res.set(k, prev);
        }
      }
    }
    // Trivial Blows contributions
    {
      const lvl = Math.max(0, Math.min(5, Math.trunc((ra as any).trivialBlows || 0)));
      const table = [0, 4, 12, 24, 40, 40];
      const val = table[lvl];
      if (val) {
        const roman = (l: number) => ['', 'I', 'II', 'III', 'IV', 'V'][l] || '';
        if (String(statKey) === 'criticalDamageTakenReduction' || target === 'CRITICAL_DAMAGE_TAKEN_REDUCTION') {
          const k = 'RENOWN|TRIVIAL_BLOWS|CRITICAL_DAMAGE_TAKEN_REDUCTION';
          const prev = res.get(k) || { name: `From Renown (Trivial Blows ${roman(lvl)})`, count: 1, totalValue: 0, percentage: true };
          prev.totalValue += val;
          prev.name = `From Renown (Trivial Blows ${roman(lvl)})`;
          res.set(k, prev);
        }
      }
    }
  }
  return Array.from(res.values()).filter(r => r.totalValue !== 0).sort((a, b) => b.totalValue - a.totalValue || a.name.localeCompare(b.name));
}
