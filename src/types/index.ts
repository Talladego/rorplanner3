// Types based on schema.graphql for RorPlanner data layer

export enum Race {
  DWARF = 'DWARF',
  ORC = 'ORC',
  GOBLIN = 'GOBLIN',
  HIGH_ELF = 'HIGH_ELF',
  DARK_ELF = 'DARK_ELF',
  EMPIRE = 'EMPIRE',
  CHAOS = 'CHAOS',
}

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
  SWORD_MASTER = 'SWORD_MASTER',
  SHADOW_WARRIOR = 'SHADOW_WARRIOR',
  WHITE_LION = 'WHITE_LION',
  ARCHMAGE = 'ARCHMAGE',
  BLACK_GUARD = 'BLACK_GUARD',
  WITCH_ELF = 'WITCH_ELF',
  DISCIPLE_OF_KHAINE = 'DISCIPLE_OF_KHAINE',
  SORCERER = 'SORCERER',
}

// Career to Race mapping based on Warhammer Online lore
export const CAREER_RACE_MAPPING: Record<Career, Race[]> = {
  [Career.IRON_BREAKER]: [Race.DWARF],
  [Career.SLAYER]: [Race.DWARF],
  [Career.RUNE_PRIEST]: [Race.DWARF],
  [Career.ENGINEER]: [Race.DWARF],
  [Career.BLACK_ORC]: [Race.ORC],
  [Career.CHOPPA]: [Race.ORC], // Choppa is always Orc
  [Career.SHAMAN]: [Race.ORC],
  [Career.SQUIG_HERDER]: [Race.GOBLIN], // Squig Herder is always Goblin
  [Career.WITCH_HUNTER]: [Race.EMPIRE],
  [Career.KNIGHT_OF_THE_BLAZING_SUN]: [Race.EMPIRE],
  [Career.BRIGHT_WIZARD]: [Race.EMPIRE],
  [Career.WARRIOR_PRIEST]: [Race.EMPIRE],
  [Career.CHOSEN]: [Race.CHAOS],
  [Career.MARAUDER]: [Race.CHAOS],
  [Career.ZEALOT]: [Race.CHAOS],
  [Career.MAGUS]: [Race.CHAOS],
  [Career.SWORD_MASTER]: [Race.HIGH_ELF],
  [Career.SHADOW_WARRIOR]: [Race.HIGH_ELF],
  [Career.WHITE_LION]: [Race.HIGH_ELF],
  [Career.ARCHMAGE]: [Race.HIGH_ELF],
  [Career.BLACK_GUARD]: [Race.DARK_ELF], // Black Guard is a Dark Elf career
  [Career.WITCH_ELF]: [Race.DARK_ELF],
  [Career.DISCIPLE_OF_KHAINE]: [Race.DARK_ELF],
  [Career.SORCERER]: [Race.DARK_ELF],
};

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
  NONE = 'NONE',
  SWORD = 'SWORD',
  AXE = 'AXE',
  HAMMER = 'HAMMER',
  BASIC_SHIELD = 'BASIC_SHIELD',
  SHIELD = 'SHIELD',
  ROBE = 'ROBE',
  BOW = 'BOW',
  CROSSBOW = 'CROSSBOW',
  GUN = 'GUN',
  EXPERT_SHIELD = 'EXPERT_SHIELD',
  STAFF = 'STAFF',
  DAGGER = 'DAGGER',
  SPEAR = 'SPEAR',
  PISTOL = 'PISTOL',
  LANCE = 'LANCE',
  REPEATING_CROSSBOW = 'REPEATING_CROSSBOW',
  LIGHT_ARMOR = 'LIGHT_ARMOR',
  MEDIUM_ARMOR = 'MEDIUM_ARMOR',
  HEAVY_ARMOR = 'HEAVY_ARMOR',
  QUEST = 'QUEST',
  MEDIUM_ROBE = 'MEDIUM_ROBE',
  ENHANCEMENT = 'ENHANCEMENT',
  TROPHY = 'TROPHY',
  CHARM = 'CHARM',
  DYE = 'DYE',
  BASIC_MOUNT = 'BASIC_MOUNT',
  ADVANCED_MOUNT = 'ADVANCED_MOUNT',
  POTION = 'POTION',
  SALVAGING = 'SALVAGING',
  MARKETING = 'MARKETING',
  CRAFTING = 'CRAFTING',
  ACCESSORY = 'ACCESSORY',
  CURRENCY = 'CURRENCY',
  TELEPORT = 'TELEPORT',
  TELEPORT_GROUP = 'TELEPORT_GROUP',
  SIEGE = 'SIEGE',
  TREASURE_CHEST = 'TREASURE_CHEST',
  TREASURE_KEY = 'TREASURE_KEY',
  REFINER_TOOL = 'REFINER_TOOL',
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  JEWELRY = 'JEWELRY',
}

export interface ItemSetBonus {
  itemsRequired: number;
  bonus: ItemSetBonusValue;
}

export interface ItemStat {
  stat: Stat;
  value: number;
  percentage: boolean;
}

export interface AbilityInfo {
  id: string;
  name: string;
  iconUrl: string;
  description: string;
  abilityType: string;
  specialization: number;
  actionPointCost: number;
  moraleLevel: number;
  moraleCost: number;
  castTime: number;
  range: number;
  minRange: number;
  minLevel: number;
  cooldown: number;
  labels: string[];
}

export interface Ability {
  id: string;
  name: string;
  iconUrl: string;
  description: string;
  info: AbilityInfo;
  abilityType: string;
  specialization: number;
  actionPointCost: number;
  moraleLevel: number;
  moraleCost: number;
  castTime: number;
  range: number;
  minRange: number;
  minLevel: number;
  cooldown: number;
  labels: string[];
}

export type ItemSetBonusValue = Ability | ItemStat;

export interface ILoadoutStore {
  // State getters
  getLoadouts(): Loadout[];
  getCurrentLoadoutId(): string | null;
  getCurrentLoadout(): Loadout | null;
  getStatsSummary(): StatsSummary;

  // State setters
  setCareer(career: Career): void;
  setLevel(level: number): void;
  setRenownRank(renownRank: number): void;
  setItem(slot: EquipSlot, item: Item | null): void;
  setTalisman(slot: EquipSlot, index: number, talisman: Item | null): void;
  resetCurrentLoadout(): void;
  calculateStats(): void;

  // Loadout management
  createLoadout(name: string): string;
  deleteLoadout(id: string): void;
  switchLoadout(id: string): void;
  importFromCharacter(characterId: string): Promise<void>;
}

export interface ItemSet {
  id: string;
  name: string;
  level: number;
  bonuses?: ItemSetBonus[];
}

export enum Stat {
  STRENGTH = 'STRENGTH',
  AGILITY = 'AGILITY',
  WILLPOWER = 'WILLPOWER',
  TOUGHNESS = 'TOUGHNESS',
  WOUNDS = 'WOUNDS',
  INITIATIVE = 'INITIATIVE',
  WEAPON_SKILL = 'WEAPON_SKILL',
  BALLISTIC_SKILL = 'BALLISTIC_SKILL',
  INTELLIGENCE = 'INTELLIGENCE',
  SPIRIT_RESISTANCE = 'SPIRIT_RESISTANCE',
  ELEMENTAL_RESISTANCE = 'ELEMENTAL_RESISTANCE',
  CORPOREAL_RESISTANCE = 'CORPOREAL_RESISTANCE',
  INCOMING_DAMAGE = 'INCOMING_DAMAGE',
  INCOMING_DAMAGE_PERCENT = 'INCOMING_DAMAGE_PERCENT',
  OUTGOING_DAMAGE = 'OUTGOING_DAMAGE',
  OUTGOING_DAMAGE_PERCENT = 'OUTGOING_DAMAGE_PERCENT',
  ARMOR = 'ARMOR',
  VELOCITY = 'VELOCITY',
  BLOCK = 'BLOCK',
  PARRY = 'PARRY',
  EVADE = 'EVADE',
  DISRUPT = 'DISRUPT',
  ACTION_POINT_REGEN = 'ACTION_POINT_REGEN',
  MORALE_REGEN = 'MORALE_REGEN',
  COOLDOWN = 'COOLDOWN',
  BUILD_TIME = 'BUILD_TIME',
  CRITICAL_DAMAGE = 'CRITICAL_DAMAGE',
  RANGE = 'RANGE',
  AUTO_ATTACK_SPEED = 'AUTO_ATTACK_SPEED',
  RADIUS = 'RADIUS',
  AUTO_ATTACK_DAMAGE = 'AUTO_ATTACK_DAMAGE',
  ACTION_POINT_COST = 'ACTION_POINT_COST',
  CRITICAL_HIT_RATE = 'CRITICAL_HIT_RATE',
  CRITICAL_DAMAGE_TAKEN_REDUCTION = 'CRITICAL_DAMAGE_TAKEN_REDUCTION',
  EFFECT_RESIST = 'EFFECT_RESIST',
  EFFECT_BUFF = 'EFFECT_BUFF',
  MINIMUM_RANGE = 'MINIMUM_RANGE',
  DAMAGE_ABSORB = 'DAMAGE_ABSORB',
  SETBACK_CHANCE = 'SETBACK_CHANCE',
  SETBACK_VALUE = 'SETBACK_VALUE',
  XP_WORTH = 'XP_WORTH',
  RENOWN_WORTH = 'RENOWN_WORTH',
  INFLUENCE_WORTH = 'INFLUENCE_WORTH',
  MONETARY_WORTH = 'MONETARY_WORTH',
  AGGRO_RADIUS = 'AGGRO_RADIUS',
  TARGET_DURATION = 'TARGET_DURATION',
  SPECIALIZATION = 'SPECIALIZATION',
  GOLD_LOOTED = 'GOLD_LOOTED',
  XP_RECEIVED = 'XP_RECEIVED',
  BUTCHERING = 'BUTCHERING',
  SCAVENGING = 'SCAVENGING',
  CULTIVATION = 'CULTIVATION',
  APOTHECARY = 'APOTHECARY',
  TALISMAN_MAKING = 'TALISMAN_MAKING',
  SALVAGING = 'SALVAGING',
  STEALTH = 'STEALTH',
  STEALTH_DETECTION = 'STEALTH_DETECTION',
  HATE_CAUSED = 'HATE_CAUSED',
  HATE_RECEIVED = 'HATE_RECEIVED',
  OFFHAND_PROC_CHANCE = 'OFFHAND_PROC_CHANCE',
  OFFHAND_DAMAGE = 'OFFHAND_DAMAGE',
  RENOWN_RECEIVED = 'RENOWN_RECEIVED',
  INFLUENCE_RECEIVED = 'INFLUENCE_RECEIVED',
  DISMOUNT_CHANCE = 'DISMOUNT_CHANCE',
  GRAVITY = 'GRAVITY',
  LEVITATION_HEIGHT = 'LEVITATION_HEIGHT',
  MELEE_CRIT_RATE = 'MELEE_CRIT_RATE',
  RANGED_CRIT_RATE = 'RANGED_CRIT_RATE',
  MAGIC_CRIT_RATE = 'MAGIC_CRIT_RATE',
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
  raceRestriction: Race[]; // Array of allowed races
  iconUrl: string;
  talismanSlots: number;
  itemSet: ItemSet | null;
  talismans?: (Item | null)[]; // Array of talisman items
  abilities: Ability[]; // Array of ability objects
  buffs: Ability[]; // Array of buff objects
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
