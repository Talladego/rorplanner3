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
