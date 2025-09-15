import { EquipSlot, ItemRarity, ItemType, Career, Stat } from '../types';

// Generic formatter for converting SCREAMING_SNAKE_CASE to Title Case
export function formatScreamingSnakeCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Generic formatter for converting camelCase to Title Case
export function formatCamelCase(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Generic formatter for converting any case style to Title Case
export function formatToTitleCase(value: string): string {
  // Check if it's SCREAMING_SNAKE_CASE (contains underscores)
  if (value.includes('_')) {
    return formatScreamingSnakeCase(value);
  }
  // Otherwise treat as camelCase
  return formatCamelCase(value);
}

// Generic formatter for converting SCREAMING_SNAKE_CASE to Title Case
export function formatEnumValue(value: string): string {
  return formatScreamingSnakeCase(value);
}

// Specific formatter functions using the generic formatter
export function formatSlotName(slot: EquipSlot): string {
  return formatEnumValue(slot);
}

export function formatCareerName(career: Career): string {
  return formatEnumValue(career);
}

export function formatRaceName(race: string): string {
  return formatEnumValue(race);
}

export function formatRarityName(rarity: ItemRarity): string {
  return formatEnumValue(rarity);
}

export function formatItemTypeName(type: ItemType): string {
  return formatEnumValue(type);
}

export function formatStatName(stat: Stat): string {
  return formatEnumValue(stat);
}

// New generic formatter for camelCase strings (used in StatsPanel)
export function formatCamelCaseToTitle(value: string): string {
  return formatCamelCase(value);
}
