import { EquipSlot } from '../types';

export function formatSlotName(slot: EquipSlot): string {
  return slot
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}
