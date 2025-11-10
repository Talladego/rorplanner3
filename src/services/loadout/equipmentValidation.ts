/* Shared item/talisman eligibility and validation logic */
import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import * as selectors from './selectors';
import { EquipSlot, Item, Career, CAREER_RACE_MAPPING } from '../../types';
import { isTwoHandedWeapon } from '../../utils/items';
import { getOffhandBlockReason, STAFF_ONLY_CAREERS, TWO_H_ONLY_CAREERS, CANNOT_USE_2H_MELEE } from '../../constants/careerWeaponRules';

export function isUniqueItemAlreadyEquippedInLoadout(itemId: string, loadoutId?: string): boolean {
  return selectors.isUniqueItemAlreadyEquippedInLoadout(itemId, loadoutId);
}

export function canEquipUniqueItem(item: Item, loadoutId?: string): { canEquip: boolean; reason?: string } {
  if (!item.uniqueEquipped) return { canEquip: true };
  if (isUniqueItemAlreadyEquippedInLoadout(item.id, loadoutId)) {
    return { canEquip: false, reason: 'This unique item is already equipped' };
  }
  return { canEquip: true };
}

export function getItemEligibility(slot: EquipSlot, item: Item | null, loadoutId?: string): { eligible: boolean; reasons: string[] } {
  const loadout = loadoutId
    ? loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId) || null
    : loadoutStoreAdapter.getCurrentLoadout();
  const reasons: string[] = [];
  if (!item) return { eligible: true, reasons };
  if (!loadout) return { eligible: false, reasons: ['No active loadout'] };
  if (item.levelRequirement > 0 && item.levelRequirement > loadout.level) {
    reasons.push(`Requires level ${item.levelRequirement}`);
  }
  if (item.renownRankRequirement > 0 && item.renownRankRequirement > loadout.renownRank) {
    reasons.push(`Requires renown ${item.renownRankRequirement}`);
  }
  const career: Career | null = (loadout.career as Career) || null;
  if (career && Array.isArray(item.careerRestriction) && item.careerRestriction.length > 0 && !item.careerRestriction.includes(career)) {
    reasons.push('Not usable by this career');
  }
  if (career && Array.isArray(item.raceRestriction) && item.raceRestriction.length > 0) {
    const allowedRaces = CAREER_RACE_MAPPING[career] || [];
    const ok = item.raceRestriction.some(r => allowedRaces.includes(r));
    if (!ok) reasons.push('Not usable by this race');
  }
  if (slot != null) {
    if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
      if (!(item.slot === EquipSlot.POCKET1 || item.slot === EquipSlot.POCKET2)) reasons.push('Not compatible with this slot');
    } else if (slot === EquipSlot.MAIN_HAND) {
      if (!(item.slot === EquipSlot.MAIN_HAND || item.slot === EquipSlot.EITHER_HAND)) reasons.push('Not compatible with this slot');
    } else if (slot === EquipSlot.OFF_HAND) {
      if (!(item.slot === EquipSlot.OFF_HAND || item.slot === EquipSlot.EITHER_HAND)) reasons.push('Not compatible with this slot');
    } else if (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4) {
      if (!(item.slot === slot || item.slot === EquipSlot.JEWELLERY1)) reasons.push('Not compatible with this slot');
    } else {
      if (item.slot !== slot) reasons.push('Not compatible with this slot');
    }
  }
  if (slot === EquipSlot.OFF_HAND) {
    const main = loadout.items[EquipSlot.MAIN_HAND]?.item || null;
    if (main && isTwoHandedWeapon(main)) {
      reasons.push('Two-handed main-hand equipped');
    }
    if (career) {
      const r = getOffhandBlockReason(career, item);
      if (r) reasons.push(r);
    }
  }
  if (slot === EquipSlot.MAIN_HAND && career) {
    if (STAFF_ONLY_CAREERS.has(career) && item.type !== 'STAFF') {
      reasons.push('This career must equip a two-handed staff in the main hand');
    }
    if (TWO_H_ONLY_CAREERS.has(career) && !isTwoHandedWeapon(item)) {
      reasons.push('This career must equip a two-handed weapon in the main hand');
    }
    if (CANNOT_USE_2H_MELEE.has(career) && isTwoHandedWeapon(item)) {
      reasons.push('This career cannot equip two-handed weapons');
    }
  }
  if (item.uniqueEquipped) {
    const duplicate = Object.entries(loadout.items).some(([k, v]) => {
      const s = k as unknown as EquipSlot;
      if (slot && s === slot) return false;
      return v?.item?.id === item.id;
    });
    if (duplicate) reasons.push('This unique item is already equipped');
  }
  return { eligible: reasons.length === 0, reasons };
}

export function getTalismanEligibility(slot: EquipSlot, index: number, talisman: Item | null, loadoutId?: string): { eligible: boolean; reasons: string[] } {
  const loadout = loadoutId
    ? loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId) || null
    : loadoutStoreAdapter.getCurrentLoadout();
  const reasons: string[] = [];
  if (!talisman) return { eligible: true, reasons };
  if (!loadout) return { eligible: false, reasons: ['No active loadout'] };
  if (talisman.levelRequirement > 0 && talisman.levelRequirement > loadout.level) reasons.push(`Requires level ${talisman.levelRequirement}`);
  if (talisman.renownRankRequirement > 0 && talisman.renownRankRequirement > loadout.renownRank) reasons.push(`Requires renown ${talisman.renownRankRequirement}`);
  if (Array.isArray(talisman.raceRestriction) && talisman.raceRestriction.length > 0 && loadout.career) {
    const allowedRaces = CAREER_RACE_MAPPING[loadout.career as Career] || [];
    const ok = talisman.raceRestriction.some(r => allowedRaces.includes(r));
    if (!ok) reasons.push('Not usable by this race');
  }
  // Duplicate talisman on same item earlier in order
  const list = loadout.items[slot]?.talismans as (Item | null)[] | undefined;
  if (list && list.length > 0 && talisman.id) {
    for (let i = 0; i < index; i++) {
      const t = list[i];
      if (t && t.id === talisman.id) { reasons.push('Duplicate talisman on this item'); break; }
    }
  }
  return { eligible: reasons.length === 0, reasons };
}

export function validateItemForCurrentLoadout(slot: EquipSlot, item: Item) {
  const loadout = loadoutStoreAdapter.getCurrentLoadout();
  if (!loadout) return; // nothing to validate if none selected
  // Unique-equipped
  if (item.uniqueEquipped && isUniqueItemAlreadyEquippedInLoadout(item.id, loadout.id)) {
    throw new Error('This unique item is already equipped');
  }
  // Career restriction
  if (loadout?.career && Array.isArray(item.careerRestriction) && item.careerRestriction.length > 0) {
    if (!item.careerRestriction.includes(loadout.career as Career)) {
      throw new Error('Not usable by this career');
    }
  }
  // Race restriction
  if (loadout?.career && Array.isArray(item.raceRestriction) && item.raceRestriction.length > 0) {
    const allowedRaces = CAREER_RACE_MAPPING[loadout.career as Career] || [];
    const ok = item.raceRestriction.some(r => allowedRaces.includes(r));
    if (!ok) throw new Error('Not usable by this race');
  }
  // Two-handed vs off-hand exclusivity
  const main = loadout.items[EquipSlot.MAIN_HAND]?.item || null;
  const off = loadout.items[EquipSlot.OFF_HAND]?.item || null;
  const career = loadout.career || null;
  if (slot === EquipSlot.MAIN_HAND && item && isTwoHandedWeapon(item) && off) {
    throw new Error('Cannot equip a two-handed weapon while an off-hand is equipped');
  }
  if (slot === EquipSlot.OFF_HAND && item && main && isTwoHandedWeapon(main)) {
    throw new Error('Cannot equip an off-hand while a two-handed weapon is equipped in the main hand');
  }
  if (slot === EquipSlot.OFF_HAND && item && career) {
    const reason = getOffhandBlockReason(career, item);
    if (reason) throw new Error(reason);
  }
  // Slot compatibility
  if (item) {
    if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
      if (!(item.slot === EquipSlot.POCKET1 || item.slot === EquipSlot.POCKET2)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.MAIN_HAND) {
      if (!(item.slot === EquipSlot.MAIN_HAND || item.slot === EquipSlot.EITHER_HAND)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.OFF_HAND) {
      if (!(item.slot === EquipSlot.OFF_HAND || item.slot === EquipSlot.EITHER_HAND)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4) {
      if (!(item.slot === slot || item.slot === EquipSlot.JEWELLERY1)) throw new Error('Not compatible with this slot');
    } else {
      if (item.slot !== slot) throw new Error('Not compatible with this slot');
    }
  }
  // Main-hand career constraints
  if (slot === EquipSlot.MAIN_HAND && item && career) {
  if (STAFF_ONLY_CAREERS.has(career as Career)) {
      if (item.type !== 'STAFF') {
        throw new Error('This career must equip a two-handed staff in the main hand');
      }
    }
  if (TWO_H_ONLY_CAREERS.has(career as Career)) {
      if (!isTwoHandedWeapon(item)) {
        throw new Error('This career must equip a two-handed weapon in the main hand');
      }
    }
  if (CANNOT_USE_2H_MELEE.has(career as Career)) {
      if (isTwoHandedWeapon(item)) {
        throw new Error('This career cannot equip two-handed weapons');
      }
    }
  }
}

export function validateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item) {
  const target = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
  if (!target) return;
  // Unique-equipped
  if (item.uniqueEquipped && isUniqueItemAlreadyEquippedInLoadout(item.id, loadoutId)) {
    throw new Error('This unique item is already equipped');
  }
  // Career restriction
  if (target?.career && Array.isArray(item.careerRestriction) && item.careerRestriction.length > 0) {
    if (!item.careerRestriction.includes(target.career as Career)) {
      throw new Error('Not usable by this career');
    }
  }
  // Race restriction
  if (target?.career && Array.isArray(item.raceRestriction) && item.raceRestriction.length > 0) {
    const allowedRaces = CAREER_RACE_MAPPING[target.career as Career] || [];
    const ok = item.raceRestriction.some(r => allowedRaces.includes(r));
    if (!ok) throw new Error('Not usable by this race');
  }
  // Two-handed vs off-hand exclusivity
  const main = target.items[EquipSlot.MAIN_HAND]?.item || null;
  const off = target.items[EquipSlot.OFF_HAND]?.item || null;
  const career = target.career || null;
  if (slot === EquipSlot.MAIN_HAND && item && isTwoHandedWeapon(item) && off) {
    throw new Error('Cannot equip a two-handed weapon while an off-hand is equipped');
  }
  if (slot === EquipSlot.OFF_HAND && item && main && isTwoHandedWeapon(main)) {
    throw new Error('Cannot equip an off-hand while a two-handed weapon is equipped in the main hand');
  }
  if (slot === EquipSlot.OFF_HAND && item && career) {
    const reason = getOffhandBlockReason(career, item);
    if (reason) throw new Error(reason);
  }
  // Slot compatibility
  if (item) {
    if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
      if (!(item.slot === EquipSlot.POCKET1 || item.slot === EquipSlot.POCKET2)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.MAIN_HAND) {
      if (!(item.slot === EquipSlot.MAIN_HAND || item.slot === EquipSlot.EITHER_HAND)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.OFF_HAND) {
      if (!(item.slot === EquipSlot.OFF_HAND || item.slot === EquipSlot.EITHER_HAND)) throw new Error('Not compatible with this slot');
    } else if (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4) {
      if (!(item.slot === slot || item.slot === EquipSlot.JEWELLERY1)) throw new Error('Not compatible with this slot');
    } else {
      if (item.slot !== slot) throw new Error('Not compatible with this slot');
    }
  }
  // Main-hand career constraints
  if (slot === EquipSlot.MAIN_HAND && item && career) {
  if (STAFF_ONLY_CAREERS.has(career as Career)) {
      if (item.type !== 'STAFF') {
        throw new Error('This career must equip a two-handed staff in the main hand');
      }
    }
  if (TWO_H_ONLY_CAREERS.has(career as Career)) {
      if (!isTwoHandedWeapon(item)) {
        throw new Error('This career must equip a two-handed weapon in the main hand');
      }
    }
  if (CANNOT_USE_2H_MELEE.has(career as Career)) {
      if (isTwoHandedWeapon(item)) {
        throw new Error('This career cannot equip two-handed weapons');
      }
    }
  }
}
