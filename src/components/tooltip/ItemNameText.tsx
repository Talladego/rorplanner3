import { memo } from 'react';
import { Item } from '../../types';

export interface ItemNameTextProps {
  item: Item;
}

function ItemNameText({ item }: ItemNameTextProps) {
  return (
    <p
      className={`equipment-item-name ${(
        item.itemSet ? 'item-color-set' :
        item.rarity === 'MYTHIC' ? 'item-color-mythic' :
        item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
        item.rarity === 'RARE' ? 'item-color-rare' :
        item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
        item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common'
      )}`}
    >
      {item.name}
    </p>
  );
}

export default memo(ItemNameText);
