import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { EquipSlot, Career, Stat } from '../types';
import { makeItem, makeSetItem } from './factories';

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

describe('Stats aggregation', () => {
  beforeEach(() => resetStore());

  it('sums raw item stats', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);

  const helm = makeItem({ id: 'helm', slot: EquipSlot.HELM, stats: [ { stat: Stat.STRENGTH, value: 10, percentage: false } ] });
  const gloves = makeItem({ id: 'gloves', slot: EquipSlot.GLOVES, stats: [ { stat: Stat.STRENGTH, value: 5, percentage: false }, { stat: Stat.WOUNDS, value: 3, percentage: false } ] });

    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.HELM, helm);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.GLOVES, gloves);

    const stats = loadoutService.computeStatsForLoadout(loadoutId, { includeRenown: false });
    expect(stats.strength).toBe(15);
    expect(stats.wounds).toBe(3);
  });

  it('applies set bonuses once thresholds met', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);

    const a1 = makeSetItem('a1', EquipSlot.HELM, 'SET_X', 'Set X', [ { itemsRequired: 2, stat: Stat.STRENGTH, value: 7 } ]);
    const a2 = makeSetItem('a2', EquipSlot.SHOULDER, 'SET_X', 'Set X', [ { itemsRequired: 2, stat: Stat.STRENGTH, value: 7 } ]);

    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.HELM, a1);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.SHOULDER, a2);

    const stats = loadoutService.computeStatsForLoadout(loadoutId, { includeRenown: false });
    // raw pieces have 0 STR, bonus adds 7 total (not 14)
    expect(stats.strength).toBe(7);
  });

  it('adds renown ability contributions when includeRenown=true (default)', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    // Set renown ability levels directly on store for test
    useLoadoutStore.setState((state: any) => ({
      ...state,
      loadouts: state.loadouts.map((l: any) => l.id === loadoutId ? { ...l, renownAbilities: { might: 3 } } : l)
    }));

    const stats = loadoutService.computeStatsForLoadout(loadoutId); // includeRenown true
    // Level 3 -> cumulative table [0,4,16,38...] gives 38 strength
    expect(stats.strength).toBe(38);
  });

  it('omits renown contributions when includeRenown=false', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    useLoadoutStore.setState((state: any) => ({
      ...state,
      loadouts: state.loadouts.map((l: any) => l.id === loadoutId ? { ...l, renownAbilities: { might: 3 } } : l)
    }));

    const stats = loadoutService.computeStatsForLoadout(loadoutId, { includeRenown: false });
    expect(stats.strength).toBe(0);
  });
});
