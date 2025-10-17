import { useEffect, useRef, useState } from 'react';
import { Loadout, EquipSlot } from '../../types';
import { RENOWN_ABILITIES } from '../../services/loadout/renownConfig';
import { formatCareerName, formatSlotName } from '../../utils/formatters';

interface LoadoutSummaryModalProps {
  open: boolean;
  onClose: () => void;
  loadout: Loadout | null;
  sideLabel?: 'A' | 'B';
}

function line(text: string) {
  return text + '\n';
}

function buildSummary(loadout: Loadout | null) {
  if (!loadout) return 'No loadout selected.';
  let out = '';
  // Omit side, loadout name, and character per request
  out += line(`Career: ${loadout.career ? formatCareerName(loadout.career) : '—'}`);
  out += line(`Level: ${loadout.level}  RR: ${loadout.renownRank}`);
  out += line('');
  // Renown (only show if anything allocated)
  const ra = loadout.renownAbilities || {} as NonNullable<Loadout['renownAbilities']>;
  const roman = (lvl: number) => ['', 'I', 'II', 'III', 'IV', 'V'][Math.max(0, Math.min(5, Math.trunc(lvl)))] || '';
  const statTotalsDefault = [0, 4, 16, 38, 72, 120];
  const getTotal = (key: string, lvl: number): { text: string } | null => {
    const def = RENOWN_ABILITIES.find(d => d.key === (key as string));
    if (!def) return null;
    const cap = def.capLevel ?? 5;
    const clamped = Math.max(0, Math.min(cap, Math.trunc(lvl)));
    const totals = def.customTotals ?? (def.percent ? undefined : statTotalsDefault);
    // Special rendering per ability where needed
    if (def.key === 'deftDefender') {
      const val = (totals || [0, 3, 7, 12, 18, 18])[clamped];
      return { text: `${def.label} ${roman(clamped)} — Dodge +${val}%, Disrupt +${val}%` };
    }
    if (def.key === 'hardyConcession') {
      const table = totals || [0, -1, -3, -6, -10, -15];
      const v = table[clamped];
      // v is negative; show with minus sign
      return { text: `${def.label} ${roman(clamped)} — Incoming Damage ${v}%  |  Outgoing Damage ${v}%  |  Outgoing Healing ${v}%` };
    }
    const value = (totals || [0, 0, 0, 0, 0, 0])[clamped];
    const unit = def.percent ? '%' : '';
    if (def.key === 'opportunist') {
      return { text: `${def.label} ${roman(clamped)} — Melee/Ranged/Magic Crit +${value}${unit}` };
    }
    if (def.key === 'spiritualRefinement') {
      return { text: `${def.label} ${roman(clamped)} — Healing Crit +${value}${unit}` };
    }
    if (def.key === 'reflexes') {
      return { text: `${def.label} ${roman(clamped)} — Parry +${value}${unit}` };
    }
    if (def.key === 'defender') {
      return { text: `${def.label} ${roman(clamped)} — Block +${value}${unit}` };
    }
    if (def.key === 'regeneration') {
      return { text: `${def.label} ${roman(clamped)} — Health Regen +${value}` };
    }
    if (def.key === 'futileStrikes') {
      return { text: `${def.label} ${roman(clamped)} — Crit Hit Rate Reduction +${value}${unit}` };
    }
    if (def.key === 'trivialBlows') {
      return { text: `${def.label} ${roman(clamped)} — Crit Damage Taken Reduction +${value}${unit}` };
    }
    // Default: basic stats
    if (!def.percent) {
      return { text: `${def.label} ${roman(clamped)} — ${def.stat} +${value}` };
    }
    return { text: `${def.label} ${roman(clamped)} — ${def.stat} +${value}${unit}` };
  };

  const renownLines: string[] = [];
  Object.entries(ra).forEach(([key, lvl]) => {
    const n = Number(lvl) || 0;
    if (n > 0) {
      const row = getTotal(key, n);
      if (row) renownLines.push(`- ${row.text}`);
    }
  });
  if (renownLines.length > 0) {
    out += line('Renown:');
    renownLines.forEach(l => { out += line(l); });
    out += line('');
  }
  out += line('Items:');
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

  orderedSlots.forEach((slot) => {
    const data = loadout.items[slot];
    const hasItem = !!data?.item;
    const talismans = data?.talismans || [];
    const hasTalismans = talismans.some(t => !!t);
    if (!hasItem && !hasTalismans) return; // skip empty slots entirely
    const itemName = data?.item?.name || '';
    out += line(`- ${formatSlotName(slot)}: ${itemName || '(talisman only)'}`);
    if (hasTalismans) {
      const tl = talismans.map(t => t?.name).filter((n): n is string => !!n);
      if (tl.length) out += line(`  Talismans: ${tl.join(', ')}`);
    }
  });
  return out;
}

export default function LoadoutSummaryModal({ open, onClose, loadout }: LoadoutSummaryModalProps) {
  // Hooks must be called unconditionally
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const text = buildSummary(loadout);

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
      <div className="modal-container max-w-3xl">
        <div className="modal-header">
          <h3 className="modal-title">Loadout Summary</h3>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div>
          <textarea
            readOnly
            ref={textareaRef}
            className="w-full h-80 form-input form-input-text rounded-md p-3"
            value={text}
          />
        </div>
      </div>
    </div>
  );
}
