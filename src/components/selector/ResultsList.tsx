import { memo, type ReactNode } from 'react';
import Tooltip from '../tooltip/Tooltip';
import { CAREER_RACE_MAPPING, Career, EquipSlot, Item, Stat } from '../../types';
import { loadoutService } from '../../services/loadout/loadoutService';
import { formatItemTypeName, formatSlotName, formatStatName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue, formatFixed } from '../../utils/formatters';
import { isTwoHandedWeapon } from '../../utils/items';
import { CANNOT_USE_2H_MELEE, getOffhandBlockReason } from '../../constants/careerWeaponRules';

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
  const slotNameRaw = formatSlotName(item.slot);
  // Keep the actual slot label; handle 2H in the item name instead
  const slotNode: ReactNode = slotNameRaw;
  // Build base meta: Type, Slot, Item Level
  const parts: string[] = [];
  parts.push(`${typeName}`);
  parts.push(`${slotNode}` as unknown as string);
  parts.push(`Item Level: ${item.itemLevel}`);
  // Append DPS/Block and Speed like in item tooltips
  const isShield = item.type === 'BASIC_SHIELD' || item.type === 'SHIELD' || item.type === 'EXPERT_SHIELD';
  if (isShield && item.armor > 0) {
    parts.push(`${item.armor} Block Rating`);
  } else if (item.dps > 0) {
    parts.push(`${formatFixed(item.dps / 10, 1)} DPS`);
  }
  if (item.speed > 0) {
    parts.push(`${formatFixed(item.speed / 100, 1)} Speed`);
  }
  const baseNode = (<>{parts.join(', ')}</>);
  if (!filteredStats || filteredStats.length === 0) return baseNode;
  const lines = (item.stats || []).filter((s) => s && filteredStats.includes(s.stat as Stat));
  if (lines.length === 0) return baseNode;
  const rendered = lines.map((line) => {
    const isPct = isPercentItemStat(line.stat, line.percentage);
    const normalized = isPct ? line.value : normalizeStatDisplayValue(line.stat, line.value);
    const value = formatStatValue(normalized, isPct, 1);
    const statName = formatStatName(line.stat);
    return `${value} ${statName}`;
  }).join(' / ');
  return (
    <>
      {baseNode}, <span className="text-gray-900 dark:text-gray-100 font-medium">{rendered}</span>
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

        // If a two-handed weapon is equipped in MAIN_HAND, disallow any OFF_HAND selections
        const currentLoadout = loadoutId
          ? (loadoutService.getAllLoadouts().find(l => l.id === loadoutId) || loadoutService.getCurrentLoadout())
          : loadoutService.getCurrentLoadout();
        const mainHandItem = currentLoadout?.items?.[EquipSlot.MAIN_HAND]?.item || null;
        const isOffhandDisallowedByTwoHandedMain = !isTalismanMode && slot === EquipSlot.OFF_HAND && !!mainHandItem && isTwoHandedWeapon(mainHandItem as Item);
        const offHandItem = currentLoadout?.items?.[EquipSlot.OFF_HAND]?.item || null;
        const isMainhand2HDisallowedByOffhand = !isTalismanMode && slot === EquipSlot.MAIN_HAND && !!offHandItem && isTwoHandedWeapon(item as Item);

        // Career off-hand policy: if OFF_HAND is selected, determine if the item type is allowed for the selected career
        const offhandPolicyReason = !isTalismanMode && slot === EquipSlot.OFF_HAND && eligibilityCareer
          ? getOffhandBlockReason(eligibilityCareer as Career, item as Item)
          : null;

        // UI-only: careers that cannot use two-handed melee
        const cannotUse2HReason = !isTalismanMode && slot === EquipSlot.MAIN_HAND && eligibilityCareer && isTwoHandedWeapon(item as Item)
          ? (CANNOT_USE_2H_MELEE.has(eligibilityCareer as Career) ? 'This career cannot equip two-handed weapons' : null)
          : null;

        const isTalismanAlreadySlotted = isTalismanMode && talismanSlotIndex !== undefined && (
          loadoutId
            ? loadoutService.isTalismanAlreadySlottedInItemForLoadout(loadoutId, item.id, slot, talismanSlotIndex)
            : loadoutService.isTalismanAlreadySlottedInItem(item.id, slot, talismanSlotIndex)
        );
  const isDisabled = isAlreadyEquipped || isCareerRestricted || isRaceRestricted || isTalismanAlreadySlotted || isSlotIncompatible || isOffhandDisallowedByTwoHandedMain || isMainhand2HDisallowedByOffhand || !!offhandPolicyReason || !!cannotUse2HReason;

        return (
          <Tooltip key={item.id} item={item as Item} isTalismanTooltip={isTalismanMode} loadoutId={effectiveLoadoutId || undefined}>
            <div
              className={`equipment-slot p-1.5 h-12 flex items-center ${
                isDisabled
                  ? 'cursor-not-allowed grayscale'
                  : 'cursor-pointer hover:bg-[var(--panel-hover)]'
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
                  }`}>
                    {item.name}
                    {item.slot === EquipSlot.MAIN_HAND && isTwoHandedWeapon(item) ? (<span className="text-muted"> (2H)</span>) : null}
                  </p>
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
                            : isOffhandDisallowedByTwoHandedMain
                              ? 'Two-handed main-hand equipped'
                              : isMainhand2HDisallowedByOffhand
                              ? 'Off-hand equipped'
                              : offhandPolicyReason
                                ? offhandPolicyReason
                                : cannotUse2HReason
                                  ? cannotUse2HReason
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
