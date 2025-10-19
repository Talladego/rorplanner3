import { Career, Item, ItemType } from '../types';
import { isShieldType } from '../utils/items';

export enum OffHandPolicy {
  NONE = 'NONE',
  SHIELD_ONLY = 'SHIELD_ONLY',
  PISTOL_ONLY = 'PISTOL_ONLY',
  CHARM_ONLY = 'CHARM_ONLY',
  WEAPON_ONLY = 'WEAPON_ONLY',
  CHARM_OR_WEAPON = 'CHARM_OR_WEAPON',
  CHARM_OR_SHIELD = 'CHARM_OR_SHIELD',
  CHARM_OR_WEAPON_OR_SHIELD = 'CHARM_OR_WEAPON_OR_SHIELD',
}

// Careers that require a two-handed staff in main hand
export const STAFF_ONLY_CAREERS = new Set<Career>([
  Career.BRIGHT_WIZARD,
  Career.RUNE_PRIEST,
  Career.SHAMAN,
  Career.MAGUS,
  Career.ARCHMAGE,
  Career.SORCERER,
]);

// Careers that require two-handed melee weapon (non-staff) in main hand only
export const TWO_H_ONLY_CAREERS = new Set<Career>([
  Career.WHITE_LION,
]);

// Careers that should not use two-handed melee weapons (UI-only greying)
export const CANNOT_USE_2H_MELEE = new Set<Career>([
  Career.ENGINEER,
  Career.SQUIG_HERDER,
  Career.WITCH_HUNTER,
  Career.SHADOW_WARRIOR,
  Career.ZEALOT,
  Career.WITCH_ELF,
  Career.MARAUDER,
  Career.DISCIPLE_OF_KHAINE,
]);

export const OFF_HAND_POLICY: Record<Career, OffHandPolicy> = {
  // Dwarfs
  [Career.IRON_BREAKER]: OffHandPolicy.SHIELD_ONLY,
  [Career.SLAYER]: OffHandPolicy.WEAPON_ONLY,
  [Career.RUNE_PRIEST]: OffHandPolicy.NONE,
  [Career.ENGINEER]: OffHandPolicy.NONE,
  // Greenskins
  [Career.BLACK_ORC]: OffHandPolicy.SHIELD_ONLY,
  [Career.CHOPPA]: OffHandPolicy.WEAPON_ONLY,
  [Career.SHAMAN]: OffHandPolicy.NONE,
  [Career.SQUIG_HERDER]: OffHandPolicy.NONE,
  // Empire
  [Career.WITCH_HUNTER]: OffHandPolicy.PISTOL_ONLY,
  [Career.KNIGHT_OF_THE_BLAZING_SUN]: OffHandPolicy.SHIELD_ONLY,
  [Career.BRIGHT_WIZARD]: OffHandPolicy.NONE,
  [Career.WARRIOR_PRIEST]: OffHandPolicy.CHARM_OR_SHIELD,
  // Chaos
  [Career.CHOSEN]: OffHandPolicy.SHIELD_ONLY,
  [Career.MARAUDER]: OffHandPolicy.WEAPON_ONLY,
  [Career.ZEALOT]: OffHandPolicy.CHARM_ONLY,
  [Career.MAGUS]: OffHandPolicy.NONE,
  // High Elf
  [Career.SWORD_MASTER]: OffHandPolicy.SHIELD_ONLY,
  [Career.SHADOW_WARRIOR]: OffHandPolicy.NONE,
  [Career.WHITE_LION]: OffHandPolicy.NONE,
  [Career.ARCHMAGE]: OffHandPolicy.NONE,
  // Dark Elf
  [Career.BLACK_GUARD]: OffHandPolicy.SHIELD_ONLY,
  [Career.WITCH_ELF]: OffHandPolicy.WEAPON_ONLY,
  [Career.DISCIPLE_OF_KHAINE]: OffHandPolicy.CHARM_OR_WEAPON_OR_SHIELD,
  [Career.SORCERER]: OffHandPolicy.NONE,
};

export function isCharmType(t?: string) {
  return t === ItemType.CHARM;
}

export function isPistolType(t?: string) {
  return t === ItemType.PISTOL;
}

export function isMeleeWeaponType(t?: string) {
  return t === ItemType.SWORD || t === ItemType.AXE || t === ItemType.HAMMER || t === ItemType.DAGGER || t === ItemType.SPEAR || t === ItemType.LANCE;
}

export function getOffhandBlockReason(career: Career, item: Item): string | null {
  const policy = OFF_HAND_POLICY[career];
  const t = item.type;
  switch (policy) {
    case OffHandPolicy.NONE:
      return 'This career cannot equip an off-hand item';
    case OffHandPolicy.SHIELD_ONLY:
      return isShieldType(t) ? null : 'This career can only equip shields in the off-hand';
    case OffHandPolicy.PISTOL_ONLY:
      return isPistolType(t) ? null : 'This career can only equip pistols in the off-hand';
    case OffHandPolicy.CHARM_ONLY:
      return isCharmType(t) ? null : 'This career can only equip charms in the off-hand';
    case OffHandPolicy.WEAPON_ONLY:
      return isMeleeWeaponType(t) ? null : 'This career can only equip melee weapons in the off-hand';
    case OffHandPolicy.CHARM_OR_WEAPON:
      return isCharmType(t) || isMeleeWeaponType(t) ? null : 'This career can equip a charm or melee weapon in the off-hand';
    case OffHandPolicy.CHARM_OR_SHIELD:
      return isCharmType(t) || isShieldType(t) ? null : 'This career can equip a charm or shield in the off-hand';
    case OffHandPolicy.CHARM_OR_WEAPON_OR_SHIELD:
      return isCharmType(t) || isMeleeWeaponType(t) || isShieldType(t) ? null : 'This career can equip a charm, melee weapon, or shield in the off-hand';
    default:
      return null;
  }
}
