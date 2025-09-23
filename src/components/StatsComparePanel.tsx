import { useEffect, useMemo, useState } from 'react';
import { loadoutService } from '../services/loadoutService';
import { formatCamelCase } from '../utils/formatters';
import HoverTooltip from './HoverTooltip';
import type { StatsSummary } from '../types';
import { urlService } from '../services/urlService';

function formatStatValue(value: number, isPercentage: boolean = false): string {
  if (isPercentage) {
    return `${value > 0 ? '+' : ''}${value}%`;
  }
  return value > 0 ? `+${value}` : value.toString();
}

export default function StatsComparePanel() {
  const [aId, setAId] = useState<string | null>(loadoutService.getSideLoadoutId('A'));
  const [bId, setBId] = useState<string | null>(loadoutService.getSideLoadoutId('B'));
  const [tick, setTick] = useState(0); // force rerender on stats updates
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  // no external version tick needed; event updates of ids trigger rerender

  useEffect(() => {
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

  const empty: StatsSummary = useMemo(() => ({
    strength: 0,
    agility: 0,
    willpower: 0,
    toughness: 0,
    wounds: 0,
    initiative: 0,
    weaponSkill: 0,
    ballisticSkill: 0,
    intelligence: 0,
    spiritResistance: 0,
    elementalResistance: 0,
    corporealResistance: 0,
    incomingDamage: 0,
    incomingDamagePercent: 0,
    outgoingDamage: 0,
    outgoingDamagePercent: 0,
    armor: 0,
    velocity: 0,
    block: 0,
    parry: 0,
    evade: 0,
    disrupt: 0,
    actionPointRegen: 0,
    moraleRegen: 0,
    cooldown: 0,
    buildTime: 0,
    criticalDamage: 0,
    range: 0,
    autoAttackSpeed: 0,
    autoAttackDamage: 0,
    meleePower: 0,
    rangedPower: 0,
    magicPower: 0,
    criticalHitRate: 0,
    meleeCritRate: 0,
    rangedCritRate: 0,
    magicCritRate: 0,
    armorPenetration: 0,
    healingPower: 0,
    healthRegen: 0,
    maxActionPoints: 0,
    fortitude: 0,
    armorPenetrationReduction: 0,
    criticalDamageTakenReduction: 0,
    criticalHitRateReduction: 0,
    blockStrikethrough: 0,
    parryStrikethrough: 0,
    evadeStrikethrough: 0,
    disruptStrikethrough: 0,
    healCritRate: 0,
    mastery1Bonus: 0,
    mastery2Bonus: 0,
    mastery3Bonus: 0,
    outgoingHealPercent: 0,
    incomingHealPercent: 0,
    goldLooted: 0,
    xpReceived: 0,
    renownReceived: 0,
    influenceReceived: 0,
    hateCaused: 0,
    hateReceived: 0,
  }), []);

  const statsA: StatsSummary = useMemo(
    () => (aId ? loadoutService.computeStatsForLoadout(aId) : empty),
    [aId, tick]
  );
  const statsB: StatsSummary = useMemo(
    () => (bId ? loadoutService.computeStatsForLoadout(bId) : empty),
    [bId, tick]
  );

  // Removed A/B equipped counts and related helpers per request

  type Row = { key: string; a: number; b: number; isPercentage?: boolean };
  const makeRows = (defs: Array<{ key: keyof StatsSummary; isPercentage?: boolean }>): Row[] =>
    defs.map(d => ({ key: d.key as string, a: statsA[d.key], b: statsB[d.key], isPercentage: d.isPercentage }))
        .filter(r => r.a !== 0 || r.b !== 0);

  const baseDefs = [
    { key: 'strength' as const },
    { key: 'ballisticSkill' as const },
    { key: 'intelligence' as const },
    { key: 'toughness' as const },
    { key: 'weaponSkill' as const },
    { key: 'initiative' as const },
    { key: 'willpower' as const },
    { key: 'wounds' as const },
  ];

  const defenseDefs = [
    { key: 'armor' as const },
    { key: 'spiritResistance' as const },
    { key: 'elementalResistance' as const },
    { key: 'corporealResistance' as const },
    { key: 'block' as const, isPercentage: true },
    { key: 'parry' as const, isPercentage: true },
    { key: 'evade' as const, isPercentage: true },
    { key: 'disrupt' as const, isPercentage: true },
    { key: 'criticalDamageTakenReduction' as const },
    { key: 'armorPenetrationReduction' as const },
    { key: 'criticalHitRateReduction' as const },
    { key: 'fortitude' as const },
  ];

  const combatDefs = [
    { key: 'armorPenetration' as const },
    { key: 'criticalDamage' as const },
    { key: 'criticalHitRate' as const, isPercentage: true },
    { key: 'meleePower' as const },
    { key: 'meleeCritRate' as const, isPercentage: true },
    { key: 'rangedPower' as const },
    { key: 'rangedCritRate' as const, isPercentage: true },
    { key: 'autoAttackSpeed' as const },
    { key: 'autoAttackDamage' as const },
    { key: 'blockStrikethrough' as const },
    { key: 'parryStrikethrough' as const },
    { key: 'evadeStrikethrough' as const },
  ];

  const magicDefs = [
    { key: 'magicPower' as const },
    { key: 'magicCritRate' as const, isPercentage: true },
    { key: 'healingPower' as const },
    { key: 'healCritRate' as const, isPercentage: true },
    { key: 'disruptStrikethrough' as const },
  ];

  const otherDefs = [
    { key: 'actionPointRegen' as const },
    { key: 'healthRegen' as const },
    { key: 'moraleRegen' as const },
    { key: 'goldLooted' as const },
    { key: 'xpReceived' as const },
    { key: 'renownReceived' as const },
    { key: 'influenceReceived' as const },
    { key: 'hateCaused' as const },
    { key: 'hateReceived' as const },
  ];

  const baseRows = makeRows(baseDefs);
  const defenseRows = makeRows(defenseDefs);
  const combatRows = makeRows(combatDefs);
  const magicRows = makeRows(magicDefs);
  const otherRows = makeRows(otherDefs);
  const isAllZero = [
    ...Object.values(statsA),
    ...Object.values(statsB)
  ].every(v => v === 0);

  const renderSection = (title: string, rows: Row[], showIfEmpty = false) => {
    if (!showIfEmpty && rows.length === 0) return null;
    return (
      <div>
        <h3 className="stats-section-title">{title}</h3>
        <div className="space-y-0.5">
          {rows.length > 0 ? (
            rows.map(r => (
              <div key={r.key} className="stats-row rounded px-1 -mx-1 hover:bg-gray-800/60 hover:ring-1 hover:ring-gray-700 transition-colors">
                <span className="text-xs">{formatCamelCase(r.key)}:</span>
                <span className="stats-label font-medium text-xs">
                  <div className="grid grid-cols-[5rem_5rem] gap-3 justify-end">
                    {/* A side (green) value with contribution tooltip */}
                    <HoverTooltip
                      placement="right"
                      className="cursor-help w-full text-right"
                      content={
                        <div className="max-w-[26rem] whitespace-nowrap overflow-x-auto">
                          <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatCamelCase(r.key)} — A Contribution</div>
                          <ul className="space-y-0.5">
                            {(() => {
                              const contributions = aId ? loadoutService.getStatContributionsForLoadout(aId, r.key) : [];
                              const isPercentRow = !!r.isPercentage || contributions.some(c => c.percentage);
                              if (contributions.length === 0) {
                                return <li className="text-[11px] text-gray-400">No contributors</li>;
                              }
                              return contributions.map((c, idx) => (
                                <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                                  <span>
                                    <span style={{ color: c.color || undefined }}>{c.name}</span>
                                    {c.count > 1 && (
                                      <span className="ml-1 text-gray-400">(x{c.count})</span>
                                    )}
                                  </span>
                                  <span className="text-gray-200">{formatStatValue(c.totalValue, isPercentRow || c.percentage)}</span>
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>
                      }
                    >
                      <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${r.a > r.b ? 'font-bold text-green-300' : 'text-green-400'}`}>{formatStatValue(r.a, !!r.isPercentage)}</span>
                    </HoverTooltip>

                    {/* B side (red) value with contribution tooltip */}
                    <HoverTooltip
                      placement="right"
                      className="cursor-help w-full text-right"
                      content={
                        <div className="max-w-[26rem] whitespace-nowrap overflow-x-auto">
                          <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatCamelCase(r.key)} — B Contribution</div>
                          <ul className="space-y-0.5">
                            {(() => {
                              const contributions = bId ? loadoutService.getStatContributionsForLoadout(bId, r.key) : [];
                              const isPercentRow = !!r.isPercentage || contributions.some(c => c.percentage);
                              if (contributions.length === 0) {
                                return <li className="text-[11px] text-gray-400">No contributors</li>;
                              }
                              return contributions.map((c, idx) => (
                                <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                                  <span>
                                    <span style={{ color: c.color || undefined }}>{c.name}</span>
                                    {c.count > 1 && (
                                      <span className="ml-1 text-gray-400">(x{c.count})</span>
                                    )}
                                  </span>
                                  <span className="text-gray-200">{formatStatValue(c.totalValue, isPercentRow || c.percentage)}</span>
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>
                      }
                    >
                      <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${r.b > r.a ? 'font-bold text-red-300' : 'text-red-400'}`}>{formatStatValue(r.b, !!r.isPercentage)}</span>
                    </HoverTooltip>
                  </div>
                </span>
              </div>
            ))
          ) : (
            title === 'Base Stats' ? null : (
              <div className="text-xs text-muted italic">No {title.toLowerCase()} bonuses</div>
            )
          )}
        </div>
      </div>
    );
  };

  if (isAllZero) {
    return (
      <div className="panel-container">
        <h2 className="panel-heading">Compare Stats</h2>
        {(!aId || !bId) && (
          <div className="text-xs text-muted mb-2">Assign loadouts to both A and B to compare.</div>
        )}
        <div className="stats-empty-message">Equip items to see stat bonuses</div>
      </div>
    );
  }

  return (
    <div className="panel-container">
      <div className="flex items-center justify-between mb-2">
        <h2 className="panel-heading mb-0">Compare Stats</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            const a = aId ? loadoutService.getLoadoutForSide('A') : null;
            const b = bId ? loadoutService.getLoadoutForSide('B') : null;
            const active = loadoutService.getActiveSide();
            const url = urlService.buildCompareShareUrl(a, b, active);
            setShareUrl(url);
            setShareOpen(true);
          }}
        >
          Share
        </button>
      </div>
      {(!aId || !bId) && (
        <div className="text-xs text-muted mb-2">Assign loadouts to both A and B to compare.</div>
      )}

      {/* Base Stats - Always show */}
      <div className="stats-section">
        {renderSection('Base Stats', baseRows, true)}
      </div>

      {/* Defense Stats */}
      <div className="stats-section">
        {renderSection('Defense', defenseRows)}
      </div>

      {/* Combat Stats */}
      <div className="stats-section">
        {renderSection('Combat', combatRows)}
      </div>

      {/* Magic Stats */}
      <div className="stats-section">
        {renderSection('Magic', magicRows)}
      </div>

      {/* Other Stats */}
      <div className="stats-section">
        {renderSection('Other', otherRows)}
      </div>

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
                    } catch {}
                  }}
                >Copy</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShareOpen(false)}>Close</button>
              </div>
            </div>
            <div>
              <input
                readOnly
                value={shareUrl}
                className="form-input form-input-text w-full rounded-md p-2"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
