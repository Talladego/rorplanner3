import { useEffect, useState } from 'react';
import EquipmentPanel from './EquipmentPanel';
import StatsComparePanel from './StatsComparePanel';
import { loadoutService } from '../services/loadoutService';
import { Loadout } from '../types';

export default function DualEquipmentLayout() {
  const [sideA, setSideA] = useState<Loadout | null>(loadoutService.getLoadoutForSide('A'));
  const [sideB, setSideB] = useState<Loadout | null>(loadoutService.getLoadoutForSide('B'));

  useEffect(() => {
    // Ensure both sides have loadouts assigned when mounting compare layout
    try {
      loadoutService.ensureSideLoadout('A');
      loadoutService.ensureSideLoadout('B');
      setSideA(loadoutService.getLoadoutForSide('A'));
      setSideB(loadoutService.getLoadoutForSide('B'));
    } catch {
      // non-fatal; event subscription below will reconcile state
    }

    // Stay in sync with service events
    const unsub = loadoutService.subscribeToAllEvents((ev) => {
      if (
        ev.type === 'SIDE_LOADOUT_ASSIGNED' ||
        ev.type === 'LOADOUT_CREATED' ||
        ev.type === 'LOADOUT_SWITCHED' ||
        ev.type === 'ITEM_UPDATED' ||
        ev.type === 'TALISMAN_UPDATED' ||
        ev.type === 'LOADOUT_RESET' ||
        ev.type === 'CAREER_CHANGED' ||
        ev.type === 'LEVEL_CHANGED' ||
        ev.type === 'RENOWN_RANK_CHANGED'
      ) {
        setSideA(loadoutService.getLoadoutForSide('A'));
        setSideB(loadoutService.getLoadoutForSide('B'));
      }
    });
    return unsub;
  }, []);

  const sideHeader = (label: string) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${label === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{label}</span>
        {/* Intentionally omit loadout name, career, and character for minimalist compare UI */}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left column: Equipment A */}
      <div className="xl:col-span-1">
  <div className="panel-container panel-border-green-600">
          {sideHeader('A')}
          <EquipmentPanel selectedCareer={sideA?.career || ''} loadoutId={sideA?.id || null} iconOnly hideHeading compact />
        </div>
      </div>

      {/* Middle column: Stats compare */}
      <div className="xl:col-span-1">
        <StatsComparePanel />
      </div>

      {/* Right column: Equipment B */}
      <div className="xl:col-span-1">
  <div className="panel-container panel-border-red-600">
          {sideHeader('B')}
          <EquipmentPanel selectedCareer={sideB?.career || ''} loadoutId={sideB?.id || null} iconOnly hideHeading compact />
        </div>
      </div>
    </div>
  );
}
