import { memo } from 'react';
import { Item, ItemStat } from '../../types';
import { formatFixed, formatStatName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue } from '../../utils/formatters';

export interface StatLinesProps {
  item: Item;
  eligible: boolean;
}

function StatLines({ item, eligible }: StatLinesProps) {
  const isShield = item.type === 'BASIC_SHIELD' || item.type === 'SHIELD' || item.type === 'EXPERT_SHIELD';
  return (
    <div className={`text-xs space-y-0.5 ${eligible ? 'text-yellow-400' : 'text-gray-500'}`}>
      {item.armor > 0 && (
        <div>
          {isShield ? (
            <>{item.armor} Block Rating</>
          ) : (
            <>{item.armor} Armor</>
          )}
        </div>
      )}
      {/* For shields, do not render DPS; only show Block Rating above */}
      {!isShield && item.dps > 0 && (
        <div>{formatFixed(item.dps / 10, 1)} DPS</div>
      )}
      {item.speed > 0 && <div>{formatFixed(item.speed / 100, 1)} Speed</div>}
      {item.stats && item.stats.length > 0 && item.stats.map((stat: ItemStat, idx: number) => {
        const isPct = isPercentItemStat(stat.stat, stat.percentage);
        const normalized = isPct ? stat.value : normalizeStatDisplayValue(stat.stat, stat.value);
        return (
          <div key={idx}>
            {formatStatValue(normalized, isPct, 1)} {formatStatName(stat.stat)}
          </div>
        );
      })}
    </div>
  );
}

export default memo(StatLines);
