import { useEffect, useState } from 'react';
import EquipmentPanel from './EquipmentPanel';
import StatsComparePanel from './StatsComparePanel';
import RenownPanel from './RenownPanel';
import { loadoutService } from '../../services/loadout/loadoutService';
import { Loadout, EquipSlot } from '../../types';
import React, { Suspense } from 'react';
const LoadoutSummaryModal = React.lazy(() => import('../summary/LoadoutSummaryModal'));

export default function DualEquipmentLayout() {
  const [sideA, setSideA] = useState<Loadout | null>(loadoutService.getLoadoutForSide('A'));
  const [sideB, setSideB] = useState<Loadout | null>(loadoutService.getLoadoutForSide('B'));
  const [summaryOpenFor, setSummaryOpenFor] = useState<'A' | 'B' | null>(null);
  const [showRenownA, setShowRenownA] = useState(false);
  const [showRenownB, setShowRenownB] = useState(false);

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
        ev.type === 'RENOWN_RANK_CHANGED' ||
        ev.type === 'STATS_UPDATED'
      ) {
        setSideA(loadoutService.getLoadoutForSide('A'));
        setSideB(loadoutService.getLoadoutForSide('B'));
        // If a side was reset while showing Renown, return to Equipment view for that side
        if (ev.type === 'LOADOUT_RESET') {
          try {
            const aId = loadoutService.getSideLoadoutId('A');
            const bId = loadoutService.getSideLoadoutId('B');
            const resetId = ev.payload && typeof ev.payload === 'object' ? (ev.payload as { loadoutId?: string }).loadoutId : undefined;
            if (resetId && aId === resetId) setShowRenownA(false);
            if (resetId && bId === resetId) setShowRenownB(false);
          } catch {
            // noop: best-effort UI reset
          }
        }
      }
    });
    return unsub;
  }, []);

  const clearEquipmentForSide = async (side: 'A' | 'B') => {
    await loadoutService.selectSideForEdit(side);
    const targetId = loadoutService.getSideLoadoutId(side);
    if (!targetId) return;
    loadoutService.beginBulkApply();
    try {
      for (const slot of Object.values(EquipSlot)) {
        await loadoutService.updateItemForLoadout(targetId, slot, null);
      }
    } finally {
      loadoutService.endBulkApply();
    }
  };

  const resetRenownForSide = async (side: 'A' | 'B') => {
    await loadoutService.selectSideForEdit(side);
    const targetId = loadoutService.getSideLoadoutId(side);
    if (!targetId) return;
    loadoutService.resetRenownAbilitiesForLoadout(targetId);
  };

  const copySide = async (from: 'A' | 'B', to: 'A' | 'B') => {
    if (from === to) return;
    const source = loadoutService.getLoadoutForSide(from);
    const targetId = loadoutService.getSideLoadoutId(to);
    if (!source || !targetId) return;

    await loadoutService.selectSideForEdit(to);

    // Suppress URL churn and unique-equipment conflicts by clearing target first
    loadoutService.beginBulkApply();
    try {
      // 1) Clear all target slots to avoid unique-equipped and compatibility conflicts
      for (const slot of Object.values(EquipSlot)) {
        await loadoutService.updateItemForLoadout(targetId, slot, null);
      }

      // 2) Copy basic fields
      loadoutService.setCareerForLoadout(targetId, source.career);
      loadoutService.setLevelForLoadout(targetId, source.level);
      loadoutService.setRenownForLoadout(targetId, source.renownRank);
      // Copy character metadata (toolbar load field)
      loadoutService.setCharacterStatusForLoadout(targetId, !!source.isFromCharacter, source.characterName);

      // 2b) Copy renown abilities
      const abilities = source.renownAbilities || {};
      for (const [ab, lvl] of Object.entries(abilities)) {
        const levelNum = typeof lvl === 'number' ? lvl : Number(lvl) || 0;
        loadoutService.setRenownAbilityLevelForLoadout(
          targetId,
          ab as keyof NonNullable<typeof source.renownAbilities>,
          levelNum,
        );
      }

      // 3) Copy items and talismans across all slots
      for (const [slotKey, data] of Object.entries(source.items)) {
        const slot = slotKey as unknown as EquipSlot;
        await loadoutService.updateItemForLoadout(targetId, slot, data.item);
        const talismans = data.talismans || [];
        for (let idx = 0; idx < talismans.length; idx++) {
          await loadoutService.updateTalismanForLoadout(targetId, slot, idx, talismans[idx]);
        }
      }
    } finally {
      loadoutService.endBulkApply();
    }
  };

  // Renown-only copy removed; copy buttons now always perform full copy (equipment + renown)

  const isLoadoutEmpty = (lo: Loadout | null): boolean => {
    if (!lo) return true;
    // Consider empty if no items are equipped (all items null) and no talismans present
    for (const data of Object.values(lo.items)) {
      if (data.item) return false;
      if (data.talismans && data.talismans.some(t => !!t)) return false;
    }
    return true;
  };

  const sideIndicator = (label: 'A' | 'B') => (
    <div className="flex items-center gap-1.5 mb-1 min-w-0">
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${label === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{label}</span>
    </div>
  );

  const buttonsRow = (label: 'A' | 'B') => {
    const other = label === 'A' ? sideB : sideA;
    const self = label === 'A' ? sideA : sideB;
    const otherEmpty = isLoadoutEmpty(other);
    const selfEmpty = isLoadoutEmpty(self);
    const renownVisible = label === 'A' ? showRenownA : showRenownB;
  const hasCareer = !!self?.career;
  const renownEmpty = !self?.renownAbilities || Object.values(self.renownAbilities).every((lvl) => !lvl);
  const nothingToSummarize = selfEmpty && renownEmpty;
  const otherRenownEmpty = !other?.renownAbilities || Object.values(other.renownAbilities).every((lvl) => !lvl);
  const nothingToCopy = otherEmpty && otherRenownEmpty;
    return (
      <div className="flex items-center justify-between gap-1 mb-2 min-w-0 whitespace-nowrap">
          {/* Renown toggler first; disabled if no career selected */}
          <button
            onClick={() => (label === 'A' ? setShowRenownA(v => !v) : setShowRenownB(v => !v))}
            className={`btn btn-primary btn-sm whitespace-nowrap min-w-[84px] px-2 text-center ${!hasCareer ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasCareer}
            title={hasCareer ? undefined : 'Select a career to edit renown'}
          >
            {label === 'A' ? (showRenownA ? 'Equipment' : 'Renown') : (showRenownB ? 'Equipment' : 'Renown')}
          </button>
          {/* Summary next; disabled only if neither equipment nor renown present */}
          <button
            onClick={() => setSummaryOpenFor(label)}
            className={`btn btn-primary btn-sm whitespace-nowrap min-w-[84px] ${nothingToSummarize ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={nothingToSummarize}
            title={nothingToSummarize ? 'Nothing to summarize' : undefined}
          >
            Summary
          </button>
          {label === 'A' ? (
            <button
              onClick={() => copySide('B','A')}
              className={`btn btn-primary btn-sm whitespace-nowrap min-w-[84px] ${nothingToCopy ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={nothingToCopy}
            >
              Copy from B
            </button>
          ) : (
            <button
              onClick={() => copySide('A','B')}
              className={`btn btn-primary btn-sm whitespace-nowrap min-w-[84px] ${nothingToCopy ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={nothingToCopy}
            >
              Copy from A
            </button>
          )}
          {/* Stabilized Clear/Reset slot: single button per context with fixed min width */}
          <span className="inline-flex align-middle min-w-[56px]">
            {renownVisible ? (
              <button
                onClick={() => resetRenownForSide(label)}
                className={`btn btn-primary btn-sm whitespace-nowrap text-center min-w-[56px] px-2 ${renownEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={renownEmpty}
                title={'Reset Renown'}
              >
                Reset
              </button>
            ) : (
              <button
                onClick={() => clearEquipmentForSide(label)}
                className={`btn btn-primary btn-sm whitespace-nowrap text-center min-w-[56px] px-2 ${selfEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selfEmpty}
                title={'Clear Equipment'}
              >
                Clear
              </button>
            )}
          </span>
        </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left panel: Equipment A or Renown */}
      <div className="col-span-1">
        <div className="panel-container panel-border-green-600 h-full flex flex-col">
          {sideIndicator('A')}
          <div className="field-group flex-1 min-h-0">
            {buttonsRow('A')}
            {showRenownA ? (
              <RenownPanel loadoutId={sideA?.id || null} embedded />
            ) : (
              <EquipmentPanel side="A" selectedCareer={sideA?.career || ''} loadoutId={sideA?.id || null} iconOnly hideHeading compact />
            )}
          </div>
        </div>
      </div>

      {/* Middle panel: Stats compare */}
      <div className="col-span-1">
        <div className="panel-container panel-border-blue-500 h-full flex flex-col">
          <StatsComparePanel />
        </div>
      </div>

      {/* Right panel: Equipment B or Renown */}
      <div className="col-span-1">
        <div className="panel-container panel-border-red-600 h-full flex flex-col">
          {sideIndicator('B')}
          <div className="field-group flex-1 min-h-0">
            {buttonsRow('B')}
            {showRenownB ? (
              <RenownPanel loadoutId={sideB?.id || null} embedded />
            ) : (
              <EquipmentPanel side="B" selectedCareer={sideB?.career || ''} loadoutId={sideB?.id || null} iconOnly hideHeading compact />
            )}
          </div>
        </div>
      </div>
      {/* Summary Modal */}
      {summaryOpenFor && (
        <Suspense fallback={null}>
          <LoadoutSummaryModal
          open={true}
          onClose={() => setSummaryOpenFor(null)}
          loadout={summaryOpenFor === 'A' ? sideA : sideB}
          sideLabel={summaryOpenFor}
          />
        </Suspense>
      )}
    </div>
  );
}
