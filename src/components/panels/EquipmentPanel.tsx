import React, { useState, Suspense } from 'react';
import { EquipSlot, Item, Stat, Career, ItemRarity, CAREER_RACE_MAPPING } from '../../types';
import { loadoutService } from '../../services/loadout/loadoutService';
import { useLoadoutData } from '../../hooks/useLoadoutData';
import { useLoadoutById } from '../../hooks/useLoadoutById';
const EquipmentSelector = React.lazy(() => import('../selector/EquipmentSelector'));
import { getBlockInvalidItems } from '../../services/ui/selectorPrefs';
import { DEFAULT_SLOT_ICONS } from '../../constants/slotIcons';
import Tooltip from '../tooltip/Tooltip';
import HoverTooltip from '../tooltip/HoverTooltip';
import { formatSlotName } from '../../utils/formatters';
import { isTwoHandedWeapon } from '../../utils/items';
import { getOffhandBlockReason, STAFF_ONLY_CAREERS, TWO_H_ONLY_CAREERS, CANNOT_USE_2H_MELEE } from '../../constants/careerWeaponRules';

interface EquipmentPanelProps {
  selectedCareer: Career | '';
  loadoutId?: string | null; // optional loadout to render (for dual mode)
  compact?: boolean; // compact visuals for dual mode
  iconOnly?: boolean; // minimal tiles: show only the main item icon
  hideHeading?: boolean; // optionally hide the internal "Equipment" heading
  side?: 'A' | 'B'; // for dual tooltip anchoring
}

export default function EquipmentPanel({ selectedCareer, loadoutId, compact = false, iconOnly = false, hideHeading = false, side }: EquipmentPanelProps) {
  const { currentLoadout } = useLoadoutData();
  const { loadout } = useLoadoutById(loadoutId ?? null);
  // Important: if loadoutId is explicitly provided (even null), don't fallback to currentLoadout.
  // This ensures Dual layout doesn't mirror side A into side B when B has no assigned loadout.
  const effectiveLoadout = (loadoutId !== undefined) ? loadout : currentLoadout;
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [talismanSlot, setTalismanSlot] = useState<{ slot: EquipSlot; index: number } | null>(null);
  const hasCareer = !!selectedCareer;
  const blockInvalidItems = getBlockInvalidItems();

  // Persistent filter state for items (carry across equipment slots within this panel)
  const [itemNameFilter, setItemNameFilter] = useState('');
  const [itemStatsFilter, setItemStatsFilter] = useState<Stat[]>([]);
  const [itemRarityFilter, setItemRarityFilter] = useState<ItemRarity[]>([]);

  // Persistent filter state for talismans (carry across talisman slots within this panel)
  const [talismanNameFilter, setTalismanNameFilter] = useState('');
  const [talismanStatsFilter, setTalismanStatsFilter] = useState<Stat[]>([]);
  const [talismanRarityFilter, setTalismanRarityFilter] = useState<ItemRarity[]>([]);

  // Helper function to check if an item is eligible based on level/renown requirements
  const isItemEligible = (item: Item | null): boolean => {
    if (!item || !effectiveLoadout) return true;
    const levelEligible = !item.levelRequirement || item.levelRequirement <= effectiveLoadout.level;
    const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= effectiveLoadout.renownRank;
    return levelEligible && renownEligible;
  };

  const handleSlotClick = (slot: EquipSlot) => {
    // Do not open selector unless a career has been selected
    if (!hasCareer) return;
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleItemSelect = async (item: Item) => {
    // Capture slot before any await to avoid race with onClose() clearing state
    const slotToUpdate = selectedSlot;
    if (slotToUpdate) {
      // Fetch complete item details including set bonuses
      const completeItem = await loadoutService.getItemWithDetails(item.id);
      if (loadoutId) {
        await loadoutService.updateItemForLoadout(loadoutId, slotToUpdate, completeItem);
      } else {
        await loadoutService.updateItem(slotToUpdate, completeItem);
      }
      // No need to manually update local state - the hook handles reactivity
    }
  };

  const handleSlotRightClick = async (e: React.MouseEvent, slot: EquipSlot) => {
    e.preventDefault(); // Prevent default context menu
    if (effectiveLoadout && effectiveLoadout.items[slot].item) {
      if (loadoutId) {
        await loadoutService.updateItemForLoadout(loadoutId, slot, null);
      } else {
        await loadoutService.updateItem(slot, null);
      }
    }
  };

  const handleTalismanClick = (slot: EquipSlot, index: number) => {
    // Do not open selector unless a career has been selected
    if (!hasCareer) return;
    setTalismanSlot({ slot, index });
    setIsModalOpen(true);
  };

  const handleTalismanSelect = async (talisman: Item) => {
    // Capture talisman slot before any await to avoid race with onClose() clearing state
    const slotInfo = talismanSlot;
    if (slotInfo) {
      // Fetch complete talisman details including set bonuses
      const completeTalisman = await loadoutService.getItemWithDetails(talisman.id);
      if (loadoutId) {
        await loadoutService.updateTalismanForLoadout(loadoutId, slotInfo.slot, slotInfo.index, completeTalisman);
      } else {
        await loadoutService.updateTalisman(slotInfo.slot, slotInfo.index, completeTalisman);
      }
    }
  };

  const handleTalismanRightClick = async (e: React.MouseEvent, slot: EquipSlot, index: number) => {
    e.preventDefault(); // Prevent default context menu
    if (effectiveLoadout && effectiveLoadout.items[slot].talismans[index]) {
      if (loadoutId) {
        await loadoutService.updateTalismanForLoadout(loadoutId, slot, index, null);
      } else {
        await loadoutService.updateTalisman(slot, index, null);
      }
    }
  };

  // If no loadout is assigned for this panel (e.g., only the other side was provided in the URL),
  // render a simple empty-state message instead of a loading indicator.
  if (!effectiveLoadout) {
    return (
      <div className="text-xs text-muted italic p-2">No loadout assigned for this side.</div>
    );
  }

  // Custom slot order: 2 columns
  // Column 1: Helm, Shoulders, Back, Body, Gloves, Belt, Boots, Pocket 1
  // Column 2: Main Hand, Off Hand, Ranged, Jewel 1, Jewel 2, Jewel 3, Jewel 4, Pocket 2
  // Event will be centered under Pocket 1 and Pocket 2 via a full-width row.
  const slotOrder = [
    // Row 1
    EquipSlot.HELM,           EquipSlot.MAIN_HAND,
    // Row 2
    EquipSlot.SHOULDER,       EquipSlot.OFF_HAND,
    // Row 3
    EquipSlot.BACK,           EquipSlot.RANGED_WEAPON,
    // Row 4
    EquipSlot.BODY,           EquipSlot.JEWELLERY1,
    // Row 5
    EquipSlot.GLOVES,         EquipSlot.JEWELLERY2,
    // Row 6
    EquipSlot.BELT,           EquipSlot.JEWELLERY3,
    // Row 7
    EquipSlot.BOOTS,          EquipSlot.JEWELLERY4,
    // Row 8
    EquipSlot.POCKET1,        EquipSlot.POCKET2,
  ];

  const wrapperClass = hideHeading ? 'relative' : 'lg:col-span-2 panel-container relative';

  return (
    <div className={wrapperClass}>
      {!hideHeading && <h2 className="panel-heading">Equipment</h2>}
    {/* Grid of equipment slots */}
  <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-2'}`}>
        {slotOrder.map((slot, index) => {
          if (slot === null) {
            return <div key={`empty-${index}`} className="relative invisible"></div>;
          }

          const slotData = effectiveLoadout.items[slot];
          const item = slotData.item || null;
          // Slot compatibility mirror of selector rules (per target slot)
          const invalidBySlotIncompatible = !!item && (() => {
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
          const invalidByLevel = item ? !isItemEligible(item) : false;
          const invalidByCareer = item && selectedCareer
            ? (item.careerRestriction && item.careerRestriction.length > 0 && !item.careerRestriction.includes(selectedCareer))
            : false;
          const invalidByRace = item && selectedCareer
            ? (item.raceRestriction && item.raceRestriction.length > 0 && !item.raceRestriction.some(r => (CAREER_RACE_MAPPING[selectedCareer as Career] || []).includes(r)))
            : false;
          const mainItem = effectiveLoadout.items[EquipSlot.MAIN_HAND]?.item || null;
          const invalidBy2HConflict = item ? (
            (slot === EquipSlot.OFF_HAND && mainItem && isTwoHandedWeapon(mainItem))
          ) : false;
          const invalidByPolicy = item && selectedCareer ? (
            (slot === EquipSlot.OFF_HAND && !!getOffhandBlockReason(selectedCareer as Career, item)) ||
            (slot === EquipSlot.MAIN_HAND && (
              (STAFF_ONLY_CAREERS.has(selectedCareer as Career) && item.type !== 'STAFF') ||
              (TWO_H_ONLY_CAREERS.has(selectedCareer as Career) && !isTwoHandedWeapon(item)) ||
              (CANNOT_USE_2H_MELEE.has(selectedCareer as Career) && isTwoHandedWeapon(item))
            ))
          ) : false;
          // Unique-equpped: if the same unique item appears earlier in the UI order, mark this later one invalid
          const earlierSlots = slotOrder.slice(0, index).filter((s): s is EquipSlot => s !== null);
          const invalidByUniqueDuplicate = !!item && !!item.uniqueEquipped && earlierSlots.some((s) => {
            const earlier = effectiveLoadout.items[s]?.item || null;
            return earlier && earlier.id === item.id;
          });
          const isSlotItemInvalid = !!item && (invalidByLevel || invalidByCareer || invalidByRace || invalidBySlotIncompatible || invalidBy2HConflict || invalidByPolicy || invalidByUniqueDuplicate);
          return (
            <div key={slot} className="relative" data-side={side || ''} data-slot={slot}>
              <div className={`equipment-slot ${compact ? 'p-1' : ''}`}>
                <div className={(iconOnly ? 'flex items-start gap-1' : 'flex items-start gap-2')}>
                  {slotData.item ? (
                    <Tooltip item={{ ...slotData.item, talismans: slotData.talismans }} loadoutId={effectiveLoadout.id} side={side} slot={slot}>
                      <div
                        className={`equipment-icon cursor-pointer ${compact ? 'w-12 h-12' : iconOnly ? 'w-12 h-12' : ''}${isSlotItemInvalid ? ' invalid' : ''}`}
                        onClick={() => handleSlotClick(slot)}
                        onContextMenu={(e) => handleSlotRightClick(e, slot)}
                        data-anchor-key={side ? `${side}:${slot}` : undefined}
                      >
                        <div className={`icon-frame ${slotData.item.itemSet ? 'item-color-set' :
                          slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                          slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                          slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                          slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                          slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common'} relative z-10`}>
                          {/* Invalid overlay in top-left */}
                          {isSlotItemInvalid && (
                            <span className="absolute top-0 left-0 text-red-500 text-xs leading-none select-none z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] font-bold pointer-events-none" title="Invalid item for current rules or requirements">🛇</span>
                          )}
                          <img
                            src={slotData.item.iconUrl}
                            alt={slotData.item.name}
                            className={`w-full h-full object-contain rounded`}
                          />
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <HoverTooltip content={hasCareer ? `Click to select ${formatSlotName(slot)}` : 'Select a career first'}>
                      <div
                        className={`equipment-icon cursor-pointer ${compact ? 'w-12 h-12' : iconOnly ? 'w-12 h-12' : ''}`}
                        onClick={() => handleSlotClick(slot)}
                        onContextMenu={(e) => handleSlotRightClick(e, slot)}
                      >
                        <div className="icon-frame-empty w-full h-full rounded">
                          <img src={DEFAULT_SLOT_ICONS[slot]} alt={`${slot} slot`} className="w-full h-full object-contain rounded opacity-50" />
                        </div>
                      </div>
                    </HoverTooltip>
                  )}
                  {/* Icon-only label and horizontal talismans */}
                  {iconOnly && (
                    slotData.item ? (
                      <div className="flex items-start gap-2 ml-1 w-full justify-between">
                        {/* Slot label: item name with rarity color */}
                        <div className="min-w-0 flex-1">
                          <p 
                            className={`equipment-item-name ${(slotData.item.itemSet ? 'item-color-set' :
                              slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                              slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                              slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                              slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                              slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common')}`}
                            title={slotData.item.name}
                          >
                            {slotData.item.name}
                          </p>
                        </div>
                        {/* Talismans arranged vertically, right-aligned */}
                        {slotData.item.talismanSlots > 0 && (
                          <div className="flex flex-col items-end gap-1">
                            {Array.from({ length: slotData.item.talismanSlots }, (_, i) => {
                              const t = slotData.talismans[i];
                              const seenBefore = new Set<string>();
                              for (let k = 0; k < i; k++) {
                                const prev = slotData.talismans[k];
                                if (prev && prev.id) seenBefore.add(prev.id);
                              }
                              const isDuplicateTalisman = !!(t && t.id && seenBefore.has(t.id));
                              return (
                                <div key={i} data-talisman-index={i} className={`talisman-slot${isDuplicateTalisman ? ' invalid' : ''} ${t ? 'border-current ' : ''}${t ? ((t.itemSet ? 'item-color-set' :
                                  t.rarity === 'MYTHIC' ? 'item-color-mythic' :
                                  t.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                                  t.rarity === 'RARE' ? 'item-color-rare' :
                                  t.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                                  t.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common')) : ''} relative`}>
                                  {t ? (
                                    <Tooltip item={t} isTalismanTooltip={true} loadoutId={effectiveLoadout.id} side={side} slot={slot} talismanIndex={i}>
                                      <div className="relative">
                                        {isDuplicateTalisman && (
                                          <span className="absolute top-0 left-0 text-red-500 text-[10px] leading-none select-none z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] font-bold pointer-events-none" title="Duplicate talisman">🛇</span>
                                        )}
                                        <img
                                          src={t.iconUrl}
                                          alt={t.name}
                                          className={`w-full h-full object-contain rounded cursor-pointer`}
                                          onClick={() => handleTalismanClick(slot, i)}
                                          onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                          data-anchor-key={side ? `${side}:${slot}:t${i}` : undefined}
                                        />
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <HoverTooltip content={hasCareer ? 'Click to select talisman' : 'Select a career first'}>
                                      <div className="icon-frame-empty w-full h-full rounded cursor-pointer" onClick={() => handleTalismanClick(slot, i)} onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}>
                                        <img
                                          src={DEFAULT_SLOT_ICONS[EquipSlot.JEWELLERY1]}
                                          alt="Empty talisman slot"
                                          className="w-full h-full object-contain rounded opacity-50"
                                        />
                                      </div>
                                    </HoverTooltip>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Empty slot: show slot label (slot name) right-aligned where talisman 0 would be
                      <div className="ml-1 w-full flex justify-end">
                        <p className="equipment-slot-name" title={formatSlotName(slot)}>{formatSlotName(slot)}</p>
                      </div>
                    )
                  )}
                  {!iconOnly && (
                    <div className="equipment-text">
                      {!compact && slotData.item && (
                        <p 
                          className={`equipment-item-name ${(slotData.item.itemSet ? 'item-color-set' :
                            slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                            slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                            slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                            slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                            slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common')}`}
                        >
                          {slotData.item.name}
                        </p>
                      )}
                      {/* Talisman slots */}
                      {slotData.item && slotData.item.talismanSlots > 0 && (
                        <div className="flex justify-start items-center mt-1 gap-2">
                          <div className="flex gap-1">
                          {Array.from({ length: slotData.item.talismanSlots }, (_, i) => {
                                const t = slotData.talismans[i];
                                const seenBefore = new Set<string>();
                                for (let k = 0; k < i; k++) {
                                  const prev = slotData.talismans[k];
                                  if (prev && prev.id) seenBefore.add(prev.id);
                                }
                                const isDuplicateTalisman = !!(t && t.id && seenBefore.has(t.id));
                                return (
                                  <div key={i} data-talisman-index={i} className={`talisman-slot${isDuplicateTalisman ? ' invalid' : ''} ${t ? 'border-current ' : ''}${t ? ((t.itemSet ? 'item-color-set' :
                                    t.rarity === 'MYTHIC' ? 'item-color-mythic' :
                                    t.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                                    t.rarity === 'RARE' ? 'item-color-rare' :
                                    t.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                                    t.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common')) : ''} relative`}> 
                                    {t ? (
                                      <Tooltip item={t} isTalismanTooltip={true} loadoutId={effectiveLoadout.id} side={side} slot={slot} talismanIndex={i}>
                                        <div className="relative">
                                          {isDuplicateTalisman && (
                                            <span className="absolute top-0 left-0 text-red-500 text-[10px] leading-none select-none z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] font-bold pointer-events-none" title="Duplicate talisman">🛇</span>
                                          )}
                                          <img
                                            src={t.iconUrl}
                                            alt={t.name}
                                            className={`w-full h-full object-contain rounded cursor-pointer`}
                                            onClick={() => handleTalismanClick(slot, i)}
                                            onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                            data-anchor-key={side ? `${side}:${slot}:t${i}` : undefined}
                                          />
                                        </div>
                                      </Tooltip>
                                    ) : (
                                  <HoverTooltip content={hasCareer ? 'Click to select talisman' : 'Select a career first'}>
                                    <div className="icon-frame-empty w-full h-full rounded cursor-pointer" onClick={() => handleTalismanClick(slot, i)} onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}>
                                      <img
                                        src={DEFAULT_SLOT_ICONS[EquipSlot.JEWELLERY1]}
                                        alt="Empty talisman slot"
                                        className="w-full h-full object-contain rounded opacity-50"
                                      />
                                    </div>
                                  </HoverTooltip>
                                )}
                              </div>
                            );
                          })}
                          </div>
                          {/* Overlay handles invalid indicator; remove inline marker */}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* Centered Event tile spanning both columns */}
        {(() => {
          const slot = EquipSlot.EVENT;
          const slotData = effectiveLoadout.items[slot];
          const item = slotData.item || null;
          // Match single-column width inside a two-column grid (subtract half the gap)
          const eventTileWidth = compact ? 'calc(50% - 0.125rem)' : 'calc(50% - 0.25rem)';
          // Event: only accept items for EVENT slot
          const invalidBySlotIncompatible = !!item && (item.slot !== EquipSlot.EVENT);
          const invalidByLevel = item ? !isItemEligible(item) : false;
          const invalidByCareer = item && selectedCareer
            ? (item.careerRestriction && item.careerRestriction.length > 0 && !item.careerRestriction.includes(selectedCareer))
            : false;
          const invalidByRace = item && selectedCareer
            ? (item.raceRestriction && item.raceRestriction.length > 0 && !item.raceRestriction.some(r => (CAREER_RACE_MAPPING[selectedCareer as Career] || []).includes(r)))
            : false;
          const invalidBy2HConflict = false;
          const invalidByPolicy = false;
          const earlierSlots = slotOrder.filter((s): s is EquipSlot => s !== null);
          const invalidByUniqueDuplicate = !!item && !!item.uniqueEquipped && earlierSlots.some((s) => {
            const earlier = effectiveLoadout.items[s]?.item || null;
            return earlier && earlier.id === item.id;
          });
          const isSlotItemInvalid = !!item && (invalidByLevel || invalidByCareer || invalidByRace || invalidBySlotIncompatible || invalidBy2HConflict || invalidByPolicy || invalidByUniqueDuplicate);
          return (
            <div key="event-full" className="col-span-2 flex justify-center">
              <div className="relative" data-side={side || ''} data-slot={slot} style={{ width: eventTileWidth, maxWidth: '100%' }}>
                <div className={`equipment-slot ${compact ? 'p-1' : ''}`}>
                  <div className={(iconOnly ? 'flex items-start gap-1' : 'flex items-start gap-2')}>
                    {slotData.item ? (
                      <Tooltip item={{ ...slotData.item, talismans: slotData.talismans }} loadoutId={effectiveLoadout.id} side={side} slot={slot}>
                        <div
                          className={`equipment-icon cursor-pointer ${compact ? 'w-12 h-12' : iconOnly ? 'w-12 h-12' : ''}${isSlotItemInvalid ? ' invalid' : ''}`}
                          onClick={() => handleSlotClick(slot)}
                          onContextMenu={(e) => handleSlotRightClick(e, slot)}
                          data-anchor-key={side ? `${side}:${slot}` : undefined}
                        >
                          <div className={`icon-frame ${slotData.item.itemSet ? 'item-color-set' :
                            slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                            slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                            slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                            slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                            slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common'} relative z-10`}>
                            {isSlotItemInvalid && (
                              <span className="absolute top-0 left-0 text-red-500 text-xs leading-none select-none z-20 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] font-bold pointer-events-none" title="Invalid item for current rules or requirements">🛇</span>
                            )}
                            <img
                              src={slotData.item.iconUrl}
                              alt={slotData.item.name}
                              className={`w-full h-full object-contain rounded`}
                            />
                          </div>
                        </div>
                      </Tooltip>
                    ) : (
                      <HoverTooltip content={hasCareer ? `Click to select ${formatSlotName(slot)}` : 'Select a career first'}>
                        <div
                          className={`equipment-icon cursor-pointer ${compact ? 'w-12 h-12' : iconOnly ? 'w-12 h-12' : ''}`}
                          onClick={() => handleSlotClick(slot)}
                          onContextMenu={(e) => handleSlotRightClick(e, slot)}
                        >
                          <div className="icon-frame-empty w-full h-full rounded">
                            <img src={DEFAULT_SLOT_ICONS[slot]} alt={`${slot} slot`} className="w-full h-full object-contain rounded opacity-50" />
                          </div>
                        </div>
                      </HoverTooltip>
                    )}
                    {/* Icon-only label and talismans/slot name for Event (usually no talismans) */}
                    {iconOnly && (
                      slotData.item ? (
                        <div className="ml-1">
                          <p 
                            className={`equipment-item-name ${(slotData.item.itemSet ? 'item-color-set' :
                              slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                              slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                              slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                              slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                              slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common')}`}
                            title={slotData.item.name}
                          >
                            {slotData.item.name}
                          </p>
                        </div>
                      ) : (
                        <div className="ml-1">
                          <p className="equipment-slot-name" title={formatSlotName(slot)}>{formatSlotName(slot)}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      
      <Suspense fallback={null}>
        <EquipmentSelector
        slot={selectedSlot || talismanSlot?.slot || EquipSlot.HELM}
        isOpen={isModalOpen && !!(selectedSlot || talismanSlot)}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
          setTalismanSlot(null);
        }}
        onSelect={talismanSlot ? handleTalismanSelect : handleItemSelect}
        isTalismanMode={!!talismanSlot}
  // For talismans, use the holding item's levelRequirement to match eligibility rule
  holdingItemLevelReq={talismanSlot ? effectiveLoadout?.items[talismanSlot.slot].item?.levelRequirement : undefined}
        talismanSlotIndex={talismanSlot?.index}
        loadoutId={loadoutId || null}
        nameFilter={talismanSlot ? talismanNameFilter : itemNameFilter}
        statsFilter={talismanSlot ? talismanStatsFilter : itemStatsFilter}
        rarityFilter={talismanSlot ? talismanRarityFilter : itemRarityFilter}
        onNameFilterChange={talismanSlot ? setTalismanNameFilter : setItemNameFilter}
        onStatsFilterChange={talismanSlot ? setTalismanStatsFilter : setItemStatsFilter}
        onRarityFilterChange={talismanSlot ? setTalismanRarityFilter : setItemRarityFilter}
        selectedCareer={selectedCareer}
  // pass UI preference through props for initial render behavior
  // @ts-expect-error prop is read in EquipmentSelector via checkbox state
  blockInvalidItems={blockInvalidItems}
        />
      </Suspense>
    </div>
  );
}
