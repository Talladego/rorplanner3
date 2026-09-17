import { ItemRarity } from '../types';
import { RARITY_COLORS, getRarityColor } from '../utils/rarityColors';

describe('rarity colors', () => {
  it('uses a theme token for common so light/dark backgrounds stay readable', () => {
    expect(RARITY_COLORS[ItemRarity.COMMON]).toBe('var(--item-color-common)');
    expect(getRarityColor(ItemRarity.COMMON)).toBe('var(--item-color-common)');
  });

  it('keeps saturated rarities as explicit hex', () => {
    expect(getRarityColor(ItemRarity.MYTHIC)).toBe('#c83c00');
    expect(getRarityColor(ItemRarity.UNCOMMON)).toBe('#18f000');
  });
});
