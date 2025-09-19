import { useEffect, useState } from 'react';
import { loadoutService } from '../services/loadoutService';
import { StatsUpdatedEvent } from '../types/events';
import { StatsSummary } from '../types';

/**
 * Custom hook for managing loadout statistics.
 * Provides access to current stats summary and methods to recalculate stats.
 * Automatically updates when stats change.
 *
 * @returns Object containing current stats and recalculateStats function
 */
export function useLoadoutStats() {
  const [stats, setStats] = useState<StatsSummary | null>(null);

  useEffect(() => {
    // Initialize with current stats
    setStats(loadoutService.getStatsSummary());

    // Subscribe to stats updated events
    const unsubscribe = loadoutService.subscribeToEvents('STATS_UPDATED', (event: StatsUpdatedEvent) => {
      setStats(event.payload.stats);
    });

    return unsubscribe;
  }, []);

  /**
   * Manually triggers a stats recalculation.
   * Useful when external factors might affect stats calculation.
   */
  const recalculateStats = () => {
    const newStats = loadoutService.getStatsSummary();
    setStats(newStats);
  };

  return {
    stats,
    recalculateStats,
  };
}
