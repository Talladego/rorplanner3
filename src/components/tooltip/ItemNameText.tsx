import { memo } from 'react';
import { Item, EquipSlot } from '../../types';
import { isTwoHandedWeapon } from '../../utils/items';

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
      {item.slot === EquipSlot.MAIN_HAND && isTwoHandedWeapon(item) ? (
        <span className="text-secondary font-medium"> (2H)</span>
      ) : null}
    </p>
  );
}

export default memo(ItemNameText);
