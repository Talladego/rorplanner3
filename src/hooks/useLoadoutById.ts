import { useEffect, useState } from 'react';
import { Loadout } from '../types';
import { loadoutService } from '../services/loadout/loadoutService';

export function useLoadoutById(loadoutId: string | null) {
  const [loadout, setLoadout] = useState<Loadout | null>(loadoutId ? (loadoutService.getAllLoadouts().find(l => l.id === loadoutId) || null) : null);

  useEffect(() => {
    if (!loadoutId) {
      setLoadout(null);
      return;
    }
    setLoadout(loadoutService.getAllLoadouts().find(l => l.id === loadoutId) || null);
    const unsub = loadoutService.subscribeToAllEvents((ev) => {
      switch (ev.type) {
        case 'ITEM_UPDATED':
        case 'TALISMAN_UPDATED':
        case 'CAREER_CHANGED':
        case 'LEVEL_CHANGED':
        case 'RENOWN_RANK_CHANGED':
        case 'LOADOUT_RESET':
        case 'LOADOUT_CREATED':
        case 'LOADOUT_SWITCHED':
          setLoadout(loadoutService.getAllLoadouts().find(l => l.id === loadoutId) || null);
          break;
      }
    });
    return unsub;
  }, [loadoutId]);

  return { loadout };
}
