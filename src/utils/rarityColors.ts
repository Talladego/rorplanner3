import { ItemRarity, ItemSet } from '../types';

/**
 * Color mapping for different item rarities.
 */
export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.MYTHIC]: '#c83c00',
  [ItemRarity.VERY_RARE]: '#9238d0',
  [ItemRarity.RARE]: '#0064c3',
  [ItemRarity.UNCOMMON]: '#18f000',
  [ItemRarity.COMMON]: '#fff',
  [ItemRarity.UTILITY]: '#969696',
};

/**
 * Color used for set items.
 */
export const SET_ITEM_COLOR = '#f0be28';

/**
 * Gets the color associated with an item rarity.
 * @param rarity - The item rarity
 * @returns The hex color code for the rarity
 */
export const getRarityColor = (rarity: ItemRarity): string => {
  return RARITY_COLORS[rarity] || '#fff';
};

/**
 * Gets the appropriate color for an item based on its rarity or set membership.
 * @param item - The item object with rarity and optional itemSet properties
 * @returns The hex color code for the item
 */
export const getItemColor = (item: { rarity: ItemRarity; itemSet?: ItemSet | null }): string => {
  // If item belongs to a set, use set color
  if (item.itemSet) {
    return SET_ITEM_COLOR;
  }
  // Otherwise use rarity-based color
  return getRarityColor(item.rarity);
};
