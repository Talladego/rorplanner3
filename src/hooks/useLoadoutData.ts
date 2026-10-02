import { Loadout } from '../types';
import { useLoadoutStore } from './useLoadoutStore';

/**
 * Custom hook for managing loadout data state.
 * Provides access to all loadouts, current loadout ID, and current loadout data.
 * Uses fine-grained Zustand selectors (no global event-bus sync).
 */
export function useLoadoutData() {
  const loadouts = useLoadoutStore((s) => s.loadouts);
  const currentLoadoutId = useLoadoutStore((s) => s.currentLoadoutId);
  const currentLoadout = useLoadoutStore((s): Loadout | null => {
    if (!s.currentLoadoutId) return null;
    return s.loadouts.find((l) => l.id === s.currentLoadoutId) || null;
  });

  return {
    loadouts,
    currentLoadoutId,
    currentLoadout,
  };
}
