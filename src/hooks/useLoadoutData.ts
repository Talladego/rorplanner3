import { useEffect, useState } from 'react';
import { Loadout } from '../types';
import { loadoutService } from '../services/loadout/loadoutService';

/**
 * Custom hook for managing loadout data state.
 * Provides access to all loadouts, current loadout ID, and current loadout data.
 * Automatically updates when loadout events occur.
 *
 * @returns Object containing loadouts array, current loadout ID, and current loadout
 */
export function useLoadoutData() {
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [currentLoadoutId, setCurrentLoadoutId] = useState<string | null>(null);
  const [currentLoadout, setCurrentLoadout] = useState<Loadout | null>(null);

  useEffect(() => {
    // Initialize with current data
    setLoadouts(loadoutService.getAllLoadouts());
    setCurrentLoadoutId(loadoutService.getCurrentLoadoutId());
    setCurrentLoadout(loadoutService.getCurrentLoadout());

    // Subscribe to all loadout events
    const unsubscribe = loadoutService.subscribeToAllEvents((event) => {
      // Update data based on events
      switch (event.type) {
        case 'ITEM_UPDATED':
        case 'TALISMAN_UPDATED':
        case 'CAREER_CHANGED':
        case 'LEVEL_CHANGED':
        case 'RENOWN_RANK_CHANGED':
        case 'LOADOUT_RESET':
          // These events affect the current loadout
          setCurrentLoadout(loadoutService.getCurrentLoadout());
          break;
        case 'LOADOUT_CREATED':
        case 'LOADOUT_SWITCHED':
          // These events affect the current loadout and loadout list
          setLoadouts(loadoutService.getAllLoadouts());
          setCurrentLoadoutId(loadoutService.getCurrentLoadoutId());
          setCurrentLoadout(loadoutService.getCurrentLoadout());
          break;
      }
    });

    return unsubscribe;
  }, []);

  return {
    loadouts,
    currentLoadoutId,
    currentLoadout,
  };
}
