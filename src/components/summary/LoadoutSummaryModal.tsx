import { useEffect, useMemo, useRef, useState } from 'react';
import { Loadout, EquipSlot, StatsSummary } from '../../types';
import { RENOWN_ABILITIES } from '../../services/loadout/renownConfig';
import { formatCareerName, formatSlotName, formatSummaryStatKey, isPercentSummaryKey, normalizeStatDisplayValue } from '../../utils/formatters';
import { buildEmptySummary, computeTotalStatsForSide, rowDefs } from '../../utils/statsCompareHelpers';
import { getAllToggles } from '../../services/ui/statsToggles';
import { loadoutService } from '../../services/loadout/loadoutService';

interface LoadoutSummaryModalProps {
  open: boolean;
  onClose: () => void;
  loadout: Loadout | null;
  sideLabel?: 'A' | 'B';
}


type Align = 'left' | 'right' | 'center';
function renderAsciiTable(headers: string[], rows: Array<Array<string | number>>, align?: Align[], maxWidths?: number[]): string {
  const cols = headers.length;
  const clip = (s: string, max?: number) => {
    if (!max || max <= 0) return s;
    if (s.length <= max) return s;
    return s.slice(0, Math.max(0, max - 1)) + '…';
  };
  const widths = new Array(cols).fill(0).map((_, i) => {
    const maxW = maxWidths && maxWidths[i] ? maxWidths[i] : undefined;
    const headLen = String(clip(String(headers[i] ?? ''), maxW)).length;
    const maxRow = rows.reduce((m, r) => Math.max(m, String(clip(String(r[i] ?? ''), maxW)).length), 0);
    return Math.max(headLen, maxRow);
  });
  const padCell = (text: string, width: number, a: Align) => {
    const len = text.length;
    if (len >= width) return text;
    const pad = ' '.repeat(width - len);
    if (a === 'right') return pad + text;
    if (a === 'center') {
      const left = Math.floor((width - len) / 2);
      const right = width - len - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    }
    return text + pad; // left
  };
  const drawSep = () => '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+\n';
  const alignments: Align[] = align && align.length === cols ? align : new Array(cols).fill('left');
  let out = '';
  out += drawSep();
  out += '|' + headers.map((h, i) => ' ' + padCell(clip(String(h), maxWidths?.[i]), widths[i], 'center') + ' ').join('|') + '|\n';
  out += drawSep();
  rows.forEach(row => {
    out += '|' + row.map((c, i) => ' ' + padCell(clip(String(c ?? ''), maxWidths?.[i]), widths[i], alignments[i]) + ' ').join('|') + '|\n';
  });
  out += drawSep();
  return out;
}

function buildStatsBlock(loadout: Loadout | null): string {
  if (!loadout) return '';
  const { includeBaseStats, includeRenownStats, includeDerivedStats } = getAllToggles();
  const empty: StatsSummary = buildEmptySummary();
  const stats: StatsSummary = computeTotalStatsForSide(loadoutService.getActiveSide(), loadout.id || null, empty, includeBaseStats, includeDerivedStats, includeRenownStats);
  // Include every stat shown in the Compare panel: flatten all rowDefs in order and include non-zero rows only
  const defs = [
    ...rowDefs.base,
    ...rowDefs.defense,
    ...rowDefs.offense,
    ...rowDefs.melee,
    ...rowDefs.ranged,
    ...rowDefs.magic,
    ...rowDefs.healing,
    ...rowDefs.other,
  ];
  const seen = new Set<string>();
  const rows: Array<[string, string]> = [];
  defs.forEach(({ key }) => {
    if (seen.has(key as string)) return; // avoid duplicates if any
    seen.add(key as string);
    const k = key as keyof StatsSummary;
    let v = Number((stats[k] as number) ?? 0);
    // Match Compare panel's effective percent handling for these rows
    if (k === 'outgoingDamage') {
  const itemPct = Number(stats.outgoingDamage || 0);
  const renownPct = Number(stats.outgoingDamagePercent || 0);
      const mult = (1 + itemPct / 100) * (1 + renownPct / 100);
      v = (mult - 1) * 100;
    } else if (k === 'incomingDamage') {
  const itemPct = Number(stats.incomingDamage || 0);
  const renownPct = Number(stats.incomingDamagePercent || 0);
      const mult = (1 + itemPct / 100) * (1 + renownPct / 100);
      v = (mult - 1) * 100;
    } else if (k === 'outgoingHealPercent') {
      // Items and renown both land in the same bucket; multiplicative rendering for display
  const total = Number(stats.outgoingHealPercent || 0);
      // Without contributions split here, assume additive bucket; keep as-is (matches compare logic fallback when not splitting)
      v = total;
    }
    if (!v) return; // omit zeros
    // Normalize units for range/radius/healthRegen for readability
    const needsNorm = k === 'range' || k === 'radius' || k === 'healthRegen';
    const displayV = needsNorm ? normalizeStatDisplayValue(k as string, v) : v;
    // Use contributions to refine percent decision when possible
  const contrib = loadout.id ? loadoutService.getStatContributionsForLoadout(loadout.id, k as string) : [];
  const isPct = isPercentSummaryKey(k as string, contrib as Array<{ percentage?: boolean }>);
    const val = isPct ? `${Number(displayV.toFixed(2))}%` : `${Math.trunc(displayV)}`;
    rows.push([formatSummaryStatKey(k as string), val]);
  });
  if (rows.length === 0) return '';
  // No width cap: allow full content
  const table = renderAsciiTable(['Stat', 'Value'], rows, ['left', 'right']);
  return 'Stats (respecting toggles)\n' + table;
}

function buildSummary(loadout: Loadout | null, opts?: { showItems?: boolean; showRenown?: boolean; showStats?: boolean }) {
  if (!loadout) return 'No loadout selected.';
  let out = '';
  // Info table (Career, Level, RR)
  const infoRows: Array<[string, string]> = [
    ['Career', loadout.career ? formatCareerName(loadout.career) : '—'],
    ['Level', String(loadout.level)],
    ['RR', String(loadout.renownRank)],
  ];
  // Info table: no width cap
  out += 'Info\n' + renderAsciiTable(['Field', 'Value'], infoRows, ['left', 'right']) + '\n';
  // Renown (only show if anything allocated)
  const ra = loadout.renownAbilities || {} as NonNullable<Loadout['renownAbilities']>;
  const roman = (lvl: number) => ['', 'I', 'II', 'III', 'IV', 'V'][Math.max(0, Math.min(5, Math.trunc(lvl)))] || '';
  const statTotalsDefault = [0, 4, 16, 38, 72, 120];
  const getRenownRow = (key: string, lvl: number): [string, string, string] | null => {
    const def = RENOWN_ABILITIES.find(d => d.key === (key as string));
    if (!def) return null;
    const cap = def.capLevel ?? 5;
    const clamped = Math.max(0, Math.min(cap, Math.trunc(lvl)));
    const totals = def.customTotals ?? (def.percent ? undefined : statTotalsDefault);
    // Special rendering per ability where needed
    if (def.key === 'deftDefender') {
      const val = (totals || [0, 3, 7, 12, 18, 18])[clamped];
      return [def.label, roman(clamped), `Dodge +${val}%, Disrupt +${val}%`];
    }
    if (def.key === 'hardyConcession') {
      const table = totals || [0, -1, -3, -6, -10, -15];
      const v = table[clamped];
      // v is negative; show with minus sign
      return [def.label, roman(clamped), `Incoming Damage ${v}% | Outgoing Damage ${v}% | Outgoing Healing ${v}%`];
    }
    const value = (totals || [0, 0, 0, 0, 0, 0])[clamped];
    const unit = def.percent ? '%' : '';
    if (def.key === 'opportunist') {
      return [def.label, roman(clamped), `Melee/Ranged/Magic Crit +${value}${unit}`];
    }
    if (def.key === 'spiritualRefinement') {
      return [def.label, roman(clamped), `Healing Crit +${value}${unit}`];
    }
    if (def.key === 'reflexes') {
      return [def.label, roman(clamped), `Parry +${value}${unit}`];
    }
    if (def.key === 'defender') {
      return [def.label, roman(clamped), `Block +${value}${unit}`];
    }
    if (def.key === 'regeneration') {
      return [def.label, roman(clamped), `Health Regen +${value}`];
    }
    if (def.key === 'futileStrikes') {
      return [def.label, roman(clamped), `Crit Hit Rate Reduction +${value}${unit}`];
    }
    if (def.key === 'trivialBlows') {
      return [def.label, roman(clamped), `Crit Damage Taken Reduction +${value}${unit}`];
    }
    // Default: basic stats
    if (!def.percent) {
      return [def.label, roman(clamped), `${def.stat} +${value}`];
    }
    return [def.label, roman(clamped), `${def.stat} +${value}${unit}`];
  };

  const renownRows: Array<[string, string, string]> = [];
  Object.entries(ra).forEach(([key, lvl]) => {
    const n = Number(lvl) || 0;
    if (n > 0) {
      const row = getRenownRow(key, n);
      if (row) renownRows.push(row);
    }
  });
  if ((opts?.showRenown ?? false) && renownRows.length > 0) {
    // Renown table: no width cap
    out += 'Renown\n' + renderAsciiTable(['Ability', 'Rank', 'Effect'], renownRows, ['left', 'center', 'left']) + '\n';
  }
  // Stats block respecting toggles
  const statsBlock = (opts?.showStats ?? false) ? buildStatsBlock(loadout) : '';
  if (statsBlock && (opts?.showStats ?? false)) {
    out += statsBlock + '\n';
  }
  // Items table
  // Requested order: Helm, Shoulders, Back, Chest, Gloves, Belt, Boots,
  // Main Hand, Off Hand, Ranged, Jewels, Pockets, Event
  const orderedSlots: EquipSlot[] = [
    EquipSlot.HELM,
    EquipSlot.SHOULDER,
    EquipSlot.BACK,
    EquipSlot.BODY, // Chest
    EquipSlot.GLOVES,
    EquipSlot.BELT,
    EquipSlot.BOOTS,
    EquipSlot.MAIN_HAND,
    EquipSlot.OFF_HAND,
    EquipSlot.RANGED_WEAPON,
    // Jewels
    EquipSlot.JEWELLERY1,
    EquipSlot.JEWELLERY2,
    EquipSlot.JEWELLERY3,
    EquipSlot.JEWELLERY4,
    // Pockets
    EquipSlot.POCKET1,
    EquipSlot.POCKET2,
    // Event
    EquipSlot.EVENT,
  ];

  const itemRows: Array<[string, string, string]> = [];
  orderedSlots.forEach((slot) => {
    const data = loadout.items[slot];
    const hasItem = !!data?.item;
    const talismans = data?.talismans || [];
    const hasTalismans = talismans.some(t => !!t);
    if (!hasItem && !hasTalismans) return; // skip empty slots entirely
    const itemName = data?.item?.name || '(talisman only)';
    const tl = talismans.map(t => t?.name).filter((n): n is string => !!n);
    itemRows.push([formatSlotName(slot), itemName, tl.join(', ')]);
  });
  if ((opts?.showItems ?? true) && itemRows.length > 0) {
    // Items table: no width cap; allow full talisman lists
    out += 'Items\n' + renderAsciiTable(['Slot', 'Item', 'Talismans'], itemRows, ['left', 'left', 'left']);
  }
  return out;
}

export default function LoadoutSummaryModal({ open, onClose, loadout }: LoadoutSummaryModalProps) {
  // Hooks must be called unconditionally
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  // Persisted UI prefs for section visibility
  const LS_ITEMS = 'ui.summary.includeItems';
  const LS_RENOWN = 'ui.summary.includeRenown';
  const LS_STATS = 'ui.summary.includeStats';
  const readPref = (key: string, fallback: boolean) => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === '1' || raw === 'true';
    } catch { return fallback; }
  };
  const [showItems, setShowItems] = useState<boolean>(() => readPref(LS_ITEMS, true));
  const [showRenown, setShowRenown] = useState<boolean>(() => readPref(LS_RENOWN, false));
  const [showStats, setShowStats] = useState<boolean>(() => readPref(LS_STATS, false));
  useEffect(() => { try { window.localStorage.setItem(LS_ITEMS, showItems ? '1' : '0'); } catch { /* ignore storage errors */ } }, [showItems]);
  useEffect(() => { try { window.localStorage.setItem(LS_RENOWN, showRenown ? '1' : '0'); } catch { /* ignore storage errors */ } }, [showRenown]);
  useEffect(() => { try { window.localStorage.setItem(LS_STATS, showStats ? '1' : '0'); } catch { /* ignore storage errors */ } }, [showStats]);

  const text = useMemo(() => buildSummary(loadout, { showItems, showRenown, showStats }), [loadout, showItems, showRenown, showStats]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, open]);

  useEffect(() => {
    // Autofocus and select text for quick copy
    if (open && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [text, open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore copy errors
    }
  };
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-container modal-as-panel max-w-none">
        <div className="panel-container panel-border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="panel-heading mb-0">Loadout Summary</h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</button>
              <button 
                onClick={onClose} 
                className="modal-close-btn hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="field-group">
            <div className="flex items-center gap-4 mb-2">
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input type="checkbox" className="form-checkbox h-3 w-3" checked={showItems} onChange={(e) => setShowItems(e.currentTarget.checked)} />
            Items
          </label>
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input type="checkbox" className="form-checkbox h-3 w-3" checked={showRenown} onChange={(e) => setShowRenown(e.currentTarget.checked)} />
            Renown
          </label>
          <label className="inline-flex items-center gap-2 text-xs select-none text-gray-200">
            <input type="checkbox" className="form-checkbox h-3 w-3" checked={showStats} onChange={(e) => setShowStats(e.currentTarget.checked)} />
            Stats
          </label>
            </div>
            <div className="overflow-x-auto">
              <textarea
                readOnly
                ref={textareaRef}
                className="w-[128ch] h-80 form-input form-input-text rounded-md p-3 font-mono text-sm"
                value={text}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
