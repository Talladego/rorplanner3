import { useEffect, useMemo, useRef, useState } from 'react';
import { loadoutService } from '../../services/loadout/loadoutService';
import { isPercentSummaryKey } from '../../utils/formatters';
import type { StatsSummary } from '../../types';
import { urlService } from '../../services/loadout/urlService';
import { setIncludeBaseStats as setBaseShared, setIncludeDerivedStats as setDerivedShared, setIncludeRenownStats as setRenownShared } from '../../services/ui/statsToggles';
import StatRow from './StatRow';
import { buildEmptySummary, computeTotalStatsForSide, rowDefs, buildContributionsForKeyForSide } from '../../utils/statsCompareHelpers';

// Per-UI helpers moved to formatters for reuse across components

// Derived stats application constant imported from helpers

export default function StatsComparePanel() {
  const [aId, setAId] = useState<string | null>(loadoutService.getSideLoadoutId('A'));
  const [bId, setBId] = useState<string | null>(loadoutService.getSideLoadoutId('B'));
  const [tick, setTick] = useState(0); // force rerender on stats updates
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const shareRef = useRef<HTMLTextAreaElement | null>(null);
  const [includeBaseStats, setIncludeBaseStats] = useState(false);
  const [includeDerivedStats, setIncludeDerivedStats] = useState(false);
  const [includeRenownStats, setIncludeRenownStats] = useState(false);
  // Client Lua does not apply DR when showing these derived defense chances; default off
  // Diminishing returns are always applied when computing derived stats
  // no external version tick needed; event updates of ids trigger rerender

  useEffect(() => {
    // Initialize stats toggle state from URL short keys if present
    try {
      const sp = urlService.getSearchParams();
      const mask = sp.get('s');
      if (mask != null) {
        const n = parseInt(mask, 10);
        if (Number.isFinite(n)) {
          const b = !!(n & 1);
          const r = !!(n & 2);
          const d = !!(n & 4);
          setIncludeBaseStats(b); setBaseShared(b);
          setIncludeRenownStats(r); setRenownShared(r);
          setIncludeDerivedStats(d); setDerivedShared(d);
        }
      } else {
        const b = sp.get('s.b');
        const r = sp.get('s.r');
        const d = sp.get('s.d');
        if (b === '1' || b === '0') { const v = b === '1'; setIncludeBaseStats(v); setBaseShared(v); }
        if (r === '1' || r === '0') { const v = r === '1'; setIncludeRenownStats(v); setRenownShared(v); }
        if (d === '1' || d === '0') { const v = d === '1'; setIncludeDerivedStats(v); setDerivedShared(v); }
      }
    } catch {
      // ignore invalid or missing URL params for stats toggles
    }
    const pull = () => {
      setAId(loadoutService.getSideLoadoutId('A'));
      setBId(loadoutService.getSideLoadoutId('B'));
    };
    pull();
    const unsub = loadoutService.subscribeToAllEvents((ev) => {
      if ([
        'ITEM_UPDATED',
        'TALISMAN_UPDATED',
        'LOADOUT_RESET',
        'LOADOUT_CREATED',
        'LOADOUT_SWITCHED',
        'LEVEL_CHANGED',
        'RENOWN_RANK_CHANGED',
        'CAREER_CHANGED',
        'SIDE_LOADOUT_ASSIGNED',
        'ACTIVE_SIDE_CHANGED',
        'STATS_UPDATED',
      ].includes(ev.type)) {
        pull();
        // Force rerender to recompute stats even if ids unchanged
        setTick((t) => t + 1);
      }
    });
    return unsub;
  }, []);

  const empty: StatsSummary = useMemo(() => buildEmptySummary(), []);

  const statsA: StatsSummary = useMemo(
    () => {
      void tick;
      return computeTotalStatsForSide('A', aId, empty, includeBaseStats, includeDerivedStats, includeRenownStats);
    },
    [aId, tick, empty, includeBaseStats, includeDerivedStats, includeRenownStats]
  );
  const statsB: StatsSummary = useMemo(
    () => {
      void tick;
      return computeTotalStatsForSide('B', bId, empty, includeBaseStats, includeDerivedStats, includeRenownStats);
    },
    [bId, tick, empty, includeBaseStats, includeDerivedStats, includeRenownStats]
  );

  // Removed A/B equipped counts and related helpers per request

  type Row = { key: string; a: number; b: number };
  const computeDisplayValue = (key: keyof StatsSummary, stats: StatsSummary): number => {
    if (key === 'outgoingDamage') {
      const od = Number(stats.outgoingDamage || 0); // items/sets, may be percent-flagged in contributions
      const odp = Number(stats.outgoingDamagePercent || 0); // renown Hardy Concession
      // Effective percent = ((100 + od) * (100 + odp)) / 100 - 100
      return ((100 + od) * (100 + odp)) / 100 - 100;
    } else if (key === 'incomingDamage') {
      // Incoming Damage effective display combines item-side INCOMING_DAMAGE and renown INCOMING_DAMAGE_PERCENT (HC)
      const idm = Number(stats.incomingDamage || 0);
      const idmp = Number(stats.incomingDamagePercent || 0);
      return ((100 + idm) * (100 + idmp)) / 100 - 100;
    } else if (key === 'outgoingHealPercent') {
      // Outgoing Healing effective display includes renown Hardy Concession negative percent
      // Items may also provide OUTGOING_HEAL_PERCENT directly; multiply accordingly
      const ohp = Number(stats.outgoingHealPercent || 0);
      // No separate item-side 'outgoingHeal' bucket exists; the single bucket already accumulates both sources
      // So just return the current value (already additive). If we ever separate, keep multiplicative structure.
      return ohp; // kept as-is since both item and renown land in the same percent bucket
    }
    return Number(stats[key] ?? 0);
  };
  const makeRows = (defs: Array<{ key: keyof StatsSummary }>, alwaysShow?: Set<string>): Row[] =>
    defs
      .map(d => ({ key: d.key as string, a: computeDisplayValue(d.key, statsA), b: computeDisplayValue(d.key, statsB) }))
      .filter(r => (alwaysShow?.has(r.key) ?? false) || r.a !== 0 || r.b !== 0);

  const baseRows = makeRows(rowDefs.base);
  const defenseRows = makeRows(rowDefs.defense);
  const meleeRows = makeRows(rowDefs.melee);
  const offenseRows = makeRows(rowDefs.offense);
  const rangedRows = makeRows(rowDefs.ranged);
  const magicRows = makeRows(rowDefs.magic);
  const healingRows = makeRows(rowDefs.healing);
  const otherRows = makeRows(rowDefs.other);
  // Offense groups: common, then melee, ranged, magic
  const offenseGroups: Row[][] = [offenseRows, meleeRows, rangedRows, magicRows];
  const offenseAny = offenseGroups.some(g => g.length > 0);
  // Determine if any section has rows; if none, hide the Tier 3 container entirely
  const showAnyStats = (
    baseRows.length > 0 ||
    defenseRows.length > 0 ||
    offenseAny ||
    healingRows.length > 0 ||
    otherRows.length > 0
  );
  // Determine if any side has a selected career
  const loadoutA = aId ? loadoutService.getLoadoutForSide('A') : null;
  const loadoutB = bId ? loadoutService.getLoadoutForSide('B') : null;
  const hasAnyCareer = Boolean(loadoutA?.career || loadoutB?.career);

  // Auto-focus and preselect share URL when modal opens
  useEffect(() => {
    if (shareOpen && shareRef.current) {
      const el = shareRef.current;
      el.focus();
      el.select();
    }
  }, [shareOpen]);

  const renderSection = (
    title: string,
    rows: Row[],
    showIfEmpty = false,
    variant: 'section' | 'subsection' = 'section',
    showHeader: boolean = true,
  ) => {
    if (!showIfEmpty && rows.length === 0) return null;
    return (
      <div>
        {showHeader && (
          variant === 'section' ? (
            <h3 className="stats-section-title">{title}</h3>
          ) : (
            <h4 className="stats-subsection-title">{title}</h4>
          )
        )}
        {showHeader && (
          <div className="my-1 h-px bg-gray-700 opacity-60" />
        )}
        <div className="space-y-0.5">
          {rows.length > 0 ? (
            rows.map(r => {
              const aContribRaw = aId ? loadoutService.getStatContributionsForLoadout(aId, r.key) : [];
              const bContribRaw = bId ? loadoutService.getStatContributionsForLoadout(bId, r.key) : [];
              const needsUnitNormalization = r.key === 'range' || r.key === 'radius' || r.key === 'healthRegen';
              const isPercentRow = isPercentSummaryKey(r.key, [...aContribRaw, ...bContribRaw]);
              const contribA = buildContributionsForKeyForSide('A', aId, r.key, statsA, includeBaseStats, includeDerivedStats, includeRenownStats);
              const contribB = buildContributionsForKeyForSide('B', bId, r.key, statsB, includeBaseStats, includeDerivedStats, includeRenownStats);

              // For Outgoing Damage, display an effective multiplicative percent combining item OUTGOING_DAMAGE and renown OUTGOING_DAMAGE_PERCENT
              let displayA = r.a;
              let displayB = r.b;
              if (r.key === 'outgoingDamage') {
                const eff = (s: StatsSummary) => {
                  const itemPct = Number(s.outgoingDamage || 0); // e.g., +4 from set
                  const renownPct = Number(s.outgoingDamagePercent || 0); // e.g., -15 from HC
                  const mult = (1 + itemPct / 100) * (1 + renownPct / 100);
                  return (mult - 1) * 100;
                };
                displayA = eff(statsA);
                displayB = eff(statsB);
              } else if (r.key === 'incomingDamage') {
                const eff = (s: StatsSummary) => {
                  const itemPct = Number(s.incomingDamage || 0);
                  const renownPct = Number(s.incomingDamagePercent || 0);
                  const mult = (1 + itemPct / 100) * (1 + renownPct / 100);
                  return (mult - 1) * 100;
                };
                displayA = eff(statsA);
                displayB = eff(statsB);
              } else if (r.key === 'outgoingHealPercent') {
                const eff = (s: StatsSummary, contrib: { name: string; totalValue: number }[]) => {
                  const total = Number(s.outgoingHealPercent || 0);
                  const renown = (contrib || [])
                    .filter(c => c.name.startsWith('From Renown'))
                    .reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);
                  const itemPct = total - renown;
                  const renownPct = renown;
                  const mult = (1 + itemPct / 100) * (1 + renownPct / 100);
                  return (mult - 1) * 100;
                };
                displayA = eff(statsA, contribA as { name: string; totalValue: number }[]);
                displayB = eff(statsB, contribB as { name: string; totalValue: number }[]);
              }

              return (
                <StatRow
                  key={r.key}
                  statKey={r.key}
                  displayA={displayA}
                  displayB={displayB}
                  isPercentRow={isPercentRow}
                  needsUnitNormalization={needsUnitNormalization}
                  contributionsA={contribA}
                  contributionsB={contribB}
                />
              );
            })
          ) : (
            title === 'Primary Stats' ? null : (
              <div className="text-xs text-muted italic">No {title.toLowerCase()} bonuses</div>
            )
          )}
        </div>
      </div>
    );
  };

  if (!hasAnyCareer) {
    return (
      <div className="field-group flex-1 min-h-0">
        <div className="stats-empty-message">Select a career or load a character to see stats</div>
      </div>
    );
  }

  return (
    <div className="field-group flex-1 min-h-0">
      <div className="flex items-center justify-between mb-2">
        {/* Global toggles row (left) */}
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input
              type="checkbox"
              className="form-checkbox h-3 w-3"
              checked={includeBaseStats}
              onChange={(e) => { const v = e.currentTarget.checked; setIncludeBaseStats(v); setBaseShared(v); }}
            />
            Career Stats
          </label>
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input
              type="checkbox"
              className="form-checkbox h-3 w-3"
              checked={includeRenownStats}
              onChange={(e) => { const v = e.currentTarget.checked; setIncludeRenownStats(v); setRenownShared(v); }}
            />
            Renown Stats
          </label>
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input
              type="checkbox"
              className="form-checkbox h-3 w-3"
              checked={includeDerivedStats}
              onChange={(e) => { const v = e.currentTarget.checked; setIncludeDerivedStats(v); setDerivedShared(v); }}
            />
            Derived Stats
          </label>
        </div>
        {/* Share button (right) */}
        <div className="flex items-center gap-3">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const a = aId ? loadoutService.getLoadoutForSide('A') : null;
              const b = bId ? loadoutService.getLoadoutForSide('B') : null;
              const url = urlService.buildCompareShareUrl(a, b, {
                includeBaseStats,
                includeRenownStats,
                includeDerivedStats,
              });
              setShareUrl(url);
              setShareOpen(true);
            }}
          >
            Share
          </button>
        </div>
      </div>
      {(!aId || !bId) && (
        <div className="text-xs text-muted mb-2">Assign loadouts to both A and B to compare.</div>
      )}

      {/* Stats content in Tier 3 container (hidden entirely if no stats) */}
      {showAnyStats && (
        <div className="equipment-slot">
          {/* Primary Stats */}
          {baseRows.length > 0 && (
            <div className="stats-section">
              {renderSection('Primary Stats', baseRows)}
            </div>
          )}

          {/* Defense Stats */}
          {defenseRows.length > 0 && (
            <div className="stats-section">
              {renderSection('Defense', defenseRows)}
            </div>
          )}

          {/* Offense with thin separators between groups (common, melee, ranged, magic) */}
          {offenseAny && (
            <div className="stats-section">
              <h3 className="stats-section-title">Offense</h3>
              <div className="my-1 h-px bg-gray-700 opacity-60" />
              <div className="mt-1">
                {offenseGroups.filter(g => g.length > 0).map((group, idx, arr) => (
                  <div key={idx}>
                    {renderSection('', group, false, 'subsection', false)}
                    {idx < arr.length - 1 && (
                      <div className="my-1 h-px bg-gray-700 opacity-60" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healing Stats */}
          {healingRows.length > 0 && (
            <div className="stats-section">
              {renderSection('Healing', healingRows)}
            </div>
          )}

          {/* Other Stats */}
          {otherRows.length > 0 && (
            <div className="stats-section">
              {renderSection('Other', otherRows)}
            </div>
          )}
        </div>
      )}

      {/* Empty message when careers exist but there are no visible stats */}
      {!showAnyStats && (
        <div className="stats-empty-message">Select a career or load a character to see stats</div>
      )}

      {shareOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareOpen(false);
          }}
        >
          <div className="modal-container max-w-2xl">
            <div className="modal-header">
              <h3 className="modal-title">Share Link</h3>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                    } catch {
                      // ignore clipboard write failures (e.g., restricted context)
                    }
                  }}
                >Copy</button>
                <button 
                  onClick={() => setShareOpen(false)} 
                  className="modal-close-btn hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div>
              <textarea
                ref={shareRef}
                readOnly
                value={shareUrl}
                className="form-input form-input-text w-full rounded-md p-2 font-mono text-xs"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                rows={3}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
