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

  const isLoadoutEmpty = (lo: Loadout | null): boolean => {
    if (!lo) return true;
    // Consider empty if no items are equipped (all items null) and no talismans present
    for (const data of Object.values(lo.items)) {
      if (data.item) return false;
      if (data.talismans && data.talismans.some(t => !!t)) return false;
    }
    return true;
  };

  const sideHeader = (label: 'A' | 'B') => {
    const other = label === 'A' ? sideB : sideA;
    const self = label === 'A' ? sideA : sideB;
    const otherEmpty = isLoadoutEmpty(other);
    const selfEmpty = isLoadoutEmpty(self);
    const renownVisible = label === 'A' ? showRenownA : showRenownB;
    const hasCareer = !!self?.career;
    const renownEmpty = !self?.renownAbilities || Object.values(self.renownAbilities).every((lvl) => !lvl);
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${label === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Renown toggler first; disabled if no career selected */}
          <button
            onClick={() => (label === 'A' ? setShowRenownA(v => !v) : setShowRenownB(v => !v))}
            className={`btn btn-primary btn-sm whitespace-nowrap min-w-[80px] px-2 text-center ${!hasCareer ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasCareer}
            title={hasCareer ? undefined : 'Select a career to edit renown'}
          >
            {label === 'A' ? (showRenownA ? 'Equipment' : 'Renown') : (showRenownB ? 'Equipment' : 'Renown')}
          </button>
          {/* Summary next; disabled on Renown panel or empty loadout */}
          <button
            onClick={() => setSummaryOpenFor(label)}
            className={`btn btn-primary btn-sm whitespace-nowrap ${(renownVisible || selfEmpty) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={renownVisible || selfEmpty}
            title={renownVisible ? 'Summary unavailable while editing Renown' : (selfEmpty ? 'Summary unavailable for empty loadout' : undefined)}
          >
            Summary
          </button>
          {label === 'A' ? (
            <button
              onClick={() => copySide('B','A')}
              className={`btn btn-primary btn-sm whitespace-nowrap ${(renownVisible || otherEmpty) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={renownVisible || otherEmpty}
              title={renownVisible ? 'Copy unavailable while editing Renown' : undefined}
            >
              Copy from B
            </button>
          ) : (
            <button
              onClick={() => copySide('A','B')}
              className={`btn btn-primary btn-sm whitespace-nowrap ${(renownVisible || otherEmpty) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={renownVisible || otherEmpty}
              title={renownVisible ? 'Copy unavailable while editing Renown' : undefined}
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
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left column: Equipment A or Renown */}
      <div className="xl:col-span-1">
  <div className="panel-container panel-border-green-600">
          {sideHeader('A')}
          {showRenownA ? (
            <RenownPanel loadoutId={sideA?.id || null} />
          ) : (
            <EquipmentPanel side="A" selectedCareer={sideA?.career || ''} loadoutId={sideA?.id || null} iconOnly hideHeading compact />
          )}
        </div>
      </div>

      {/* Middle column: Stats compare */}
      <div className="xl:col-span-1">
        <StatsComparePanel />
      </div>

      {/* Right column: Equipment B or Renown */}
      <div className="xl:col-span-1">
  <div className="panel-container panel-border-red-600">
          {sideHeader('B')}
          {showRenownB ? (
            <RenownPanel loadoutId={sideB?.id || null} />
          ) : (
            <EquipmentPanel side="B" selectedCareer={sideB?.career || ''} loadoutId={sideB?.id || null} iconOnly hideHeading compact />
          )}
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
