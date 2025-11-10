import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import type { LoadoutSide } from '../../types';
import { Career } from '../../types';

export function getActiveSide(): LoadoutSide {
  return loadoutStoreAdapter.getActiveSide();
}

export function getSideLoadoutId(side: LoadoutSide): string | null {
  return loadoutStoreAdapter.getSideLoadoutId(side);
}

export function getLoadoutForSide(side: LoadoutSide) {
  return loadoutStoreAdapter.getLoadoutForSide(side);
}

// Return the per-career loadout id mapping for a side (shallow copy for safety)
export function getSideCareerLoadoutIds(side: LoadoutSide): Partial<Record<Career, string>> {
  // The adapter doesn't expose a direct getter; enumerate careers and ask per career
  const careers = Object.values(Career) as Career[];
  const map: Partial<Record<Career, string>> = {};
  careers.forEach((c) => {
    const id = loadoutStoreAdapter.getSideCareerLoadoutId(side, c);
    if (id) map[c] = id;
  });
  return map;
}

export function getCurrentLoadout() {
  return loadoutStoreAdapter.getCurrentLoadout();
}

export function getAllLoadouts() {
  return loadoutStoreAdapter.getLoadouts();
}

export function getCurrentLoadoutId() {
  return loadoutStoreAdapter.getCurrentLoadoutId();
}

export function isUniqueItemAlreadyEquippedInLoadout(itemId: string, loadoutId?: string): boolean {
  const loadout = loadoutId
    ? loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId)
    : loadoutStoreAdapter.getCurrentLoadout();
  if (!loadout) return false;
  for (const equipped of Object.values(loadout.items)) {
    const it = equipped?.item;
    if (it && it.id === itemId && it.uniqueEquipped) return true;
  }
  return false;
}

export function isTalismanAlreadySlottedInItem(talismanId: string, slot: import('../../types').EquipSlot, excludeIndex?: number): boolean {
  const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
  if (!currentLoadout) return false;
  const itemTalismans = currentLoadout.items[slot].talismans;
  return itemTalismans.some((t, idx) => t && t.id === talismanId && idx !== excludeIndex);
}

export function isTalismanAlreadySlottedInItemForLoadout(loadoutId: string, talismanId: string, slot: import('../../types').EquipSlot, excludeIndex?: number): boolean {
  const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
  if (!loadout) return false;
  const itemTalismans = loadout.items[slot].talismans;
  return itemTalismans.some((t, idx) => t && t.id === talismanId && idx !== excludeIndex);
}
