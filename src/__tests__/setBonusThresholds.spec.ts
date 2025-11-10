import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { EquipSlot, Career, Stat } from '../types';
import { makeSetItem } from './factories';

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

describe('Set bonus multi-threshold aggregation', () => {
  beforeEach(() => resetStore());

  it('applies both 2-piece and 4-piece bonuses exactly once', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);

    // Define a set with thresholds at 2 and 4 pieces
    const bonuses = [
      { itemsRequired: 2, stat: Stat.STRENGTH, value: 6 },
      { itemsRequired: 4, stat: Stat.STRENGTH, value: 14 },
    ];

    const s1 = makeSetItem('s1', EquipSlot.HELM, 'SET_MULTI', 'Multi Set', bonuses);
    const s2 = makeSetItem('s2', EquipSlot.SHOULDER, 'SET_MULTI', 'Multi Set', bonuses);
    const s3 = makeSetItem('s3', EquipSlot.GLOVES, 'SET_MULTI', 'Multi Set', bonuses);
    const s4 = makeSetItem('s4', EquipSlot.BOOTS, 'SET_MULTI', 'Multi Set', bonuses);

    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.HELM, s1);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.SHOULDER, s2);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.GLOVES, s3);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.BOOTS, s4);

    const stats = loadoutService.computeStatsForLoadout(loadoutId, { includeRenown: false });
    // Strength should be 6 (2-piece) + 14 (4-piece) = 20 total
    expect(stats.strength).toBe(20);
  });
});
