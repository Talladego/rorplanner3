import { memo } from 'react';
import { Ability, Item, ItemSetBonusValue, ItemStat } from '../../types';
import { formatStatName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue } from '../../utils/formatters';

export interface SetBonusesBlockProps {
  item: Item;
  eligible: boolean;
  getEquippedCount: (setId: string, setName: string) => number;
}

function SetBonusesBlock({ item, eligible, getEquippedCount }: SetBonusesBlockProps) {
  if (!item.itemSet) return null;
  const bonuses = item.itemSet.bonuses || [];
  const setId = String(item.itemSet.id || item.itemSet.name);
  const equippedCount = getEquippedCount(setId, item.itemSet.name);
  const thresholds = bonuses.map(b => b.itemsRequired).sort((a, b) => a - b);
  const nextRequired = thresholds.find(t => t >= equippedCount) ?? (thresholds.length ? thresholds[thresholds.length - 1] : undefined);
  return (
    <div className="mb-2">
      <div className={`text-xs ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
        <div className={`font-medium mb-1 ${eligible ? 'text-green-400' : 'text-gray-500'}`}>
          {item.itemSet.name}
          {typeof nextRequired === 'number' ? ` (${equippedCount}/${nextRequired})` : ''}
        </div>
        {bonuses.length > 0 ? (
          <div className="space-y-0.5">
            {bonuses.map((bonus, idx: number) => {
              const isActive = equippedCount >= bonus.itemsRequired;
              const formatBonusValue = (bonusValue: ItemSetBonusValue) => {
                if (!bonusValue) return 'No bonus data';
                if ('stat' in bonusValue) {
                  const itemStat = bonusValue as ItemStat;
                  const statName = formatStatName(itemStat.stat);
                  const isPct = isPercentItemStat(itemStat.stat, itemStat.percentage);
                  const normalized = isPct ? itemStat.value : normalizeStatDisplayValue(itemStat.stat, itemStat.value);
                  return `${formatStatValue(normalized, isPct, 1)} ${statName}`;
                } else if ('name' in bonusValue || 'description' in bonusValue) {
                  const ability = bonusValue as Ability;
                  return `+ ${ability.description || ability.name}`;
                } else {
                  return 'Unknown bonus type';
                }
              };
              return (
                <div key={idx} className={isActive && eligible ? 'text-green-400' : 'text-gray-500'}>
                  ({bonus.itemsRequired} piece bonus) {formatBonusValue(bonus.bonus)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500">No bonuses available</div>
        )}
      </div>
    </div>
  );
}

export default memo(SetBonusesBlock);
