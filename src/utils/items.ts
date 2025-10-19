// Item-related utility helpers
import { DPS_THRESHOLDS } from '../constants/dpsThresholds';
import type { Item } from '../types';

/**
 * Returns true if the provided item type string represents a shield.
 * The API encodes shields with one of these type identifiers and also uses the
 * `armor` field to carry block rating for shields (instead of actual armor).
 */
export function isShieldType(t: string | undefined): boolean {
  return t === 'BASIC_SHIELD' || t === 'SHIELD' || t === 'EXPERT_SHIELD';
}

/**
 * Determine if an item is a weapon based on its type field.
 * This uses known weapon ItemType strings from the schema.
 */
export function isWeaponType(t: string | undefined): boolean {
  if (!t) return false;
  return [
    'SWORD', 'AXE', 'HAMMER', 'STAFF', 'DAGGER', 'SPEAR', 'PISTOL', 'LANCE',
    'BOW', 'CROSSBOW', 'REPEATING_CROSSBOW', 'GUN',
  ].includes(t);
}

// Note: name tokens and speed were evaluated and found unreliable; omitted by design

/** Lightweight ranged weapon test based on type */
export function isRangedWeaponType(t?: string): boolean {
  return t === 'BOW' || t === 'CROSSBOW' || t === 'REPEATING_CROSSBOW' || t === 'GUN';
}

// Conservative, ratio-first 2H detection with levelRequirement bands
const DPS_2H_THRESHOLDS_L36_40: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 581,
  RARE: 611,
  VERY_RARE: 696,
  MYTHIC: 690.5,
};

function inferTwoHandedWeapon(item: {
  slot?: string;
  type?: string;
  dps?: number;
  itemLevel?: number;
  talismanSlots?: number;
  levelRequirement?: number;
  rarity?: string;
} | null | undefined): boolean {
  if (!item) return false;
  const slot = item.slot || '';
  const type = item.type || '';
  if (!isWeaponType(type)) return false;
  // Semantic override: staves are two-handed melee weapons
  if (type === 'STAFF' && slot === 'MAIN_HAND') return true;
  // Always treat OFF_HAND/EITHER_HAND as one-handed
  if (slot === 'EITHER_HAND' || slot === 'OFF_HAND') return false;
  // Ranged weapons are not considered 2H in melee hand logic
  if (slot === 'RANGED_WEAPON' || isRangedWeaponType(type)) return false;
  if (slot !== 'MAIN_HAND') return false;

  const ilvl = Number(item.itemLevel || 0);
  const dps = Number(item.dps || 0);
  const lvlReq = Number(item.levelRequirement || 0);
  const rarity = String(item.rarity || '').toUpperCase();
  if (ilvl <= 0) return false;
  const ratio = lvlReq > 0 ? (dps / lvlReq) : 0;
  const tls = Number(item.talismanSlots || 0);
  // Use per-rarity, per-level DPS bands when available (levels typically 16–40)
  const bands = DPS_THRESHOLDS[rarity] && DPS_THRESHOLDS[rarity][lvlReq];
  if (bands) {
    const { oneHandMax, twoHandMin } = bands;
    // Only treat as 2H if the learned lower 2H bound is meaningfully above the 1H max.
    // This guards against degenerate bands at very low levels where both can be zero.
    if (twoHandMin > oneHandMax && dps >= twoHandMin) return true;
    if (dps <= oneHandMax) return false;
    // Low-level near-bound confirm: if within 1 DPS below the 2H lower bound at low levels, and with socketing signal, accept as 2H
    if (twoHandMin > oneHandMax && lvlReq <= 10 && tls >= 2 && (twoHandMin - dps) <= 1) return true;
    // Low-level near-lower-bound confirm: slightly above the 1H max, strong socket/ratio signal
    if (twoHandMin > oneHandMax && lvlReq <= 10 && tls >= 2) {
      const deltaLower = dps - oneHandMax;
      if (deltaLower >= 0 && deltaLower <= 3 && ratio >= 20.0) return true;
    }
    // Mid-20s heuristic (lvl 26–28, UNCOMMON only): accept items high in the gap (helps UNCOMMON lvl 27 2H at 493 DPS)
    if (twoHandMin > oneHandMax && rarity === 'UNCOMMON' && lvlReq >= 26 && lvlReq <= 28) {
      const gap = twoHandMin - oneHandMax;
      if (gap > 0) {
        const threshold = oneHandMax + 0.15 * gap;
        if (dps >= threshold) return true;
      }
    }
    // UNCOMMON lvl 23: dataset shows two-handed clusters at ~412/424/435 DPS while 1H caps at ~410.
    // The generated twoHandMin is conservative at this tier, so accept any value just above oneHandMax.
    if (twoHandMin > oneHandMax && rarity === 'UNCOMMON' && lvlReq === 23) {
      if (dps > oneHandMax) return true;
    }
    // Ambiguous gap: be conservative; require extra confirmation to mark as 2H
    // Mid-level heuristic (31–35): accept items with sockets that sit sufficiently high in the gap
    if (twoHandMin > oneHandMax && lvlReq >= 31 && lvlReq <= 35 && tls >= 2) {
      const gap = twoHandMin - oneHandMax;
      if (gap > 0) {
        const threshold = oneHandMax + 0.15 * gap; // upper 15% of gap above 1H max
        if (dps >= threshold) return true;
      }
    }
    // High-level heuristic (lvl>=36): bands use midpoint for twoHandMin.
    // - With sockets (tls>=2): allow upper half of gap
    // - Without sockets: allow upper 40% of gap
    if (twoHandMin > oneHandMax && lvlReq >= 36) {
      const gap = twoHandMin - oneHandMax;
      if (gap > 0) {
        if (tls >= 2 && dps >= (twoHandMin - 0.5 * gap)) return true;
        if (dps >= (oneHandMax + 0.4 * gap)) return true;
      }
    }
  // No generic ratio-based confirm here: stay conservative and rely on bands + narrow, level-aware rules.
    return false;
  }

  // Fallback legacy rules if no bands available
  if (lvlReq >= 16 && lvlReq <= 30) {
    if (ratio >= 23.9) return true;
    if (ratio >= 20.5 && tls >= 2) return true;
    return false;
  }
  if (lvlReq >= 31 && lvlReq <= 35) {
    // COMMON: use an absolute DPS floor observed for high-level common 2H (e.g., Arksteel at lvl ~33)
    if (rarity === 'COMMON' && dps >= 320) return true;
    if (ratio >= 21.5) return true;
    if (ratio >= 20.0 && tls >= 2) return true;
    return false;
  }
  if (lvlReq >= 36) {
    const thr = DPS_2H_THRESHOLDS_L36_40[rarity] ?? 0;
    if (thr > 0 && dps >= thr) return true;
    if (thr > 0 && tls >= 2 && dps >= (thr * 0.97)) return true;
    return false;
  }
  return false;
}

/**
 * Heuristic for two-handed detection.
 * Uses slot quick-paths and falls back to inferTwoHandedWeapon for MAIN_HAND.
 */
export function isTwoHandedWeapon(item: Pick<Item, 'slot' | 'type' | 'dps' | 'itemLevel' | 'talismanSlots' | 'levelRequirement' | 'rarity'> | null | undefined): boolean {
  if (!item) return false;
  const slot = item.slot || '';
  const t = item.type || '';
  if (!isWeaponType(t)) return false;
  if (slot === 'EITHER_HAND' || slot === 'OFF_HAND') return false;
  if (slot === 'RANGED_WEAPON') return false;
  if (slot === 'MAIN_HAND') return inferTwoHandedWeapon(item as Item);
  return false;
}

export function isOneHandedWeapon(item: { slot?: string; type?: string } | null | undefined): boolean {
  if (!item) return false;
  const slot = item.slot || '';
  const t = item.type || '';
  if (!isWeaponType(t)) return false;
  return slot === 'EITHER_HAND' || slot === 'OFF_HAND';
}
