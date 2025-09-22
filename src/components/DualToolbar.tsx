import { useEffect, useState } from 'react';
import { Career, Loadout } from '../types';
import { loadoutService } from '../services/loadoutService';
import { urlService } from '../services/urlService';
// import { formatCareerName } from '../utils/formatters';
import CareerSelect from './CareerSelect';

interface SideToolbarProps {
  side: 'A' | 'B';
}

function SideToolbar({ side }: SideToolbarProps) {
  const [selectedCareer, setSelectedCareer] = useState<Career | ''>('');
  const [level, setLevel] = useState(40);
  const [renownRank, setRenownRank] = useState(80);
  const [characterName, setCharacterName] = useState('');
  const [, setLoadout] = useState<Loadout | null>(loadoutService.getLoadoutForSide(side));

  // Sync with events
  useEffect(() => {
    const unsub = loadoutService.subscribeToAllEvents((ev) => {
      if (
        ev.type === 'SIDE_LOADOUT_ASSIGNED' ||
        ev.type === 'LOADOUT_SWITCHED' ||
        ev.type === 'CAREER_CHANGED' ||
        ev.type === 'LEVEL_CHANGED' ||
        ev.type === 'RENOWN_RANK_CHANGED' ||
        ev.type === 'LOADOUT_RESET' ||
        ev.type === 'CHARACTER_LOADED' ||
        ev.type === 'CHARACTER_LOADED_FROM_URL'
      ) {
        const lo = loadoutService.getLoadoutForSide(side);
        setLoadout(lo);
        if (lo) {
          setSelectedCareer(lo.career || '');
          setLevel(lo.level);
          setRenownRank(lo.renownRank);
          setCharacterName(lo.characterName || '');
        }
      }
    });
    return unsub;
  }, [side]);

  // Ensure side loadout exists on mount
  useEffect(() => {
    try {
  loadoutService.ensureSideLoadout(side);
      const lo = loadoutService.getLoadoutForSide(side);
      setLoadout(lo);
      if (lo) {
        setSelectedCareer(lo.career || '');
        setLevel(lo.level);
        setRenownRank(lo.renownRank);
        setCharacterName(lo.characterName || '');
      }
    } catch (_err) {
      // intentionally ignore; ensuring side loadout can be a no-op during init
      void _err;
    }
  }, [side]);

  const onCareerChange = async (career: Career | '') => {
    await loadoutService.selectSideForEdit(side);
    if (career) {
      await loadoutService.getOrCreateLoadoutForCareer(career as Career);
    } else {
      await loadoutService.setCareer(null);
      urlService.updateUrlForCurrentLoadout();
    }
  };

  const onLevelChange = async (val: number) => {
    await loadoutService.selectSideForEdit(side);
    await loadoutService.setLevel(val);
  };

  const onRenownChange = async (val: number) => {
    await loadoutService.selectSideForEdit(side);
    await loadoutService.setRenownRank(val);
  };

  const onLoadCharacter = async () => {
    if (!characterName) return;
    await loadoutService.selectSideForEdit(side);
    try {
      await loadoutService.loadFromNamedCharacter(characterName);
    } catch (_err) {
      // swallow per-side errors; global error UI handled in parent Toolbar before
      // Optionally, we could surface a tiny side-local message; omitted for now
      // console.warn(e);
      void _err;
    }
  };

  const onReset = async () => {
    await loadoutService.selectSideForEdit(side);
    await loadoutService.resetCurrentLoadout();
    setCharacterName('');
  };

  return (
    <div className={`panel-container ${side === 'A' ? 'panel-border-green-600' : 'panel-border-red-600'}`}>
      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${side === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{side}</span>
      </div>
      <div className="grid grid-cols-12 gap-2 items-end">
        {/* Career */}
        <div className="col-span-4">
          <label className="form-label text-xs">Career</label>
          <div className="mt-1">
            <CareerSelect
              value={selectedCareer}
              onChange={(career) => onCareerChange(career)}
              placeholder="Select"
              size="sm"
            />
          </div>
        </div>

        {/* Level */}
        <div className="col-span-2">
          <label className="form-label text-xs">Lvl</label>
          <input
            type="number"
            min="1"
            max="40"
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value))}
            className="form-input form-input-text mt-1 block w-full pl-2 pr-2 py-1 text-xs rounded-md"
          />
        </div>

        {/* Renown */}
        <div className="col-span-2">
          <label className="form-label text-xs">RR</label>
          <input
            type="number"
            min="1"
            max="255"
            value={renownRank}
            onChange={(e) => onRenownChange(parseInt(e.target.value))}
            className="form-input form-input-text mt-1 block w-full pl-2 pr-2 py-1 text-xs rounded-md"
          />
        </div>

        {/* Character */}
        <div className="col-span-3">
          <label className="form-label text-xs">Character</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onLoadCharacter(); }}
            placeholder="Name"
            className="form-input form-input-text mt-1 block w-full pl-2 pr-2 py-1 text-xs rounded-md"
          />
        </div>

        {/* Buttons */}
        <div className="col-span-1 flex flex-col gap-1">
          <button onClick={onReset} className="btn btn-primary w-full text-xs py-1">Reset</button>
          <button onClick={onLoadCharacter} className="btn btn-primary w-full text-xs py-1">Load</button>
        </div>
      </div>
    </div>
  );
}

export default function DualToolbar() {
  const [mode, setMode] = useState<'single' | 'dual'>(loadoutService.getMode());

  useEffect(() => {
    const unsub = loadoutService.subscribeToAllEvents((ev) => {
      if (ev.type === 'MODE_CHANGED') setMode(loadoutService.getMode());
    });
    return unsub;
  }, []);

  // Ensure we are in dual mode; if not, render nothing (App shows single Toolbar)
  if (mode !== 'dual') return null;

  return (
    <div className="grid grid-cols-2 gap-8 mb-6">
      <SideToolbar side="A" />
      <SideToolbar side="B" />
    </div>
  );
}
