import { memo, type ChangeEvent } from 'react';
import { ItemRarity, Stat } from '../../types';
import { formatRarityName, formatStatName } from '../../utils/formatters';

export interface FilterControlsProps {
  nameFilter: string;
  onNameChange: (value: string) => void;
  rarityFilter: ItemRarity[];
  onRarityChange: (value: ItemRarity[]) => void;
  statsFilter: Stat[];
  onStatsChange: (value: Stat[]) => void;
  allowedStatOptions: Stat[];
  onReset: () => void;
}

export function FilterControls({
  nameFilter,
  onNameChange,
  rarityFilter,
  onRarityChange,
  statsFilter,
  onStatsChange,
  allowedStatOptions,
  onReset,
}: FilterControlsProps) {
  return (
    <div className={`mb-2 grid grid-cols-[minmax(0,1fr)_10rem_10rem_5.5rem] gap-1`}>
      {/* Name */}
      <div className={`col-[1/2] w-full min-w-0 max-w-full`}>
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent form-input form-input-text"
        />
      </div>
      {/* Rarity */}
      <div className={`col-[2/3] w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0`}>
        <select
          value={rarityFilter[0] ?? ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value as ItemRarity | '';
            const newRarityFilter = val ? [val as ItemRarity] : [];
            onRarityChange(newRarityFilter);
          }}
          size={1}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent form-input form-input-text`}
        >
          <option value="" className="text-muted">All Rarities</option>
          {Object.values(ItemRarity).map(rarity => (
            <option key={rarity} value={rarity}>
              {formatRarityName(rarity as ItemRarity)}
            </option>
          ))}
        </select>
      </div>
      {/* Stat */}
      <div className={`col-[3/4] w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0`}>
        <select
          value={statsFilter[0] ?? ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value as Stat | '';
            const normalized = val && allowedStatOptions.includes(val as Stat) ? [val as Stat] : [];
            onStatsChange(normalized);
          }}
          size={1}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent form-input form-input-text`}
        >
          <option value="" className="text-muted">All Stats</option>
          {allowedStatOptions.map(stat => (
            <option key={stat} value={stat}>
              {formatStatName(stat)}
            </option>
          ))}
        </select>
      </div>
      {/* Reset */}
      <div className={`col-[4/5] flex items-center w-[5.5rem] shrink-0`}>
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full"
          title="Reset filters"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default memo(FilterControls);
