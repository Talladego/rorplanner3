/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { EquipSlot, Item, Stat } from '../types';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { loadoutService } from '../services/loadoutService';
import { formatSlotName, formatStatName } from '../utils/formatters';
import Tooltip from './Tooltip';
import { getItemColor } from '../utils/rarityColors';

interface EquipmentSelectorProps {
  slot: EquipSlot;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  isTalismanMode?: boolean;
  holdingItemLevelReq?: number;
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

export default function EquipmentSelector({ slot, isOpen, onClose, onSelect, isTalismanMode = false, holdingItemLevelReq }: EquipmentSelectorProps) {
  const { currentLoadout } = useLoadoutData();
  const career = currentLoadout?.career;
  const modalRef = useRef<HTMLDivElement>(null);
  
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
  const [nameFilter, setNameFilter] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [statsFilter, setStatsFilter] = useState<Stat[]>([]);

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
  const fetchItems = async (after?: string, filter?: string, stats?: Stat[]) => {
    if (isTalismanMode) {
      if (!holdingItemLevelReq) return;
    } else {
      if (!career || !currentLoadout) return;
    }

    setLoading(true);
    setError(null);

    try {
      let connection;
      
      if (isTalismanMode) {
        connection = await loadoutService.getTalismansForItemLevel(
          holdingItemLevelReq!,
          ITEMS_PER_PAGE,
          after,
          filter,
          stats
        );
      } else {
        connection = await loadoutService.getItemsForSlot(
          slot,
          career || undefined,
          ITEMS_PER_PAGE,
          after,
          currentLoadout!.level,
          currentLoadout!.renownRank,
          filter,
          stats
        );
      }

      // Apply client-side level/renown filtering for career queries
      // since the usableByCareer filter doesn't handle level/renown requirements
      let filteredNodes = connection.nodes || [];
      if (career && !isTalismanMode && currentLoadout) {
        filteredNodes = filteredNodes.filter((item: any) => {
          // Allow items that meet the character's current level/renown requirements
          // or items with no requirements
          const levelOk = !item.levelRequirement || item.levelRequirement <= currentLoadout!.level;
          const renownOk = !item.renownRankRequirement || item.renownRankRequirement <= currentLoadout!.renownRank;
          return levelOk && renownOk;
        });
      }

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
  };

  // Reset when modal opens
  useEffect(() => {
    if (isOpen && career) {
      setCurrentPage(1);
      setPageHistory([]);
      setNameFilter('');
      setStatsFilter([]);
      fetchItems(undefined, '', []); // Explicitly no cursor for first page
    }
  }, [isOpen, career, slot]);

  const handleNameFilterChange = (value: string) => {
    setNameFilter(value);
    
    // Debounce the filter to avoid too many API calls
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setPageHistory([]);
      fetchItems(undefined, value, statsFilter);
    }, 300);
    
    setDebounceTimer(timer);
  };

  if (!isOpen) return null;

  const handleNextPage = () => {
    if (pageData.hasNextPage && pageData.endCursor) {
      setPageHistory(prev => [...prev, pageData.startCursor || '']);
      setCurrentPage(prev => prev + 1);
      fetchItems(pageData.endCursor, nameFilter, statsFilter);
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 0) {
      const previousCursor = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
      fetchItems(previousCursor || undefined, nameFilter, statsFilter);
    } else {
      // Go to first page - don't pass any cursor
      setCurrentPage(1);
      fetchItems(undefined, nameFilter, statsFilter);
    }
  };

  const handleItemSelect = (item: Item) => {
    onSelect(item);
    onClose();
    // Reset state for next time
    setCurrentPage(1);
    setPageHistory([]);
    setNameFilter('');
    setStatsFilter([]);
  };

  const startItem = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, pageData.totalCount);

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-container max-w-2xl">
        <div className="modal-header">
          <h2 className="modal-title">
            {isTalismanMode ? `Select Talisman (Level ${holdingItemLevelReq})` : `Select Item for ${formatSlotName(slot)}`}
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
                setStatsFilter(newStatsFilter);
                setCurrentPage(1);
                setPageHistory([]);
                fetchItems(undefined, nameFilter, newStatsFilter);
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
        </div>
        
        {error && <p className="text-red-600 dark:text-red-400">Error loading items: {error}</p>}
        
        {/* Items List */}
        <div className="space-y-0.5">
          {pageData.items.map((item: any) => (
            <Tooltip key={item.id} item={item as Item}>
              <div
                className="border border-gray-300 dark:border-gray-600 p-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors h-12 flex items-center"
                onClick={() => handleItemSelect(item as Item)}
              >
                <div className="flex items-center space-x-2 w-full">
                  <img src={item.iconUrl} alt={item.name} className="w-6 h-6 flex-shrink-0 object-contain rounded" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-medium text-xs leading-tight break-words overflow-wrap-anywhere" style={{ color: getItemColor(item) }}>{item.name}</p>
                    <p className="text-xs text-muted leading-tight">Lv.{item.levelRequirement} Rn.{item.renownRankRequirement}</p>
                  </div>
                </div>
              </div>
            </Tooltip>
          ))}
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
                  disabled={!pageData.hasNextPage}
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
