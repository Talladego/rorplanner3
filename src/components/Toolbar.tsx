import { useState, ChangeEvent, useEffect } from 'react';
import { Career } from '../types';
import { urlService } from '../services/urlService';
import { loadoutService } from '../services/loadoutService';
import { LevelChangedEvent, RenownRankChangedEvent, CharacterLoadedFromUrlEvent } from '../types/events';
// import { formatCareerName } from '../utils/formatters';
import CareerSelect from './CareerSelect';

interface ToolbarProps {
  selectedCareer: Career | '';
  setSelectedCareer: (career: Career | '') => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}

export default function Toolbar({ selectedCareer, setSelectedCareer, errorMessage, setErrorMessage }: ToolbarProps) {
  const [level, setLevel] = useState(40);
  const [renownRank, setRenownRank] = useState(80);
  const [characterName, setCharacterName] = useState('');
  const [mode, setModeState] = useState<'single' | 'dual'>(loadoutService.getMode ? loadoutService.getMode() : 'single');
  const [activeSide, setActiveSide] = useState<'A' | 'B'>(loadoutService.getActiveSide ? loadoutService.getActiveSide() : 'A');

  // Initialize state from current loadout on mount
  useEffect(() => {
    const currentLoadout = loadoutService.getCurrentLoadout();
    if (currentLoadout) {
      setSelectedCareer(currentLoadout.career || '');
      setLevel(currentLoadout.level);
      setRenownRank(currentLoadout.renownRank);
      setCharacterName(currentLoadout.characterName || '');
    }
  }, [setSelectedCareer]);
  // Keep local mode state in sync with service events
  useEffect(() => {
    const unsub = loadoutService.subscribeToAllEvents((event) => {
      if (event.type === 'MODE_CHANGED') {
        setModeState(loadoutService.getMode());
      }
      if (event.type === 'ACTIVE_SIDE_CHANGED') {
        setActiveSide(loadoutService.getActiveSide());
      }
    });
    return unsub;
  }, []);

  const toggleCompare = async () => {
    if (mode === 'single') {
      // Enter compare mode
      loadoutService.setMode('dual');
      setModeState('dual');
    } else {
      // Exit compare mode back to single (keep current active side)
      loadoutService.setMode('single');
      setModeState('single');
      // Ensure we are editing the active side's loadout
      await loadoutService.selectSideForEdit(activeSide);
    }
  };

  const selectSide = async (side: 'A' | 'B') => {
    setActiveSide(side);
    await loadoutService.selectSideForEdit(side);
  };


  // Listen to events to update local state when loadout changes externally
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToAllEvents((event) => {
      switch (event.type) {
        case 'CAREER_CHANGED': {
          // Don't update selectedCareer here - it's handled in handleCareerChange
          break;
        }
        case 'LEVEL_CHANGED': {
          const levelEvent = event as LevelChangedEvent;
          setLevel(levelEvent.payload.level);
          break;
        }
        case 'RENOWN_RANK_CHANGED': {
          const renownEvent = event as RenownRankChangedEvent;
          setRenownRank(renownEvent.payload.renownRank);
          break;
        }
        case 'LOADOUT_SWITCHED': {
          // Update UI state to match the new current loadout
          const currentLoadout = loadoutService.getCurrentLoadout();
          if (currentLoadout) {
            setSelectedCareer(currentLoadout.career || '');
            setLevel(currentLoadout.level);
            setRenownRank(currentLoadout.renownRank);
            setCharacterName(currentLoadout.characterName || '');
          }
          break;
        }
        case 'LOADOUT_RESET': {
          // Update UI state to match the reset loadout
          const currentLoadout = loadoutService.getCurrentLoadout();
          if (currentLoadout) {
            setSelectedCareer(currentLoadout.career || '');
            setLevel(currentLoadout.level);
            setRenownRank(currentLoadout.renownRank);
          }
          // Clear the character name field
          setCharacterName('');
          break;
        }
        case 'CHARACTER_LOADED_FROM_URL': {
          const urlEvent = event as CharacterLoadedFromUrlEvent;
          setCharacterName(urlEvent.payload.characterName);
          break;
        }
      }
    });

    return unsubscribe;
  }, [setSelectedCareer]);

  // Replaced by CareerSelect onChange handler

  const handleLevelChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setLevel(val);
    loadoutService.setLevel(val);
  };

  const handleRenownChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setRenownRank(val);
    loadoutService.setRenownRank(val);
  };

  const handleLoadCharacter = async () => {
    if (characterName) {
      try {
        // Make sure we are targeting the chosen side explicitly
        await loadoutService.selectSideForEdit(activeSide);
        await loadoutService.loadFromNamedCharacter(characterName);
        setErrorMessage(''); // Clear any previous error
        // Character loaded successfully - form fields will be updated via events
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    }
  };

  const handleReset = async () => {
    await loadoutService.resetCurrentLoadout();
    // Clear ALL URL parameters for a complete reset
    const clearParams: Record<string, null> = {};
    const currentParams = urlService.getSearchParams();
    for (const key of currentParams.keys()) {
      clearParams[key] = null;
    }
    urlService.updateUrl(clearParams, { replace: true });
    // Form fields will be cleared via the LOADOUT_RESET event, but also clear the input proactively
    setCharacterName('');
  };


  return (
    <div className="panel-container mb-8">
  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Career - 2 columns */}
        <div className="md:col-span-2">
          <label className="form-label">Career</label>
          <div className="mt-1">
            <CareerSelect
              value={selectedCareer}
              onChange={async (career) => {
                // mimic handleCareerChange behavior
                if (career) {
                  await loadoutService.getOrCreateLoadoutForCareer(career as Career);
                  const currentLoadout = loadoutService.getCurrentLoadout();
                  if (currentLoadout) {
                    setSelectedCareer(currentLoadout.career || '');
                    setLevel(currentLoadout.level);
                    setRenownRank(currentLoadout.renownRank);
                    setCharacterName(currentLoadout.characterName || '');
                    urlService.updateUrlForCurrentLoadout();
                  }
                } else {
                  loadoutService.setCareer(null);
                  setSelectedCareer('');
                  urlService.updateUrlForCurrentLoadout();
                }
              }}
              size="md"
            />
          </div>
        </div>

        {/* Level - 1 column */}
        <div className="md:col-span-1">
          <label className="form-label">Level</label>
          <input
            type="number"
            min="1"
            max="40"
            value={level}
            onChange={handleLevelChange}
            className="form-input form-input-text mt-1 block w-20 pl-2 pr-2 py-1 text-sm rounded-md"
          />
        </div>

        {/* Renown Rank - 1 column */}
        <div className="md:col-span-1">
          <label className="form-label">Renown</label>
          <input
            type="number"
            min="1"
            max="255"
            value={renownRank}
            onChange={handleRenownChange}
            className="form-input form-input-text mt-1 block w-24 pl-2 pr-2 py-1 text-sm rounded-md"
          />
        </div>

        {/* Character Name - 3 columns */}
        <div className="md:col-span-3">
          <label className="form-label">Character Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLoadCharacter();
              }
            }}
            placeholder="Enter character name"
            className="form-input form-input-text mt-1 block w-full pl-3 pr-3 py-2 text-sm rounded-md"
          />
        </div>

        {/* Load Button - 1 column */}
        <div className="md:col-span-1">
          <button
            onClick={handleLoadCharacter}
            className="btn btn-primary w-full text-sm py-1"
          >
            Load
          </button>
        </div>

        {/* Reset Button - 1 column */}
        <div className="md:col-span-1">
          <button
            onClick={handleReset}
            className="btn btn-primary w-full text-sm py-1"
          >
            Reset
          </button>
        </div>

        {/* Loadout selector (always visible) */}
        <div className="md:col-span-2">
            <label className="form-label">Loadout</label>
            <div className="mt-1 flex gap-2">
              <button
                className={`w-full px-3 py-1 rounded text-sm font-medium border ${activeSide === 'A' ? 'bg-green-600 text-white border-green-600' : 'text-green-400 border-green-600 hover:bg-green-600/10'}`}
                onClick={() => selectSide('A')}
                title="Work on Loadout A"
              >
                A
              </button>
              <button
                className={`w-full px-3 py-1 rounded text-sm font-medium border ${activeSide === 'B' ? 'bg-red-600 text-white border-red-600' : 'text-red-400 border-red-600 hover:bg-red-600/10'}`}
                onClick={() => selectSide('B')}
                title="Work on Loadout B"
              >
                B
              </button>
            </div>
          </div>

        {/* Compare toggle */}
        <div className="md:col-span-1">
          <label className="form-label">Compare</label>
          <button
            onClick={toggleCompare}
            className="btn btn-primary w-full mt-1"
            title={mode === 'single' ? 'Show Compare Mode' : 'Back to Edit'}
          >
            {mode === 'single' ? 'Compare' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}
