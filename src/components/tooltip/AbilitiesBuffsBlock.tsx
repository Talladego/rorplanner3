import { memo } from 'react';
import { Ability, Item } from '../../types';

export interface AbilitiesBuffsBlockProps {
  item: Item;
  eligible: boolean;
}

function AbilitiesBuffsBlock({ item, eligible }: AbilitiesBuffsBlockProps) {
  const hasAbilities = item.abilities && item.abilities.length > 0;
  const hasBuffs = item.buffs && item.buffs.length > 0;
  if (!hasAbilities && !hasBuffs) return null;
  return (
    <div className="mb-2">
      <div className={`text-xs space-y-0.5 ${eligible ? 'text-green-400' : 'text-gray-500'}`}>
        {hasAbilities && item.abilities!.map((ability: Ability, idx: number) => (
          <div key={`ability-${idx}`}>
            <div className={`text-xs italic ${eligible ? 'text-green-400' : 'text-gray-500'}`}>+ {ability.description || ability.name}</div>
          </div>
        ))}
        {hasBuffs && item.buffs!.map((buff: Ability, idx: number) => (
          <div key={`buff-${idx}`}>
            <div className={`text-xs italic ${eligible ? 'text-green-400' : 'text-gray-500'}`}>+ {buff.description || buff.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(AbilitiesBuffsBlock);
