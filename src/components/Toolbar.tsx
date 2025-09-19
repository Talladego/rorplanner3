import { useState, ChangeEvent, useEffect } from 'react';
import { Career } from '../types';
import { loadoutService } from '../services/loadoutService';
import { LevelChangedEvent, RenownRankChangedEvent, CharacterLoadedFromUrlEvent } from '../types/events';
import { formatCareerName } from '../utils/formatters';

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

  // Initialize state from current loadout on mount
  useEffect(() => {
    const currentLoadout = loadoutService.getCurrentLoadout();
    if (currentLoadout) {
      setSelectedCareer(currentLoadout.career || '');
      setLevel(currentLoadout.level);
      setRenownRank(currentLoadout.renownRank);
    }
  }, [setSelectedCareer]);

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
            // Career is handled in handleCareerChange, only update level and renown
            setLevel(currentLoadout.level);
            setRenownRank(currentLoadout.renownRank);
          }
          // Clear character name since we're now on a career-specific loadout
          setCharacterName('');
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

  const handleCareerChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const careerValue = e.target.value;
    if (careerValue) {
      // Switch to or create loadout for this career
      await loadoutService.getOrCreateLoadoutForCareer(careerValue as Career);
      // Update UI to reflect the new loadout
      const currentLoadout = loadoutService.getCurrentLoadout();
      if (currentLoadout) {
        setSelectedCareer(currentLoadout.career || '');
        setLevel(currentLoadout.level);
        setRenownRank(currentLoadout.renownRank);
      }
      setCharacterName(''); // Clear character name since we're on a career loadout
    } else {
      // Handle clearing career - just set to null on current loadout
      loadoutService.setCareer(null);
      setSelectedCareer(''); // For clearing, we do need to update UI immediately
    }
  };

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
    // Form fields will be cleared via the LOADOUT_RESET event
  };

  return (
    <div className="panel-container mb-8">
      <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-end">
        {/* Career - 2 columns */}
        <div className="md:col-span-2">
          <label className="form-label">Career</label>
          <select
            value={selectedCareer}
            onChange={handleCareerChange}
            className="form-input form-input-text mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md"
          >
            <option value="">Select Career</option>
            {Object.values(Career).map((career) => (
              <option key={career} value={career}>
                {formatCareerName(career)}
              </option>
            ))}
          </select>
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
            className="form-input form-input-text mt-1 block w-full pl-3 pr-3 py-2 text-base sm:text-sm rounded-md"
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
            className="form-input form-input-text mt-1 block w-full pl-3 pr-3 py-2 text-base sm:text-sm rounded-md"
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
            className="form-input form-input-text mt-1 block w-full pl-3 pr-3 py-2 text-base sm:text-sm rounded-md"
          />
        </div>

        {/* Load Button - 1 column */}
        <div className="md:col-span-1">
          <button
            onClick={handleLoadCharacter}
            className="btn btn-primary w-full"
          >
            Load
          </button>
        </div>

        {/* Reset Button - 1 column */}
        <div className="md:col-span-1">
          <button
            onClick={handleReset}
            className="btn btn-primary w-full"
          >
            Reset
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
