import { useState, ChangeEvent, useEffect } from 'react';
import { Career } from '../types';
import { loadoutService } from '../services/loadoutService';
import { CareerChangedEvent, LevelChangedEvent, RenownRankChangedEvent } from '../types/events';
import { formatCareerName } from '../utils/formatters';

export default function Toolbar() {
  const [selectedCareer, setSelectedCareer] = useState<Career | ''>('');
  const [level, setLevel] = useState(40);
  const [renownRank, setRenownRank] = useState(80);
  const [characterName, setCharacterName] = useState('');

  // Listen to events to update local state when loadout changes externally
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToAllEvents((event) => {
      switch (event.type) {
        case 'CAREER_CHANGED': {
          const careerEvent = event as CareerChangedEvent;
          setSelectedCareer(careerEvent.payload.career || '');
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
        case 'LOADOUT_RESET':
          // Clear all form fields when loadout is reset
          setSelectedCareer('');
          setLevel(40);
          setRenownRank(80);
          setCharacterName('');
          break;
      }
    });

    return unsubscribe;
  }, []);

  const handleCareerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const career = e.target.value as Career;
    setSelectedCareer(career);
    if (career) loadoutService.setCareer(career);
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
        // Character loaded successfully - form fields will be updated via events
      } catch (error) {
        alert('Failed to load character: ' + (error as Error).message);
      }
    }
  };

  const handleReset = () => {
    loadoutService.resetCurrentLoadout();
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
    </div>
  );
}
