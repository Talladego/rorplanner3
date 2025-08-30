'use client';

import React, { useState } from 'react';
import { EquipSlot, Item } from '../types';
import { loadoutService } from '../services/loadoutService';
import { useLoadoutData } from '../hooks/useLoadoutData';
import EquipmentSelector from './EquipmentSelector';
import { DEFAULT_SLOT_ICONS } from '../constants/slotIcons';
import { formatSlotName } from '../utils/formatters';
import Tooltip from './Tooltip';

export default function EquipmentPanel() {
  const { currentLoadout } = useLoadoutData();
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSlotClick = (slot: EquipSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleItemSelect = (item: Item) => {
    if (selectedSlot) {
      loadoutService.updateItem(selectedSlot, item);
      // No need to manually update local state - the hook handles reactivity
    }
  };

  const handleSlotRightClick = (e: React.MouseEvent, slot: EquipSlot) => {
    e.preventDefault(); // Prevent default context menu
    if (currentLoadout && currentLoadout.items[slot].item) {
      loadoutService.updateItem(slot, null);
    }
  };

  const handleTalismanClick = (slot: EquipSlot, index: number) => {
    // Placeholder: Open talisman selection
    alert(`Select talisman for ${formatSlotName(slot)} slot ${index}`);
  };

  const handleTalismanRightClick = (e: React.MouseEvent, slot: EquipSlot, index: number) => {
    e.preventDefault(); // Prevent default context menu
    if (currentLoadout && currentLoadout.items[slot].talismans[index]) {
      loadoutService.updateTalisman(slot, index, null);
    }
  };

  if (!currentLoadout) return <div>Loading...</div>;

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
    <div className="lg:col-span-2 panel-container">
      <h2 className="panel-heading">Equipment</h2>
      <div className="grid grid-cols-3 gap-3">
        {slotOrder.map((slot, index) => {
          if (slot === null) {
            return <div key={`empty-${index}`} className="invisible"></div>;
          }

          const slotData = currentLoadout.items[slot];
          return (
            <div key={slot} className="relative">
              <Tooltip item={slotData.item}>
                <div
                  className="equipment-slot"
                  onClick={() => handleSlotClick(slot)}
                  onContextMenu={(e) => handleSlotRightClick(e, slot)}
                >
                  <div className="flex items-center gap-2">
                    <div className="equipment-icon">
                      {slotData.item ? (
                        <img src={slotData.item.iconUrl} alt={slotData.item.name} className="w-full h-full object-contain rounded" />
                      ) : (
                        <img src={DEFAULT_SLOT_ICONS[slot]} alt={`${slot} slot`} className="w-full h-full object-contain rounded opacity-50" />
                      )}
                    </div>
                    <div className="equipment-text">
                      <p className="equipment-slot-name">{formatSlotName(slot)}</p>
                      {slotData.item && (
                        <p className="equipment-item-name">{slotData.item.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Tooltip>
              {/* Talisman slots */}
              {slotData.item && slotData.item.talismanSlots > 0 && (
                <div className="flex justify-center mt-1 gap-1">
                  {Array.from({ length: slotData.item.talismanSlots }, (_, i) => (
                    <Tooltip key={i} item={slotData.talismans[i]}>
                      <div
                        className="talisman-slot"
                        onClick={() => handleTalismanClick(slot, i)}
                        onContextMenu={(e) => handleTalismanRightClick(e, slot, i)}
                      >
                        {slotData.talismans[i] ? (
                          <img src={slotData.talismans[i]!.iconUrl} alt={slotData.talismans[i]!.name} className="w-full h-full object-contain rounded" />
                        ) : (
                          <span className="text-xs text-muted">T</span>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedSlot && (
        <EquipmentSelector
          slot={selectedSlot}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleItemSelect}
        />
      )}
    </div>
  );
}
