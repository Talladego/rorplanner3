import { memo } from 'react';
import { Item, ItemStat, Loadout } from '../../types';
import { formatStatName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue } from '../../utils/formatters';

export interface TalismanSlotsBlockProps {
  item: Item;
  eligible: boolean;
  loadout: Loadout | null;
  isItemEligibleForLoadout: (lo: Loadout | null, it: Item | null) => boolean;
}

function TalismanSlotsBlock({ item, eligible, loadout, isItemEligibleForLoadout }: TalismanSlotsBlockProps) {
  if (item.talismanSlots <= 0) return null;
  return (
    <div className="mb-2">
      <div className={`text-xs ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
        {Array.from({ length: item.talismanSlots }).map((_, i) => {
          const t = item.talismans?.[i] || null;
          const talismanEligible = t ? isItemEligibleForLoadout(loadout, t) : true;
          return (
            <div key={i} className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center gap-1">
                <img
                  src={t?.iconUrl || 'https://armory.returnofreckoning.com/icon/1'}
                  alt={t?.name || 'Empty Talisman Slot'}
                  className={`w-4 h-4 object-contain rounded ${t && !talismanEligible ? 'grayscale' : ''}`}
                />
                <span className={`text-xs`}>
                  {t ? (
                    <>
                      <span className={`${t.itemSet ? 'item-color-set' :
                        t.rarity === 'MYTHIC' ? 'item-color-mythic' :
                        t.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                        t.rarity === 'RARE' ? 'item-color-rare' :
                        t.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                        t.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common'}`}>{t.name}</span>
                      {t.stats && t.stats.length > 0 && (
                        <span className={`text-gray-400`}>
                          {' ('}
                          {t.stats.map((stat: ItemStat, idx: number) => (
                            <span key={idx}>
                              {(() => {
                                const isPct = isPercentItemStat(stat.stat, stat.percentage);
                                const normalized = isPct ? stat.value : normalizeStatDisplayValue(stat.stat, stat.value);
                                return formatStatValue(normalized, isPct, 1);
                              })()} {formatStatName(stat.stat)}
                              {idx < t.stats.length - 1 && <span className="mx-1">/</span>}
                            </span>
                          ))}
                          {')'}
                        </span>
                      )}
                    </>
                  ) : (
                    <>Empty Talisman Slot</>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TalismanSlotsBlock);
