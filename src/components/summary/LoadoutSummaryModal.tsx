import { useEffect, useRef, useState } from 'react';
import { Loadout, EquipSlot } from '../../types';
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
  if (!open) return null;
  const text = buildSummary(loadout);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    // Autofocus and select text for quick copy
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore copy errors
    }
  };
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
