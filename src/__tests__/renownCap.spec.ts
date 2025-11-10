import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { Career } from '../types';
import { initialStats } from '../store/loadout/state';

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

describe('Renown spend cap', () => {
  beforeEach(() => resetStore());

  it('caps to CR when CR < 40', () => {
    const id = loadoutService.createLoadout('Test', 35, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    expect(loadoutService.getRenownSpendCap(id)).toBe(35);
  });

  it('allows full RR when CR >= 40', () => {
    const id = loadoutService.createLoadout('Test', 40, 72);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    expect(loadoutService.getRenownSpendCap(id)).toBe(72);
  });
});
