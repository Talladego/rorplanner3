import { ItemRarity, ItemSet } from '../types';

export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.MYTHIC]: '#c83c00',
  [ItemRarity.VERY_RARE]: '#9238d0',
  [ItemRarity.RARE]: '#0064c3',
  [ItemRarity.UNCOMMON]: '#18f000',
  [ItemRarity.COMMON]: '#fff',
  [ItemRarity.UTILITY]: '#969696',
};

export const SET_ITEM_COLOR = '#f0be28';

export const getRarityColor = (rarity: ItemRarity): string => {
  return RARITY_COLORS[rarity] || '#fff';
};

export const getItemColor = (item: { rarity: ItemRarity; itemSet?: ItemSet | null }): string => {
  // If item belongs to a set, use set color
  if (item.itemSet) {
    return SET_ITEM_COLOR;
  }
  // Otherwise use rarity-based color
  return getRarityColor(item.rarity);
};
