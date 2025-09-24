import React, { useState } from 'react';
import { EquipSlot, Item, Stat, Career, ItemRarity } from '../types';
import { loadoutService } from '../services/loadoutService';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { useLoadoutById } from '../hooks/useLoadoutById';
import EquipmentSelector from './EquipmentSelector';
import { DEFAULT_SLOT_ICONS } from '../constants/slotIcons';
import Tooltip from './Tooltip';
import HoverTooltip from './HoverTooltip';
import { formatSlotName } from '../utils/formatters';

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

  // Persistent filter state shared across all equipment selections
  const [nameFilter, setNameFilter] = useState('');
  const [statsFilter, setStatsFilter] = useState<Stat[]>([]);
  const [rarityFilter, setRarityFilter] = useState<ItemRarity[]>([]);

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

  // Custom slot order for the desired layout
  const slotOrder = [
    // Row 1
    EquipSlot.HELM, EquipSlot.MAIN_HAND, EquipSlot.JEWELLERY1,
    // Row 2
    EquipSlot.SHOULDER, EquipSlot.OFF_HAND, EquipSlot.JEWELLERY2,
    // Row 3
    EquipSlot.BACK, EquipSlot.RANGED_WEAPON, EquipSlot.JEWELLERY3,
    // Row 4 (Body armor, empty slot, Jewel 4)
    EquipSlot.BODY, null, EquipSlot.JEWELLERY4,
    // Row 5
    EquipSlot.GLOVES, EquipSlot.EVENT, null,
    // Row 6
    EquipSlot.BELT, EquipSlot.POCKET1, null,
    // Row 7
    EquipSlot.BOOTS, EquipSlot.POCKET2, null,
  ];

  return (
    <div className="lg:col-span-2 panel-container relative">
      {!hideHeading && <h2 className="panel-heading">Equipment</h2>}
  <div className={`grid grid-cols-3 ${compact ? 'gap-2' : 'gap-3'}`}>
        {slotOrder.map((slot, index) => {
          if (slot === null) {
            return <div key={`empty-${index}`} className="invisible"></div>;
          }

          const slotData = effectiveLoadout.items[slot];
          return (
            <div key={slot} className="relative" data-side={side || ''} data-slot={slot}>
              <div className={`equipment-slot ${compact ? 'p-1' : ''}`}>
                <div className={iconOnly ? 'flex items-start gap-1' : 'flex items-start gap-2'}>
                  {slotData.item ? (
                    <Tooltip item={{ ...slotData.item, talismans: slotData.talismans }} loadoutId={effectiveLoadout.id} side={side} slot={slot}>
                      <div
                        className={`equipment-icon cursor-pointer ${compact ? 'w-12 h-12' : iconOnly ? 'w-12 h-12' : ''}`}
                        onClick={() => handleSlotClick(slot)}
                        onContextMenu={(e) => handleSlotRightClick(e, slot)}
                        data-anchor-key={side ? `${side}:${slot}` : undefined}
                      >
                        <div className={`icon-frame ${isItemEligible(slotData.item) ? (slotData.item.itemSet ? 'item-color-set' :
                          slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                          slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                          slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                          slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                          slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : ''}`}>
                          <img 
                            src={slotData.item.iconUrl} 
                            alt={slotData.item.name} 
                            className={`w-full h-full object-contain rounded ${!isItemEligible(slotData.item) ? 'opacity-50 grayscale' : ''}`} 
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
                  {iconOnly && slotData.item && slotData.item.talismanSlots > 0 && (
                    <div className="flex flex-col justify-start items-start gap-1 ml-1">
                      {Array.from({ length: slotData.item.talismanSlots }, (_, i) => {
                        const isParentItemEligible = isItemEligible(slotData.item!);
                        const isTalismanEligible = slotData.talismans[i] ? isItemEligible(slotData.talismans[i]) : true;
                        const isSlotGreyedOut = !isParentItemEligible || (slotData.talismans[i] && !isTalismanEligible);
                        return (
                          <div key={i} data-talisman-index={i} className={`talisman-slot ${compact ? 'w-5 h-5' : ''} ${isSlotGreyedOut ? 'opacity-50' : ''} ${slotData.talismans[i] ? 'border-current ' : ''}${slotData.talismans[i] ? (isTalismanEligible ? (slotData.talismans[i]!.itemSet ? 'item-color-set' :
                            slotData.talismans[i]!.rarity === 'MYTHIC' ? 'item-color-mythic' :
                            slotData.talismans[i]!.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                            slotData.talismans[i]!.rarity === 'RARE' ? 'item-color-rare' :
                            slotData.talismans[i]!.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                            slotData.talismans[i]!.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : '') : ''}`}> 
                            {slotData.talismans[i] ? (
                              <Tooltip item={slotData.talismans[i]} isTalismanTooltip={true} loadoutId={effectiveLoadout.id} side={side} slot={slot} talismanIndex={i}>
                                <img
                                  src={slotData.talismans[i]!.iconUrl}
                                  alt={slotData.talismans[i]!.name}
                                  className={`w-full h-full object-contain rounded cursor-pointer ${!isTalismanEligible ? 'grayscale' : ''}`}
                                  onClick={() => handleTalismanClick(slot, i)}
                                  onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                  data-anchor-key={side ? `${side}:${slot}:t${i}` : undefined}
                                />
                              </Tooltip>
                            ) : (
                              <HoverTooltip content={hasCareer ? 'Click to select talisman' : 'Select a career first'}>
                                <img
                                  src="https://armory.returnofreckoning.com/icon/1"
                                  alt="Empty talisman slot"
                                  className="w-full h-full object-contain rounded cursor-pointer opacity-50"
                                  onClick={() => handleTalismanClick(slot, i)}
                                  onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                />
                              </HoverTooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!iconOnly && (
                    <div className="equipment-text">
                      {!compact && slotData.item && (
                        <p 
                          className={`equipment-item-name ${!isItemEligible(slotData.item) ? 'text-gray-500 opacity-60' : ''} ${isItemEligible(slotData.item) ? (slotData.item.itemSet ? 'item-color-set' :
                            slotData.item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                            slotData.item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                            slotData.item.rarity === 'RARE' ? 'item-color-rare' :
                            slotData.item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                            slotData.item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : ''}`}
                        >
                          {slotData.item.name}
                        </p>
                      )}
                      {/* Talisman slots */}
                      {slotData.item && slotData.item.talismanSlots > 0 && (
                        <div className="flex justify-start mt-1 gap-1">
                          {Array.from({ length: slotData.item.talismanSlots }, (_, i) => {
                            const isParentItemEligible = isItemEligible(slotData.item);
                            const isTalismanEligible = slotData.talismans[i] ? isItemEligible(slotData.talismans[i]) : true;
                            const isSlotGreyedOut = !isParentItemEligible || (slotData.talismans[i] && !isTalismanEligible);
                            
                            return (
                              <div key={i} data-talisman-index={i} className={`talisman-slot ${compact ? 'w-5 h-5' : ''} ${isSlotGreyedOut ? 'opacity-50' : ''} ${slotData.talismans[i] ? 'border-current ' : ''}${slotData.talismans[i] ? (isTalismanEligible ? (slotData.talismans[i]!.itemSet ? 'item-color-set' :
                                slotData.talismans[i]!.rarity === 'MYTHIC' ? 'item-color-mythic' :
                                slotData.talismans[i]!.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                                slotData.talismans[i]!.rarity === 'RARE' ? 'item-color-rare' :
                                slotData.talismans[i]!.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                                slotData.talismans[i]!.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : '') : ''}`}> 
                                {slotData.talismans[i] ? (
                                  <Tooltip item={slotData.talismans[i]} isTalismanTooltip={true} loadoutId={effectiveLoadout.id} side={side} slot={slot} talismanIndex={i}>
                                    <img
                                      src={slotData.talismans[i]!.iconUrl}
                                      alt={slotData.talismans[i]!.name}
                                      className={`w-full h-full object-contain rounded cursor-pointer ${!isTalismanEligible ? 'grayscale' : ''}`}
                                      onClick={() => handleTalismanClick(slot, i)}
                                      onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                      data-anchor-key={side ? `${side}:${slot}:t${i}` : undefined}
                                    />
                                  </Tooltip>
                                ) : (
                                  <HoverTooltip content={hasCareer ? 'Click to select talisman' : 'Select a career first'}>
                                    <img
                                      src="https://armory.returnofreckoning.com/icon/1"
                                      alt="Empty talisman slot"
                                      className="w-full h-full object-contain rounded cursor-pointer opacity-50"
                                      onClick={() => handleTalismanClick(slot, i)}
                                      onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                                    />
                                  </HoverTooltip>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
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
        nameFilter={nameFilter}
        statsFilter={statsFilter}
        rarityFilter={rarityFilter}
        onNameFilterChange={setNameFilter}
        onStatsFilterChange={setStatsFilter}
        onRarityFilterChange={setRarityFilter}
        selectedCareer={selectedCareer}
      />
    </div>
  );
}
