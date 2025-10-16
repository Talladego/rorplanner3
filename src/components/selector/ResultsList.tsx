import { memo, type ReactNode } from 'react';
import Tooltip from '../tooltip/Tooltip';
import { CAREER_RACE_MAPPING, Career, EquipSlot, Item, Stat } from '../../types';
import { loadoutService } from '../../services/loadout/loadoutService';
import { formatItemTypeName, formatSlotName, formatStatName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue } from '../../utils/formatters';

export interface ResultsListProps {
  items: Item[];
  isTalismanMode: boolean;
  loadoutId?: string | null;
  slot: EquipSlot;
  career: Career | '';
  talismanSlotIndex?: number;
  onSelect: (item: Item) => void;
  effectiveLoadoutId?: string | undefined | null;
  statsFilter: Stat[];
}

function formatTalismanStats(item: Item): string {
  if (!item.stats || item.stats.length === 0) return '';
  const primaryStat = item.stats[0]!;
  const isPct = isPercentItemStat(primaryStat.stat, primaryStat.percentage);
  const normalized = isPct ? primaryStat.value : normalizeStatDisplayValue(primaryStat.stat, primaryStat.value);
  const value = formatStatValue(normalized, isPct, 1);
  const statName = formatStatName(primaryStat.stat);
  return `${value} ${statName}`;
}

function renderItemInfo(item: Item, filteredStats?: Stat[]): ReactNode {
  const typeName = formatItemTypeName(item.type);
  const slotName = formatSlotName(item.slot);
  const base = `${typeName}, ${slotName}, Item Level: ${item.itemLevel}`;
  if (!filteredStats || filteredStats.length === 0) return base;
  const lines = (item.stats || []).filter((s) => s && filteredStats.includes(s.stat as Stat));
  if (lines.length === 0) return base;
  const rendered = lines.map((line) => {
    const isPct = isPercentItemStat(line.stat, line.percentage);
    const normalized = isPct ? line.value : normalizeStatDisplayValue(line.stat, line.value);
    const value = formatStatValue(normalized, isPct, 1);
    const statName = formatStatName(line.stat);
    return `${value} ${statName}`;
  }).join(' / ');
  return (
    <>
      {base}, <span className="text-gray-900 dark:text-gray-100 font-medium">{rendered}</span>
    </>
  );
}

export function ResultsList({
  items,
  isTalismanMode,
  loadoutId,
  slot,
  career,
  talismanSlotIndex,
  onSelect,
  effectiveLoadoutId,
  statsFilter,
}: ResultsListProps) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isAlreadyEquipped = item.uniqueEquipped && loadoutService.isUniqueItemAlreadyEquippedInLoadout(item.id, loadoutId || undefined);
        const eligibilityCareer = (career || '') as Career | '';
        const allowedRaces = eligibilityCareer ? CAREER_RACE_MAPPING[eligibilityCareer as Career] || [] : [];
        const isRaceRestricted = !!eligibilityCareer && item.raceRestriction && item.raceRestriction.length > 0 && 
                                !item.raceRestriction.some((race) => allowedRaces.includes(race));
        const isCareerRestricted = !!eligibilityCareer && item.careerRestriction && item.careerRestriction.length > 0 &&
                                  !item.careerRestriction.includes(eligibilityCareer);
        const isSlotIncompatible = !isTalismanMode && (() => {
          const targetSlot = slot;
          if (targetSlot === EquipSlot.POCKET1 || targetSlot === EquipSlot.POCKET2) {
            return !(item.slot === EquipSlot.POCKET1 || item.slot === EquipSlot.POCKET2);
          }
          if (targetSlot === EquipSlot.MAIN_HAND) {
            return !(item.slot === EquipSlot.MAIN_HAND || item.slot === EquipSlot.EITHER_HAND);
          }
          if (targetSlot === EquipSlot.OFF_HAND) {
            return !(item.slot === EquipSlot.OFF_HAND || item.slot === EquipSlot.EITHER_HAND);
          }
          if (targetSlot === EquipSlot.JEWELLERY2 || targetSlot === EquipSlot.JEWELLERY3 || targetSlot === EquipSlot.JEWELLERY4) {
            return !(item.slot === targetSlot || item.slot === EquipSlot.JEWELLERY1);
          }
          return item.slot !== targetSlot;
        })();
        const isTalismanAlreadySlotted = isTalismanMode && talismanSlotIndex !== undefined && (
          loadoutId
            ? loadoutService.isTalismanAlreadySlottedInItemForLoadout(loadoutId, item.id, slot, talismanSlotIndex)
            : loadoutService.isTalismanAlreadySlottedInItem(item.id, slot, talismanSlotIndex)
        );
        const isDisabled = isAlreadyEquipped || isCareerRestricted || isRaceRestricted || isTalismanAlreadySlotted || isSlotIncompatible;

        return (
          <Tooltip key={item.id} item={item as Item} isTalismanTooltip={isTalismanMode} loadoutId={effectiveLoadoutId || undefined}>
            <div
              className={`border p-1.5 rounded h-12 flex items-center ${
                isDisabled
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-not-allowed grayscale'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
              } transition-colors`}
              onClick={() => !isDisabled && onSelect(item as Item)}
            >
              <div className={`flex items-center space-x-2 w-full`}>
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  width={24}
                  height={24}
                  decoding="async"
                  fetchPriority="high"
                  loading="eager"
                  className={`w-6 h-6 flex-shrink-0 object-contain rounded`}
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={`font-medium text-xs leading-tight break-words overflow-wrap-anywhere ${
                    item.itemSet ? 'item-color-set' :
                    item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                    item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                    item.rarity === 'RARE' ? 'item-color-rare' :
                    item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                    item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common'
                  }`}>{item.name}</p>
                  <p className={`text-xs leading-tight text-muted`}>
                    <span>
                      {isTalismanMode ? formatTalismanStats(item) : renderItemInfo(item, statsFilter)}
                    </span>
                    {isDisabled && (
                      <span> — {isAlreadyEquipped
                        ? 'Already equipped (Unique)'
                        : isCareerRestricted
                          ? 'Not usable by this career'
                          : isRaceRestricted
                            ? 'Not usable by this race'
                            : isSlotIncompatible
                              ? 'Not compatible with this slot'
                              : isTalismanAlreadySlotted
                                ? 'Already slotted in this item'
                                : null}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default memo(ResultsList);
