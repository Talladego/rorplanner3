import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { EquipSlot, Career, Item, LoadoutSide } from '../../types';

/**
 * Clone an existing loadout, including items and talismans, and emit a LOADOUT_CREATED event.
 * Returns the new loadout id.
 */
export function cloneLoadout(sourceId: string, name?: string): string {
  const src = loadoutStoreAdapter.getLoadouts().find(l => l.id === sourceId);
  if (!src) throw new Error('Source loadout not found');
  const newId = loadoutStoreAdapter.createLoadout(
    name || `${src.name} (Copy)`,
    src.level,
    src.renownRank,
    src.isFromCharacter,
    src.characterName,
  );
  if (src.career) loadoutStoreAdapter.setCareerForLoadout(newId, src.career);
  // Copy renown abilities
  if (src.renownAbilities) {
    (Object.keys(src.renownAbilities) as Array<keyof NonNullable<typeof src.renownAbilities>>).forEach((ab) => {
      const lvl = src.renownAbilities?.[ab] ?? 0;
      loadoutStoreAdapter.setRenownAbilityLevelForLoadout(newId, ab as keyof NonNullable<typeof src.renownAbilities>, lvl);
    });
  }
  Object.entries(src.items).forEach(([slot, data]) => {
    loadoutStoreAdapter.setItemForLoadout(newId, slot as EquipSlot, data.item);
    if (data.talismans) {
      data.talismans.forEach((t, idx) => {
        loadoutStoreAdapter.setTalismanForLoadout(newId, slot as EquipSlot, idx, t);
      });
    }
  });
  loadoutEventEmitter.emit({
    type: 'LOADOUT_CREATED',
    payload: { loadoutId: newId, name: name || `${src.name} (Copy)` },
    timestamp: Date.now(),
  });
  return newId;
}

/**
 * Setters that operate on the current loadout. These include event emissions
 * to preserve existing behavior when called from the service façade.
 */
export function setCareer(career: Career | null): void {
  loadoutStoreAdapter.setCareer(career);
  loadoutEventEmitter.emit({ type: 'CAREER_CHANGED', payload: { career }, timestamp: Date.now() });
}

export function setLevel(level: number): void {
  loadoutStoreAdapter.setLevel(level);
  loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level }, timestamp: Date.now() });
}

export function setRenownRank(renownRank: number): void {
  loadoutStoreAdapter.setRenownRank(renownRank);
  loadoutEventEmitter.emit({ type: 'RENOWN_RANK_CHANGED', payload: { renownRank }, timestamp: Date.now() });
}

/**
 * Per-loadout setters used by compare/dual flows.
 * Do not emit events here to avoid double-emission; the façade handles it.
 */
export function setCareerForLoadout(loadoutId: string, career: Career | null): void {
  loadoutStoreAdapter.setCareerForLoadout(loadoutId, career);
}

export function setLevelForLoadout(loadoutId: string, level: number): void {
  loadoutStoreAdapter.setLevelForLoadout(loadoutId, level);
}

export function setRenownForLoadout(loadoutId: string, renownRank: number): void {
  loadoutStoreAdapter.setRenownForLoadout(loadoutId, renownRank);
}

export function setLoadoutNameForLoadout(loadoutId: string, name: string): void {
  loadoutStoreAdapter.setLoadoutNameForLoadout(loadoutId, name);
}

export function setCharacterStatusForLoadout(loadoutId: string, isFromCharacter: boolean, characterName?: string): void {
  loadoutStoreAdapter.updateLoadoutCharacterStatus(loadoutId, isFromCharacter, characterName);
}

/**
 * Item/Talisman mutations.
 * - Current-loadout variants emit events (façade won't re-emit).
 * - Per-loadout variants avoid emitting; façade handles events and other orchestration.
 */
export function updateItem(slot: EquipSlot, item: Item | null): void {
  loadoutStoreAdapter.setItem(slot, item);
  loadoutEventEmitter.emit({ type: 'ITEM_UPDATED', payload: { slot, item }, timestamp: Date.now() });
}

export function updateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null): void {
  loadoutStoreAdapter.setItemForLoadout(loadoutId, slot, item);
}

export function updateTalisman(slot: EquipSlot, index: number, talisman: Item | null): void {
  loadoutStoreAdapter.setTalisman(slot, index, talisman);
  loadoutEventEmitter.emit({ type: 'TALISMAN_UPDATED', payload: { slot, index, talisman }, timestamp: Date.now() });
}

export function updateTalismanForLoadout(loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null): void {
  loadoutStoreAdapter.setTalismanForLoadout(loadoutId, slot, index, talisman);
}

/**
 * Side assignment (pure). The façade handles URL updates and events.
 */
export function assignSideLoadout(side: LoadoutSide, loadoutId: string | null): void {
  loadoutStoreAdapter.assignSideLoadout(side, loadoutId);
}

export async function switchLoadout(loadoutId: string): Promise<void> {
  await loadoutStoreAdapter.switchLoadout(loadoutId);
}
