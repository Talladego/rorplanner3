import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { Career } from '../types';
import { formatSummaryStatKey } from '../utils/formatters';
import {
  buildEmptySummary,
  buildContributionsForKeyForSide,
  computeCompareDisplayValue,
  computeTotalStatsForSide,
} from '../utils/statsCompareHelpers';
import { computeChanceToBeCriticallyHit } from '../utils/derivedStats';

function resetStore() {
  useLoadoutStore.setState((state: any) => ({
    ...state,
    loadouts: [],
    currentLoadoutId: null,
    sideLoadoutIds: { A: null, B: null },
    sideCareerLoadoutIds: { A: {}, B: {} },
    statsSummary: initialStats,
    activeSide: 'A',
  }));
}

describe('Chance to be critically hit (patch 17/09/2026)', () => {
  beforeEach(() => resetStore());

  it('labels remaining chance when derived stats are on', () => {
    expect(formatSummaryStatKey('criticalHitRateReduction')).toBe('Critical Hit Rate Reduction');
    expect(formatSummaryStatKey('criticalHitRateReduction', { includeDerivedStats: true }))
      .toBe('Chance to be Critically Hit');
  });

  it('derived display is 10+rank/4 minus Futile Strikes; contributions include career-rank base', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    loadoutService.setRenownAbilityLevelForLoadout(loadoutId, 'futileStrikes', 4);

    const empty = buildEmptySummary();
    const derived = computeTotalStatsForSide('A', loadoutId, empty, false, true, true);
    // No initiative without Career Stats; FS IV = 12% reduction
    expect(derived.criticalHitRateReduction).toBe(12);
    expect(computeChanceToBeCriticallyHit(40, derived.criticalHitRateReduction)).toBe(8);
    expect(computeCompareDisplayValue('criticalHitRateReduction', derived, {
      includeDerivedStats: true,
      careerRank: 40,
    })).toBe(8);
    // Derived-off still shows raw reduction, not remaining chance
    expect(computeCompareDisplayValue('criticalHitRateReduction', derived, {
      includeDerivedStats: false,
      careerRank: 40,
    })).toBe(12);

    const contrib = buildContributionsForKeyForSide(
      'A',
      loadoutId,
      'criticalHitRateReduction',
      derived,
      false,
      true,
      true,
    );
    expect(contrib.find((c) => c.name === 'From Career Rank (Derived)')?.totalValue).toBe(20);
    const fs = contrib.find((c) => c.name.startsWith('From Renown (Futile Strikes'));
    expect(fs?.totalValue).toBe(-12);
  });
});
