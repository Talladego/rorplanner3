import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { EquipSlot, Career, ItemType } from '../types';
import { makeItem } from './factories';

function resetStore() {
  useLoadoutStore.setState((state: any) => ({
    ...state,
    loadouts: [],
    currentLoadoutId: null,
    sideLoadoutIds: { A: null, B: null },
    sideCareerLoadoutIds: { A: {}, B: {} },
    statsSummary: initialStats,
  }));
}

describe('Weapon slot rules', () => {
  beforeEach(() => resetStore());

  it('allows equipping EITHER_HAND weapon in main hand', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const either = makeItem({ id: 'either1', slot: EquipSlot.EITHER_HAND, type: ItemType.SWORD });
    await loadoutService.updateItemForLoadout(loadoutId, EquipSlot.MAIN_HAND, either);
    const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId)!;
    expect(lo.items[EquipSlot.MAIN_HAND]?.item?.id).toBe('either1');
  });

  it('blocks off-hand equip when main hand inferred two-handed', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
  // Use high DPS + MAIN_HAND to trigger two-handed inference (see isTwoHandedWeapon heuristics)
  const twoHand = makeItem({ id: '2h', slot: EquipSlot.MAIN_HAND, type: ItemType.AXE, dps: 700, levelRequirement: 40, talismanSlots: 2 });
    await loadoutService.updateItemForLoadout(loadoutId, EquipSlot.MAIN_HAND, twoHand);
    const offHand = makeItem({ id: 'off', slot: EquipSlot.OFF_HAND, type: ItemType.SWORD });
    await expect(loadoutService.updateItemForLoadout(loadoutId, EquipSlot.OFF_HAND, offHand)).rejects.toThrow(/two-handed weapon/i);
  });

  it('permits off-hand when main hand is one-handed', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const main = makeItem({ id: 'main1', slot: EquipSlot.MAIN_HAND, type: ItemType.SWORD });
    await loadoutService.updateItemForLoadout(loadoutId, EquipSlot.MAIN_HAND, main);
    const off = makeItem({ id: 'off1', slot: EquipSlot.OFF_HAND, type: ItemType.SWORD });
    await loadoutService.updateItemForLoadout(loadoutId, EquipSlot.OFF_HAND, off);
    const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId)!;
    expect(lo.items[EquipSlot.OFF_HAND]?.item?.id).toBe('off1');
  });
});
