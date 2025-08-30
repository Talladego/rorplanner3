import { useEffect, useState } from 'react';
import { loadoutService } from '../services/loadoutService';
import { StatsUpdatedEvent } from '../types/events';
import { StatsSummary } from '../types';

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

  // Method to trigger stats recalculation
  const recalculateStats = () => {
    const newStats = loadoutService.getStatsSummary();
    setStats(newStats);
  };

  return {
    stats,
    recalculateStats,
  };
}
