import { useLoadoutStore } from './loadoutStore';
import { ILoadoutStore, Loadout, StatsSummary, Career, EquipSlot, Item, LoadoutSide } from '../types';

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

  getActiveSide(): LoadoutSide {
    return useLoadoutStore.getState().getActiveSide();
  }

  getSideLoadoutId(side: LoadoutSide): string | null {
    return useLoadoutStore.getState().getSideLoadoutId(side);
  }

  getLoadoutForSide(side: LoadoutSide): Loadout | null {
    return useLoadoutStore.getState().getLoadoutForSide(side);
  }

  getSideCareerLoadoutId(side: LoadoutSide, career: Career): string | null {
    return useLoadoutStore.getState().getSideCareerLoadoutId(side, career);
  }

  setSideCareerLoadoutId(side: LoadoutSide, career: Career, loadoutId: string | null): void {
    useLoadoutStore.getState().setSideCareerLoadoutId(side, career, loadoutId);
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

  setItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null): void {
    useLoadoutStore.getState().setItemForLoadout(loadoutId, slot, item);
  }

  setTalismanForLoadout(loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null): void {
    useLoadoutStore.getState().setTalismanForLoadout(loadoutId, slot, index, talisman);
  }

  setCareerForLoadout(loadoutId: string, career: Career | null): void {
    useLoadoutStore.getState().setCareerForLoadout(loadoutId, career);
  }

  setLevelForLoadout(loadoutId: string, level: number): void {
    useLoadoutStore.getState().setLevelForLoadout(loadoutId, level);
  }

  setRenownForLoadout(loadoutId: string, renownRank: number): void {
    useLoadoutStore.getState().setRenownForLoadout(loadoutId, renownRank);
  }

  setLoadoutNameForLoadout(loadoutId: string, name: string): void {
    useLoadoutStore.getState().setLoadoutNameForLoadout(loadoutId, name);
  }

  resetLoadoutById(loadoutId: string): void {
    useLoadoutStore.getState().resetLoadoutById(loadoutId);
  }

  resetCurrentLoadout(): void {
    useLoadoutStore.getState().resetCurrentLoadout();
  }

  calculateStats(): void {
    useLoadoutStore.getState().calculateStats();
  }

  setActiveSide(side: LoadoutSide): void {
    useLoadoutStore.getState().setActiveSide(side);
  }

  assignSideLoadout(side: LoadoutSide, loadoutId: string | null): void {
    useLoadoutStore.getState().assignSideLoadout(side, loadoutId);
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

  async importFromCharacter(characterId: string, _side?: LoadoutSide): Promise<void> {
    // _side is intentionally unused here; API kept for compatibility
    void _side;
    await useLoadoutStore.getState().importFromCharacter(characterId);
  }
}

// Export a singleton instance
export const loadoutStoreAdapter = new LoadoutStoreAdapter();
