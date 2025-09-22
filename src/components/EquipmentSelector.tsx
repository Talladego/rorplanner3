/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from 'react';
import { EquipSlot, Item, Stat, CAREER_RACE_MAPPING, Career, ItemRarity } from '../types';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { loadoutService } from '../services/loadoutService';
import { formatSlotName, formatStatName, formatItemTypeName } from '../utils/formatters';
import Tooltip from './Tooltip';
import { useLoadoutById } from '../hooks/useLoadoutById';

interface EquipmentSelectorProps {
  slot: EquipSlot;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  isTalismanMode?: boolean;
  holdingItemLevelReq?: number; // This represents holding item's levelRequirement
  talismanSlotIndex?: number; // Index of the talisman slot being filled
  loadoutId?: string | null; // optional explicit loadout to operate on (compare mode)
  nameFilter: string;
  statsFilter: Stat[];
  rarityFilter: ItemRarity[];
  onNameFilterChange: (value: string) => void;
  onStatsFilterChange: (value: Stat[]) => void;
  onRarityFilterChange: (value: ItemRarity[]) => void;
  selectedCareer: Career | '';
}

// Helper function to format talisman stats display
function formatTalismanStats(item: any): string {
  if (!item.stats || item.stats.length === 0) return '';
  
  // Talismans typically have one primary stat
  const primaryStat = item.stats[0];
  const value = primaryStat.percentage ? `${primaryStat.value}%` : `+${primaryStat.value}`;
  const statName = formatStatName(primaryStat.stat);
  
  return `${value} ${statName}`;
}

// Helper function to format item info display
function formatItemInfo(item: any): string {
  const typeName = formatItemTypeName(item.type);
  const slotName = formatSlotName(item.slot);
  return `${typeName}, ${slotName}, Item Level: ${item.itemLevel}`;
}

const ITEMS_PER_PAGE = 10;

interface PageData {
  items: Item[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
}

export default function EquipmentSelector({ slot, isOpen, onClose, onSelect, isTalismanMode = false, holdingItemLevelReq, talismanSlotIndex, loadoutId = null, nameFilter, statsFilter, rarityFilter, onNameFilterChange, onStatsFilterChange, onRarityFilterChange, selectedCareer }: EquipmentSelectorProps) {
  const { currentLoadout } = useLoadoutData();
  const { loadout: explicitLoadout } = useLoadoutById(loadoutId ?? null);
  const effectiveLoadout = loadoutId ? explicitLoadout : currentLoadout;
  const career = selectedCareer;
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Store previous context to detect changes
  const prevContextRef = useRef<{ isTalismanMode: boolean; career: Career | null }>({
    isTalismanMode,
    career: career || null
  });
  
  const [pageData, setPageData] = useState<PageData>({
    items: [],
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<string[]>([]); // Track cursors for back navigation
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch items for current page
  const fetchItems = useCallback(async (after?: string, filter?: string, stats?: Stat[], rarities?: ItemRarity[]) => {
    if (isTalismanMode) {
      if (!holdingItemLevelReq) return;
    } else {
      if (!career || !effectiveLoadout) return;
    }

    setLoading(true);
    setError(null);

    try {
      let connection;
      
      if (isTalismanMode) {
        connection = await loadoutService.getTalismansForSlot(
          slot,
          holdingItemLevelReq!,
          ITEMS_PER_PAGE,
          after,
          filter,
          stats,
          rarities
        );
      } else {
        connection = await loadoutService.getItemsForSlot(
          slot,
          career || undefined,
          ITEMS_PER_PAGE,
          after,
          effectiveLoadout?.level || 40,
          effectiveLoadout?.renownRank || 80,
          filter,
          stats,
          rarities
        );
      }

      // Apply client-side filtering
      let filteredNodes = connection.nodes || [];
      
      // Note: Level/renown filtering is handled server-side
      // Race filtering is handled in the UI for greying out incompatible items
      // Type filtering (excluding NONE) is now handled server-side

      setPageData({
        items: filteredNodes,
        hasNextPage: connection.pageInfo?.hasNextPage || false,
        hasPreviousPage: connection.pageInfo?.hasPreviousPage || false,
        startCursor: connection.pageInfo?.startCursor || null,
        endCursor: connection.pageInfo?.endCursor || null,
        totalCount: connection.totalCount || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setPageData({
        items: [],
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
        totalCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [isTalismanMode, holdingItemLevelReq, career, effectiveLoadout, slot]);

  // Reset pagination when modal opens; preserve filters across openings/context changes
  useEffect(() => {
    if (isOpen) {
  const currentContext = { isTalismanMode, career: career || null };
      
      setCurrentPage(1);
      setPageHistory([]);
      
      // Reset pageData when modal opens
      setPageData({
        items: [],
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
        totalCount: 0,
      });

      // Update context ref (no filter resets; we keep user selections)
      prevContextRef.current = currentContext;
      
      // Only fetch if we have a career (for equipment) or it's talisman mode
      if (career || isTalismanMode) {
        fetchItems(undefined, nameFilter, statsFilter, rarityFilter);
      }
    }
  }, [isOpen, isTalismanMode, career, effectiveLoadout, nameFilter, statsFilter, rarityFilter, fetchItems]);

  const handleNameFilterChange = (value: string) => {
    onNameFilterChange(value);
    
    // Debounce the filter to avoid too many API calls
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setPageHistory([]);
      fetchItems(undefined, value, statsFilter, rarityFilter);
    }, 300);
    
    setDebounceTimer(timer);
  };

  if (!isOpen) return null;

  const handleNextPage = () => {
    const maxPage = Math.ceil(pageData.items.length / ITEMS_PER_PAGE);
    if (pageData.hasNextPage && pageData.endCursor) {
      // Server-side pagination for regular slots
      setPageHistory(prev => [...prev, pageData.startCursor || '']);
      setCurrentPage(prev => prev + 1);
      fetchItems(pageData.endCursor, nameFilter, statsFilter, rarityFilter);
    } else if (currentPage < maxPage) {
      // Client-side pagination for compatibility slots (all data already loaded)
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 0) {
      // Server-side pagination - go back to previous server page
      const previousCursor = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
      fetchItems(previousCursor || undefined, nameFilter, statsFilter, rarityFilter);
    } else if (currentPage > 1) {
      // Client-side pagination - just decrement page counter
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleItemSelect = (item: Item) => {
    onSelect(item);
    onClose();
    // Reset pagination state for next time, but keep filters
    setCurrentPage(1);
    setPageHistory([]);
  };

  const startItem = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, pageData.totalCount);

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-container max-w-2xl">
        <div className="modal-header">
          <h2 className="modal-title">
            {isTalismanMode ? `Select Talisman (Item Level Req ≤ ${holdingItemLevelReq})` : `Select Item for ${formatSlotName(slot)}`}
          </h2>
          <button 
            onClick={onClose} 
            className="modal-close-btn hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {/* Filters */}
        <div className="mb-4 flex gap-2">
          {/* Name Filter */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => handleNameFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Stats Filter */}
          <div className="w-48">
            <select
              value={statsFilter.length === 0 ? '' : statsFilter[0]}
              onChange={(e) => {
                const selectedStat = e.target.value as Stat;
                const newStatsFilter = selectedStat ? [selectedStat] : [];
                onStatsFilterChange(newStatsFilter);
                setCurrentPage(1);
                setPageHistory([]);
                fetchItems(undefined, nameFilter, newStatsFilter, rarityFilter);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Stats</option>
              {Object.values(Stat).map(stat => (
                <option key={stat} value={stat}>
                  {formatStatName(stat)}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div className="w-48">
            <select
              value={rarityFilter.length === 0 ? '' : rarityFilter[0]}
              onChange={(e) => {
                const selectedRarity = e.target.value as ItemRarity;
                const newRarityFilter = selectedRarity ? [selectedRarity] : [];
                onRarityFilterChange(newRarityFilter);
                setCurrentPage(1);
                setPageHistory([]);
                fetchItems(undefined, nameFilter, statsFilter, newRarityFilter);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Rarities</option>
              {Object.values(ItemRarity).map(rarity => (
                <option key={rarity} value={rarity}>
                  {rarity.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              onNameFilterChange('');
              onStatsFilterChange([]);
              onRarityFilterChange([]);
              setCurrentPage(1);
              setPageHistory([]);
              fetchItems(undefined, '', [], []);
            }}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            title="Reset filters"
          >
            Reset
          </button>
        </div>
        
        {/* Items List */}
        <div className="space-y-0.5">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400 text-sm mb-2">Error loading items</p>
              <p className="text-muted text-xs">{error}</p>
            </div>
          ) : pageData.items.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-muted text-sm">No items found</p>
            </div>
          ) : (
            (pageData.items.length > ITEMS_PER_PAGE 
              ? pageData.items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
              : pageData.items
            ).map((item: any) => {
              const isAlreadyEquipped = item.uniqueEquipped && loadoutService.isUniqueItemAlreadyEquippedInLoadout(item.id, loadoutId || undefined);
              const allowedRaces = career ? CAREER_RACE_MAPPING[career] || [] : [];
              const isRaceRestricted = career && item.raceRestriction && item.raceRestriction.length > 0 && 
                                     !item.raceRestriction.some((race: any) => allowedRaces.includes(race));
              const isTalismanAlreadySlotted = isTalismanMode && talismanSlotIndex !== undefined && (
                                             loadoutId
                                               ? loadoutService.isTalismanAlreadySlottedInItemForLoadout(loadoutId, item.id, slot, talismanSlotIndex)
                                               : loadoutService.isTalismanAlreadySlottedInItem(item.id, slot, talismanSlotIndex)
                                           );
              const isDisabled = isAlreadyEquipped || isRaceRestricted || isTalismanAlreadySlotted;
              
              return (
                <Tooltip key={item.id} item={item as Item} isTalismanTooltip={isTalismanMode} loadoutId={effectiveLoadout?.id}>
                  <div
                    className={`border p-1.5 rounded h-12 flex items-center ${
                      isDisabled
                        ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                    } transition-colors`}
                    onClick={() => !isDisabled && handleItemSelect(item as Item)}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <img src={item.iconUrl} alt={item.name} className="w-6 h-6 flex-shrink-0 object-contain rounded" />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className={`font-medium text-xs leading-tight break-words overflow-wrap-anywhere ${isDisabled ? 'text-gray-500 dark:text-gray-400' : ''} ${!isDisabled ? (item.itemSet ? 'item-color-set' :
                          item.rarity === 'MYTHIC' ? 'item-color-mythic' :
                          item.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                          item.rarity === 'RARE' ? 'item-color-rare' :
                          item.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                          item.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : ''}`}>{item.name}</p>
                        <p className={`text-xs leading-tight ${isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-muted'}`}>
                          {isAlreadyEquipped ? 'Already equipped (Unique)' : 
                           isRaceRestricted ? 'Not usable by this race' :
                           isTalismanAlreadySlotted ? 'Already slotted in this item' :
                           isTalismanMode ? formatTalismanStats(item) : formatItemInfo(item)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Tooltip>
              );
            })
          )}
        </div>

        {/* Loading/Pagination Footer */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 min-h-[2rem]">
          {loading ? (
            <p className="text-secondary text-sm">Loading items...</p>
          ) : pageData.totalCount > ITEMS_PER_PAGE ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted">
                {startItem}-{endItem} of {pageData.totalCount}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 && pageHistory.length === 0}
                  className="btn btn-primary btn-sm"
                >
                  Prev
                </button>
                
                <span className="text-xs text-muted px-1">
                  {currentPage}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={!pageData.hasNextPage && currentPage >= Math.ceil(pageData.items.length / ITEMS_PER_PAGE)}
                  className="btn btn-primary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
