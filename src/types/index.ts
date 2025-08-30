// Types based on schema.graphql for RorPlanner data layer

export enum Career {
  IRON_BREAKER = 'IRON_BREAKER',
  SLAYER = 'SLAYER',
  RUNE_PRIEST = 'RUNE_PRIEST',
  ENGINEER = 'ENGINEER',
  BLACK_ORC = 'BLACK_ORC',
  CHOPPA = 'CHOPPA',
  SHAMAN = 'SHAMAN',
  SQUIG_HERDER = 'SQUIG_HERDER',
  WITCH_HUNTER = 'WITCH_HUNTER',
  KNIGHT_OF_THE_BLAZING_SUN = 'KNIGHT_OF_THE_BLAZING_SUN',
  BRIGHT_WIZARD = 'BRIGHT_WIZARD',
  WARRIOR_PRIEST = 'WARRIOR_PRIEST',
  CHOSEN = 'CHOSEN',
  MARAUDER = 'MARAUDER',
  ZEALOT = 'ZEALOT',
  MAGUS = 'MAGUS',
  SWORDSMAN = 'SWORDSMAN',
  SHADOW_WARRIOR = 'SHADOW_WARRIOR',
  WHITE_LION = 'WHITE_LION',
  ARCHMAGE = 'ARCHMAGE',
  BLACKGUARD = 'BLACKGUARD',
  WITCH_ELF = 'WITCH_ELF',
  DISCIPLE_OF_KHAINE = 'DISCIPLE_OF_KHAINE',
  SORCERER = 'SORCERER',
  CORSAIR = 'CORSAIR',
}

export enum EquipSlot {
  NONE = 'NONE',
  EVENT = 'EVENT',
  MAIN_HAND = 'MAIN_HAND',
  OFF_HAND = 'OFF_HAND',
  RANGED_WEAPON = 'RANGED_WEAPON',
  EITHER_HAND = 'EITHER_HAND',
  STANDARD = 'STANDARD',
  TROPHY1 = 'TROPHY1',
  TROPHY2 = 'TROPHY2',
  TROPHY3 = 'TROPHY3',
  TROPHY4 = 'TROPHY4',
  TROPHY5 = 'TROPHY5',
  BODY = 'BODY',
  GLOVES = 'GLOVES',
  BOOTS = 'BOOTS',
  HELM = 'HELM',
  SHOULDER = 'SHOULDER',
  POCKET1 = 'POCKET1',
  POCKET2 = 'POCKET2',
  BACK = 'BACK',
  BELT = 'BELT',
  JEWELLERY1 = 'JEWELLERY1',
  JEWELLERY2 = 'JEWELLERY2',
  JEWELLERY3 = 'JEWELLERY3',
  JEWELLERY4 = 'JEWELLERY4',
}

export enum ItemRarity {
  UTILITY = 'UTILITY',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  VERY_RARE = 'VERY_RARE',
  MYTHIC = 'MYTHIC',
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  JEWELRY = 'JEWELRY',
  ACCESSORY = 'ACCESSORY',
}

export enum Stat {
  STRENGTH = 'STRENGTH',
  AGILITY = 'AGILITY',
  WILLPOWER = 'WILLPOWER',
  TOUGHNESS = 'TOUGHNESS',
  WOUNDS = 'WOUNDS',
  // Add more as needed
}

export interface ItemStat {
  stat: Stat;
  value: number;
  percentage: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  slot: EquipSlot;
  rarity: ItemRarity;
  armor: number;
  dps: number;
  speed: number;
  levelRequirement: number;
  renownRankRequirement: number;
  itemLevel: number;
  uniqueEquipped: boolean;
  stats: ItemStat[];
  careerRestriction: Career[];
  raceRestriction: string[]; // Assuming Race enum
  iconUrl: string;
  talismanSlots: number;
  // itemSet, buffs, abilities can be added if needed
}

export interface LoadoutItem {
  item: Item | null;
  talismans: (Item | null)[]; // Assuming talismans are also Items
}

export interface Loadout {
  id: string;
  name: string;
  career: Career | null;
  level: number;
  renownRank: number;
  items: Record<EquipSlot, LoadoutItem>;
}

export interface StatsSummary {
  strength: number;
  agility: number;
  willpower: number;
  toughness: number;
  wounds: number;
  initiative: number;
  weaponSkill: number;
  ballisticSkill: number;
  intelligence: number;
  spiritResistance: number;
  elementalResistance: number;
  corporealResistance: number;
  incomingDamage: number;
  incomingDamagePercent: number;
  outgoingDamage: number;
  outgoingDamagePercent: number;
  armor: number;
  velocity: number;
  block: number;
  parry: number;
  evade: number;
  disrupt: number;
  actionPointRegen: number;
  moraleRegen: number;
  cooldown: number;
  buildTime: number;
  criticalDamage: number;
  range: number;
  autoAttackSpeed: number;
}
