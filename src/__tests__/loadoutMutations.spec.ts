import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as loadoutMutations from '../services/loadout/loadoutMutations';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { Career } from '../types';

const ctx = () => ({
  isBulk: false,
  maybeMarkModified: vi.fn(),
  recalcStats: vi.fn(),
});

describe('loadoutMutations', () => {
  beforeEach(() => {
    useLoadoutStore.setState((state: any) => ({
      ...state,
      loadouts: [],
      currentLoadoutId: null,
      sideLoadoutIds: { A: null, B: null },
      sideCareerLoadoutIds: { A: {}, B: {} },
      statsSummary: initialStats,
    }));
  });

  it('emits events and marks modified on setLevelForLoadout', () => {
    const id = useLoadoutStore.getState().createLoadout('Test', 40, 80);
    const c = ctx();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    loadoutMutations.setLevelForLoadout(c, id, 35);
    expect(c.maybeMarkModified).toHaveBeenCalledWith(id);
    expect(c.recalcStats).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('updates renown via setRenownForLoadout and recalculates stats', () => {
    const id = useLoadoutStore.getState().createLoadout('Test', 40, 80);
    const c = ctx();
    loadoutMutations.setRenownForLoadout(c, id, 50);
    expect(c.maybeMarkModified).toHaveBeenCalledWith(id);
    expect(c.recalcStats).toHaveBeenCalled();
  });

  it('sets career and emits event', () => {
    const id = useLoadoutStore.getState().createLoadout('Test', 40, 80);
    const c = ctx();
    loadoutMutations.setCareerForLoadout(c, id, Career.SLAYER);
    expect(c.maybeMarkModified).toHaveBeenCalledWith(id);
    expect(c.recalcStats).toHaveBeenCalled();
  });
});
