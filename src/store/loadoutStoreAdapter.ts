import { useLoadoutStore } from './loadoutStore';
import { ILoadoutStore, Loadout, StatsSummary, Career, EquipSlot, Item } from '../types';

class LoadoutStoreAdapter implements ILoadoutStore {
  getLoadouts(): Loadout[] {
    return useLoadoutStore.getState().loadouts;
  }

  getCurrentLoadoutId(): string | null {
    return useLoadoutStore.getState().currentLoadoutId;
  }

  getCurrentLoadout(): Loadout | null {
    return useLoadoutStore.getState().getCurrentLoadout();
  }

  getStatsSummary(): StatsSummary {
    return useLoadoutStore.getState().statsSummary;
  }

  setCareer(career: Career | null): void {
    useLoadoutStore.getState().setCareer(career);
  }

  setLevel(level: number): void {
    useLoadoutStore.getState().setLevel(level);
  }

  setRenownRank(renownRank: number): void {
    useLoadoutStore.getState().setRenownRank(renownRank);
  }

  setItem(slot: EquipSlot, item: Item | null): void {
    useLoadoutStore.getState().setItem(slot, item);
  }

  setTalisman(slot: EquipSlot, index: number, talisman: Item | null): void {
    useLoadoutStore.getState().setTalisman(slot, index, talisman);
  }

  resetCurrentLoadout(): void {
    useLoadoutStore.getState().resetCurrentLoadout();
  }

  calculateStats(): void {
    useLoadoutStore.getState().calculateStats();
  }

  createLoadout(name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string): string {
    return useLoadoutStore.getState().createLoadout(name, level, renownRank, isFromCharacter, characterName);
  }

  deleteLoadout(id: string): void {
    useLoadoutStore.getState().deleteLoadout(id);
  }

  async switchLoadout(id: string): Promise<void> {
    await useLoadoutStore.getState().switchLoadout(id);
  }

  markLoadoutAsModified(id: string): void {
    useLoadoutStore.getState().markLoadoutAsModified(id);
  }

  updateLoadoutCharacterStatus(id: string, isFromCharacter: boolean, characterName?: string): void {
    useLoadoutStore.getState().updateLoadoutCharacterStatus(id, isFromCharacter, characterName);
  }

  async importFromCharacter(characterId: string): Promise<void> {
    await useLoadoutStore.getState().importFromCharacter(characterId);
  }
}

// Export a singleton instance
export const loadoutStoreAdapter = new LoadoutStoreAdapter();
