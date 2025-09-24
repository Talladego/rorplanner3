import { EquipSlot, ItemRarity, ItemType, Career, Stat } from '../types';

/**
 * Converts SCREAMING_SNAKE_CASE strings to Title Case.
 * @param value - The string to format
 * @returns The formatted title case string
 */
export function formatScreamingSnakeCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * Converts camelCase strings to Title Case.
 * @param value - The string to format
 * @returns The formatted title case string
 */
export function formatCamelCase(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * Converts any case style string to Title Case.
 * Automatically detects SCREAMING_SNAKE_CASE vs camelCase.
 * @param value - The string to format
 * @returns The formatted title case string
 */
export function formatToTitleCase(value: string): string {
  // Check if it's SCREAMING_SNAKE_CASE (contains underscores)
  if (value.includes('_')) {
    return formatScreamingSnakeCase(value);
  }
  // Otherwise treat as camelCase
  return formatCamelCase(value);
}

/**
 * Formats enum values from SCREAMING_SNAKE_CASE to Title Case.
 * @param value - The enum value to format
 * @returns The formatted title case string
 */
export function formatEnumValue(value: string): string {
  return formatScreamingSnakeCase(value);
}

/**
 * Formats equipment slot names for display.
 * @param slot - The equipment slot enum value
 * @returns The formatted slot name
 */
export function formatSlotName(slot: EquipSlot): string {
  return formatEnumValue(slot);
}

/**
 * Formats career names for display.
 * @param career - The career enum value
 * @returns The formatted career name
 */
export function formatCareerName(career: Career): string {
  return formatEnumValue(career);
}

/**
 * Formats race names for display.
 * @param race - The race string value
 * @returns The formatted race name
 */
export function formatRaceName(race: string): string {
  return formatEnumValue(race);
}

/**
 * Formats item rarity names for display.
 * @param rarity - The item rarity enum value
 * @returns The formatted rarity name
 */
export function formatRarityName(rarity: ItemRarity): string {
  return formatEnumValue(rarity);
}

/**
 * Formats item type names for display.
 * @param type - The item type enum value
 * @returns The formatted item type name
 */
export function formatItemTypeName(type: ItemType): string {
  return formatEnumValue(type);
}

/**
 * Formats stat names for display.
 * @param stat - The stat enum value
 * @returns The formatted stat name
 */
export function formatStatName(stat: Stat): string {
  return formatEnumValue(stat);
}

/**
 * Formats a numeric stat value with optional percent sign and leading '+' for positives.
 */
export function formatStatValue(value: number, asPercent = false): string {
  if (asPercent) return `${value > 0 ? '+' : ''}${value}%`;
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Normalize raw stat values for display.
 * RANGE and RADIUS are stored in inches (game units), but should be shown in feet (divide by 12).
 * Accepts either a StatsSummary key (camelCase) or a Stat enum.
 */
export function normalizeStatDisplayValue(stat: Stat | string, value: number): number {
  const key = typeof stat === 'string' ? stat : String(stat);
  if (key === 'range' || key === 'radius' || stat === Stat.RANGE || stat === Stat.RADIUS) {
    return value / 12;
  }
  return value;
}

/**
 * Known StatsSummary keys that should be displayed as percentages in UI rows.
 * These are the camelCase keys used in StatsSummary (not the SCREAMING_SNAKE_CASE Stat enum).
 */
export const PERCENT_SUMMARY_KEYS = new Set<string>([
  'block', 'parry', 'evade', 'disrupt',
  'criticalHitRate', 'meleeCritRate', 'rangedCritRate', 'magicCritRate', 'healCritRate',
  'incomingDamagePercent', 'outgoingDamagePercent',
  'outgoingHealPercent', 'incomingHealPercent',
  'blockStrikethrough', 'parryStrikethrough', 'evadeStrikethrough', 'disruptStrikethrough',
  'armorPenetrationReduction', 'criticalDamageTakenReduction', 'criticalHitRateReduction',
  'autoAttackSpeed', 'autoAttackDamage',
  // Treat Armor Penetration as a percentage stat in summaries
  'armorPenetration',
  // Economic/utility modifiers are percentage-based
  'goldLooted', 'xpReceived', 'renownReceived', 'influenceReceived',
  'hateCaused', 'hateReceived',
  // Note: range and radius are distances, not percentages
]);

/**
 * Decide if a StatsSummary row should render as a percent, given its key and optional contributions.
 */
export function isPercentSummaryKey(key: string, contributions?: Array<{ percentage?: boolean }>): boolean {
  if (PERCENT_SUMMARY_KEYS.has(key)) return true;
  if (contributions && contributions.some(c => !!c.percentage)) return true;
  return false;
}

/**
 * Decide if an item stat line should render as percent. The `percentage` flag from data is authoritative.
 * If missing, we fallback to a small allowlist of inherently percentage-based Stat enums.
 */
export function isPercentItemStat(stat: Stat, percentageFlag?: boolean): boolean {
  const percentEnumFallback = new Set<Stat>([
    Stat.BLOCK, Stat.PARRY, Stat.EVADE, Stat.DISRUPT,
    Stat.CRITICAL_HIT_RATE, Stat.MELEE_CRIT_RATE, Stat.RANGED_CRIT_RATE, Stat.MAGIC_CRIT_RATE, Stat.HEAL_CRIT_RATE,
    Stat.OUTGOING_DAMAGE_PERCENT, Stat.INCOMING_DAMAGE_PERCENT,
    Stat.OUTGOING_HEAL_PERCENT, Stat.INCOMING_HEAL_PERCENT,
    Stat.BLOCK_STRIKETHROUGH, Stat.PARRY_STRIKETHROUGH, Stat.EVADE_STRIKETHROUGH, Stat.DISRUPT_STRIKETHROUGH,
    Stat.ARMOR_PENETRATION_REDUCTION, Stat.CRITICAL_DAMAGE_TAKEN_REDUCTION, Stat.CRITICAL_HIT_RATE_REDUCTION,
    // Treat Armor Penetration as a percentage stat for item display
    Stat.ARMOR_PENETRATION,
    // Treat auto-attack modifiers as percentages for item stat display to match compare panel semantics
    Stat.AUTO_ATTACK_SPEED, Stat.AUTO_ATTACK_DAMAGE,
    // Other inherently percentage item stats
    Stat.LOOT_CHANCE, Stat.DISMOUNT_CHANCE, Stat.OFFHAND_PROC_CHANCE,
    Stat.GOLD_LOOTED, Stat.XP_RECEIVED, Stat.RENOWN_RECEIVED, Stat.INFLUENCE_RECEIVED,
    Stat.HATE_CAUSED, Stat.HATE_RECEIVED,
  ]);
  // Name-based heuristic: flags in enum name that imply percentages
  const name = String(stat);
  const nameImpliesPercent = (
    name.includes('PERCENT') ||
    name.endsWith('_RATE') ||
    name.endsWith('_REDUCTION') ||
    name.endsWith('_STRIKETHROUGH')
  );
  // If data marks it explicitly as percentage, or name/allowlist implies it, treat as percent
  return !!percentageFlag || nameImpliesPercent || percentEnumFallback.has(stat);
}
