import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { EquipSlot, Career, Race } from '../types';
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

describe('Career & race restriction enforcement', () => {
  beforeEach(() => resetStore());

  it('blocks equipping item with mismatched career', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    // Item restricted to a different career (assume IRON_BREAKER exists in enum mapping)
    const item = makeItem({ id: 'c1', slot: EquipSlot.HELM, careerRestriction: [Career.IRON_BREAKER] });
    await expect(loadoutService.updateItemForLoadout(loadoutId, EquipSlot.HELM, item)).rejects.toThrow(/Not usable by this career/);
  });

  it('allows equipping item when career is included', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const item = makeItem({ id: 'c2', slot: EquipSlot.HELM, careerRestriction: [Career.SLAYER, Career.IRON_BREAKER] });
    await loadoutService.updateItemForLoadout(loadoutId, EquipSlot.HELM, item);
    const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId)!;
    expect(lo.items[EquipSlot.HELM]?.item?.id).toBe('c2');
  });

  it('blocks equipping item with incompatible race restriction', async () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    // Provide a race restriction list that cannot intersect allowed races for SLAYER
    const item = makeItem({ id: 'r1', slot: EquipSlot.HELM, raceRestriction: [Race.CHAOS], careerRestriction: [Career.SLAYER] });
    await expect(loadoutService.updateItemForLoadout(loadoutId, EquipSlot.HELM, item)).rejects.toThrow(/Not usable by this race/);
  });
});
