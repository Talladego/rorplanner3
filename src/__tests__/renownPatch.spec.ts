import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { Career } from '../types';
import {
  DEFAULT_COST_TOTALS,
  DEFAULT_STAT_TOTALS,
  getRenownCostAtLevel,
  getRenownEffectAtLevel,
  RENOWN_ABILITIES,
} from '../services/loadout/renownConfig';

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

describe('Renown patch 17/09/2026', () => {
  beforeEach(() => resetStore());

  it('uses cumulative primary-stat totals 4/16/40/80/120 and costs 1/4/10/20/30', () => {
    expect(DEFAULT_STAT_TOTALS).toEqual([0, 4, 16, 40, 80, 120]);
    expect(DEFAULT_COST_TOTALS).toEqual([0, 1, 4, 10, 20, 30]);
    expect(getRenownEffectAtLevel('might', 3)).toBe(40);
    expect(getRenownEffectAtLevel('might', 5)).toBe(120);
    expect(getRenownCostAtLevel('might', 5)).toBe(30);
  });

  it('keeps Defender Block at 2/4/7/10 (rank IV still 10%) with combat costs', () => {
    expect(getRenownEffectAtLevel('defender', 1)).toBe(2);
    expect(getRenownEffectAtLevel('defender', 2)).toBe(4);
    expect(getRenownEffectAtLevel('defender', 3)).toBe(7);
    expect(getRenownEffectAtLevel('defender', 4)).toBe(10);
    expect(getRenownCostAtLevel('defender', 4)).toBe(30);
    const def = RENOWN_ABILITIES.find((a) => a.key === 'defender');
    expect(def?.capLevel).toBe(4);
  });

  it('caps combat abilities at rank IV with 2/4/8/12 or 2/4/8/13 / 4/8/16/24 curves', () => {
    expect(getRenownEffectAtLevel('opportunist', 4)).toBe(12);
    expect(getRenownEffectAtLevel('spiritualRefinement', 4)).toBe(12);
    expect(getRenownEffectAtLevel('futileStrikes', 4)).toBe(12);
    expect(getRenownEffectAtLevel('trivialBlows', 4)).toBe(24);
    expect(getRenownEffectAtLevel('reflexes', 4)).toBe(13);
    expect(getRenownEffectAtLevel('deftDefender', 4)).toBe(13);
    expect(getRenownEffectAtLevel('focusedPower', 4)).toBe(13);
    expect(getRenownEffectAtLevel('hardyConcession', 4)).toBe(-10);
  });

  it('does not list Regeneration in the trainer', () => {
    expect(RENOWN_ABILITIES.some((a) => a.key === 'regeneration')).toBe(false);
    expect(RENOWN_ABILITIES.some((a) => a.key === 'focusedPower')).toBe(true);
  });

  it('uses the armory icon for Focused Power (ability 11021 → icon 22257)', () => {
    const fp = RENOWN_ABILITIES.find((a) => a.key === 'focusedPower');
    expect(fp?.iconUrl).toBe('https://armory.returnofreckoning.com/icon/22257');
  });

  it('applies Might III as +40 strength', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    loadoutService.setRenownAbilityLevelForLoadout(loadoutId, 'might', 3);
    const stats = loadoutService.computeStatsForLoadout(loadoutId);
    expect(stats.strength).toBe(40);
  });

  it('applies Defender IV as +10% block', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    loadoutService.setRenownAbilityLevelForLoadout(loadoutId, 'defender', 4);
    const stats = loadoutService.computeStatsForLoadout(loadoutId);
    expect(stats.block).toBe(10);
  });

  it('applies Focused Power to parry/dodge/disrupt strikethrough', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    loadoutService.setRenownAbilityLevelForLoadout(loadoutId, 'focusedPower', 4);
    const stats = loadoutService.computeStatsForLoadout(loadoutId);
    expect(stats.parryStrikethrough).toBe(13);
    expect(stats.evadeStrikethrough).toBe(13);
    expect(stats.disruptStrikethrough).toBe(13);
    const contrib = loadoutService.getStatContributionsForLoadout(loadoutId, 'parryStrikethrough');
    expect(contrib.some((c) => c.name.startsWith('From Renown (Focused Power'))).toBe(true);
  });

  it('ignores Regeneration on old loadouts instead of crashing or adding health regen', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    useLoadoutStore.setState((state: any) => ({
      ...state,
      loadouts: state.loadouts.map((l: any) => (
        l.id === loadoutId ? { ...l, renownAbilities: { ...l.renownAbilities, regeneration: 3 } } : l
      )),
    }));
    loadoutService.setRenownAbilityLevelForLoadout(loadoutId, 'regeneration' as any, 3);
    const stats = loadoutService.computeStatsForLoadout(loadoutId);
    expect(stats.healthRegen).toBe(0);
    expect(getRenownEffectAtLevel('regeneration', 3)).toBe(0);
  });
});
