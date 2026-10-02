import { Loadout } from '../types';
import { useLoadoutStore } from './useLoadoutStore';

export function useLoadoutById(loadoutId: string | null) {
  const loadout = useLoadoutStore((s): Loadout | null => {
    if (!loadoutId) return null;
    return s.loadouts.find((l) => l.id === loadoutId) || null;
  });

  return { loadout };
}
