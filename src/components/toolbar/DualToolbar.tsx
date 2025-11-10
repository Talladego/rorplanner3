import { useEffect, useState, useRef } from 'react';
import { Career, Loadout } from '../../types';
import { loadoutService } from '../../services/loadout/loadoutService';
import { urlService } from '../../services/loadout/urlService';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Track pending name during async character load to suppress store-driven reversions
  const pendingNameRef = useRef<string | null>(null);
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
          // Suppress store-driven name updates while a new character load is in-flight.
          // Only update from store when the character has finished loading.
          if (ev.type === 'CHARACTER_LOADED' || ev.type === 'CHARACTER_LOADED_FROM_URL') {
            setCharacterName(lo.characterName || pendingNameRef.current || '');
            pendingNameRef.current = null;
            setLoadError(null);
          } else if (pendingNameRef.current === null) {
            setCharacterName(lo.characterName || '');
          }
        }
      }
    });
    return unsub;
  }, [side]);

  // Ensure side loadout exists on mount (skip if URL already has params to be parsed)
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const hasParams = hash.includes('?');
      if (!hasParams) {
        loadoutService.ensureSideLoadout(side);
        const lo = loadoutService.getLoadoutForSide(side);
        setLoadout(lo);
        if (lo) {
          setSelectedCareer(lo.career || '');
          setLevel(lo.level);
          setRenownRank(lo.renownRank);
          setCharacterName(lo.characterName || '');
        }
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

  // Reset full loadout for this side: career, level, renown, items
  const onResetSide = async () => {
    await loadoutService.selectSideForEdit(side);
    await loadoutService.resetCurrentLoadout();
    // Always clear local UI state immediately
    pendingNameRef.current = null;
    setCharacterName('');
    setLoadError(null);
  };

  const onLoadCharacter = async () => {
    if (!characterName) return;
    try {
      setLoadError(null);
      // Mark load as pending BEFORE any service events (like LOADOUT_SWITCHED) can fire
      pendingNameRef.current = characterName; // use null vs non-null to indicate pending, even if empty string
      setIsLoading(true);
      await loadoutService.selectSideForEdit(side);
      await loadoutService.loadFromNamedCharacter(characterName);
    } catch (_err) {
      const err = _err as Error;
      setLoadError(err?.message || 'Failed to load character');
    } finally {
      setIsLoading(false);
      // pendingNameRef cleared on character loaded event
    }
  };

  return (
    <div className={`panel-container ${side === 'A' ? 'panel-border-green-600' : 'panel-border-red-600'}`}>
      {/* Error banner fixed height to avoid layout shift */}
      <div className="min-h-[16px] mb-1 flex items-center">
        {loadError && (
          <div className="text-[11px] text-red-600 leading-snug w-full truncate" title={loadError}>{loadError}</div>
        )}
      </div>
      <h2 className="panel-heading font-brand flex items-center gap-2 mt-0">
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${side === 'A' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{side}</span>
        <span>Character</span>
      </h2>
      <div className="grid grid-cols-12 gap-x-1 gap-y-1 items-stretch">
        {/* Group 1: Career + Lvl + RR + Reset */}
        <div className="col-span-7 h-full">
          <div className="field-group h-full">
            <div className="grid grid-cols-12 gap-x-1 gap-y-1 items-end">
              <div className="col-span-6">
                <label className="form-label text-xs">Career</label>
                <div className="mt-0.5">
                  <CareerSelect
                    side={side}
                    value={selectedCareer}
                    onChange={(career) => onCareerChange(career)}
                    placeholder="Select"
                    size="sm"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="form-label text-xs">Lvl</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={level}
                  onChange={(e) => onLevelChange(parseInt(e.target.value))}
                  className="form-input form-input-text control-compact mt-0.5 block w-full pl-2 pr-2 text-xs rounded-md"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label text-xs">RR</label>
                <input
                  type="number"
                  min="1"
                  max="255"
                  value={renownRank}
                  onChange={(e) => onRenownChange(parseInt(e.target.value))}
                  className="form-input form-input-text control-compact mt-0.5 block w-full pl-2 pr-2 text-xs rounded-md"
                />
              </div>
              {/* Reset button to the right of RR */}
              <div className="col-span-2 flex items-end">
                <button onClick={onResetSide} className="btn btn-primary text-xs py-0.5 px-2 whitespace-nowrap w-full">Reset</button>
              </div>
            </div>
          </div>
        </div>

        {/* Group 2: Character + Load (input expands to button) */}
        <div className="col-span-5 h-full">
          <div className="field-group h-full">
            <div className="flex items-end gap-1">
              <div className="flex-1 min-w-0">
                <label className="form-label text-xs">Character</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onLoadCharacter(); }}
                  placeholder="Name"
                  className="form-input form-input-text control-compact mt-0.5 block w-full pl-2 pr-2 text-xs rounded-md"
                />
              </div>
              <div className="flex items-end">
                <button onClick={onLoadCharacter} disabled={isLoading} className={`btn btn-primary text-xs py-0.5 px-2 whitespace-nowrap ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>{isLoading ? 'Loading…' : 'Load'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DualToolbar() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <SideToolbar side="A" />
      <SideToolbar side="B" />
    </div>
  );
}
