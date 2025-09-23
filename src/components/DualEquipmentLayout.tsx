import { useEffect, useState } from 'react';
import EquipmentPanel from './EquipmentPanel';
import StatsComparePanel from './StatsComparePanel';
import { loadoutService } from '../services/loadoutService';
import { Loadout, EquipSlot } from '../types';
import LoadoutSummaryModal from './summary/LoadoutSummaryModal';

export default function DualEquipmentLayout() {
  const [sideA, setSideA] = useState<Loadout | null>(loadoutService.getLoadoutForSide('A'));
  const [sideB, setSideB] = useState<Loadout | null>(loadoutService.getLoadoutForSide('B'));
  const [summaryOpenFor, setSummaryOpenFor] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    // Ensure both sides exist only if no URL params are present
    try {
      const hash = window.location.hash || '';
      const hasParams = hash.includes('?');
      if (!hasParams) {
        loadoutService.ensureSideLoadout('A');
        loadoutService.ensureSideLoadout('B');
        setSideA(loadoutService.getLoadoutForSide('A'));
        setSideB(loadoutService.getLoadoutForSide('B'));
      }
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

  const clearSide = async (side: 'A' | 'B') => {
    // Select side to edit, then reset its current loadout state only
    await loadoutService.selectSideForEdit(side);
    await loadoutService.resetCurrentLoadout();
  };

  const copySide = async (from: 'A' | 'B', to: 'A' | 'B') => {
    if (from === to) return;
    const source = loadoutService.getLoadoutForSide(from);
    const targetId = loadoutService.getSideLoadoutId(to);
    if (!source || !targetId) return;

    await loadoutService.selectSideForEdit(to);

  // Copy basic fields
    loadoutService.setCareerForLoadout(targetId, source.career);
    loadoutService.setLevelForLoadout(targetId, source.level);
    loadoutService.setRenownForLoadout(targetId, source.renownRank);
  // Copy character metadata (toolbar load field)
  loadoutService.setCharacterStatusForLoadout(targetId, !!source.isFromCharacter, source.characterName);

    // Copy items and talismans across all slots
    for (const [slotKey, data] of Object.entries(source.items)) {
      const slot = slotKey as unknown as EquipSlot;
      await loadoutService.updateItemForLoadout(targetId, slot, data.item);
      const talismans = data.talismans || [];
      for (let idx = 0; idx < talismans.length; idx++) {
        await loadoutService.updateTalismanForLoadout(targetId, slot, idx, talismans[idx]);
      }
    }
  };

  const sideHeader = (label: 'A' | 'B') => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${label === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {label === 'A' ? (
          <button onClick={() => copySide('B','A')} className="btn btn-primary btn-sm whitespace-nowrap">Copy from B</button>
        ) : (
          <button onClick={() => copySide('A','B')} className="btn btn-primary btn-sm whitespace-nowrap">Copy from A</button>
        )}
        <button onClick={() => setSummaryOpenFor(label)} className="btn btn-primary btn-sm whitespace-nowrap">Summary</button>
        <button onClick={() => clearSide(label)} className="btn btn-primary btn-sm whitespace-nowrap">Clear</button>
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
      {/* Summary Modal */}
      {summaryOpenFor && (
        <LoadoutSummaryModal
          open={true}
          onClose={() => setSummaryOpenFor(null)}
          loadout={summaryOpenFor === 'A' ? sideA : sideB}
          sideLabel={summaryOpenFor}
        />
      )}
    </div>
  );
}
