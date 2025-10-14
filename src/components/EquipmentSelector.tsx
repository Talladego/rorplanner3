/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { EquipSlot, Item, Stat, CAREER_RACE_MAPPING, Career, ItemRarity } from '../types';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { loadoutService } from '../services/loadoutService';
import { formatSlotName, formatStatName, formatItemTypeName, formatStatValue, isPercentItemStat, normalizeStatDisplayValue, formatCareerName, formatRarityName } from '../utils/formatters';
import { getCareerIconUrl } from '../constants/careerIcons';
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
  const isPct = isPercentItemStat(primaryStat.stat, primaryStat.percentage);
  const normalized = isPct ? primaryStat.value : normalizeStatDisplayValue(primaryStat.stat, primaryStat.value);
  const value = formatStatValue(normalized, isPct);
  const statName = formatStatName(primaryStat.stat);
  
  return `${value} ${statName}`;
}

// Render item meta info; if filteredStats provided, show matching stats in a brighter style
function renderItemInfo(item: any, filteredStats?: Stat[]): React.ReactNode {
  const typeName = formatItemTypeName(item.type);
  const slotName = formatSlotName(item.slot);
  const base = `${typeName}, ${slotName}, Item Level: ${item.itemLevel}`;
  if (!filteredStats || filteredStats.length === 0) return base;
  const lines = (item.stats || []).filter((s: any) => s && filteredStats.includes(s.stat as Stat));
  if (lines.length === 0) return base;
  const rendered = lines.map((line: any) => {
    const isPct = isPercentItemStat(line.stat, line.percentage);
    const normalized = isPct ? line.value : normalizeStatDisplayValue(line.stat, line.value);
    const value = formatStatValue(normalized, isPct);
    const statName = formatStatName(line.stat);
    return `${value} ${statName}`;
  }).join(' / ');
  return (
    <>
      {base}, <span className="text-gray-900 dark:text-gray-100 font-medium">{rendered}</span>
    </>
  );
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
  const careerButtonRef = useRef<HTMLButtonElement>(null);
  const careerPortalRef = useRef<HTMLDivElement>(null);
  
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
  const allowedStatOptions = loadoutService.getAllowedFilterStats();

  // Local filters: clearable Career and Slot (equipment only)
  const [careerFilter, setCareerFilter] = useState<Career | ''>(selectedCareer || '');
  const [slotFilter, setSlotFilter] = useState<EquipSlot | ''>(slot || '');
  const wasOpenRef = useRef<boolean>(false);
  const [isCareerOpen, setIsCareerOpen] = useState(false);
  const careerSelectRef = useRef<HTMLDivElement>(null);
  const [isRarityOpen, setIsRarityOpen] = useState(false);
  const raritySelectRef = useRef<HTMLDivElement>(null);
  const rarityButtonRef = useRef<HTMLButtonElement>(null);
  const rarityPortalRef = useRef<HTMLDivElement>(null);
  const [isSlotOpen, setIsSlotOpen] = useState(false);
  const slotSelectRef = useRef<HTMLDivElement>(null);
  const slotButtonRef = useRef<HTMLButtonElement>(null);
  const slotPortalRef = useRef<HTMLDivElement>(null);

  // Equipment-capable slots for UI (exclude NONE, EVENT, STANDARD, EITHER_HAND)
  const EQUIPMENT_SLOTS: EquipSlot[] = [
    EquipSlot.MAIN_HAND,
    EquipSlot.OFF_HAND,
    EquipSlot.RANGED_WEAPON,
    EquipSlot.HELM,
    EquipSlot.SHOULDER,
    EquipSlot.BODY,
    EquipSlot.GLOVES,
    EquipSlot.BOOTS,
    EquipSlot.BACK,
    EquipSlot.BELT,
    EquipSlot.JEWELLERY1,
    EquipSlot.JEWELLERY2,
    EquipSlot.JEWELLERY3,
    EquipSlot.JEWELLERY4,
    EquipSlot.POCKET1,
    EquipSlot.POCKET2,
  ];

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // If click is inside the portal dropdown, ignore
      if (careerPortalRef.current && careerPortalRef.current.contains(target)) return;
      if (rarityPortalRef.current && rarityPortalRef.current.contains(target)) return;
      if (slotPortalRef.current && slotPortalRef.current.contains(target)) return;
      // Otherwise, close modal when clicking outside modal container
      if (modalRef.current && !modalRef.current.contains(target)) {
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

  // Close dropdowns on outside click (but allow clicks inside the portal containers)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (careerPortalRef.current && careerPortalRef.current.contains(target)) return;
      if (rarityPortalRef.current && rarityPortalRef.current.contains(target)) return;
      if (slotPortalRef.current && slotPortalRef.current.contains(target)) return;
      if (careerSelectRef.current && !careerSelectRef.current.contains(target)) {
        setIsCareerOpen(false);
      }
      if (raritySelectRef.current && !raritySelectRef.current.contains(target)) {
        setIsRarityOpen(false);
      }
      if (slotSelectRef.current && !slotSelectRef.current.contains(target)) {
        setIsSlotOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Compute and store portal dropdown position
  const [careerDropdownStyle, setCareerDropdownStyle] = useState<React.CSSProperties | null>(null);
  const computeCareerDropdownPosition = useCallback(() => {
    const btn = careerButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const belowSpace = viewportH - rect.bottom - 8; // px margin
    const aboveSpace = rect.top - 8;
    const desiredHeight = 240; // roughly 10 items
    let style: React.CSSProperties = {
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      zIndex: 60,
      maxHeight: Math.max(120, Math.min(desiredHeight, belowSpace))
    };
    // Flip if not enough space below
    if (belowSpace < 160 && aboveSpace > belowSpace) {
      style = {
        ...style,
        bottom: Math.round(viewportH - rect.top),
        maxHeight: Math.max(120, Math.min(desiredHeight, aboveSpace))
      };
    } else {
      style = {
        ...style,
        top: Math.round(rect.bottom)
      };
    }
    setCareerDropdownStyle(style);
  }, []);

  // Recompute on open/resize/scroll
  useEffect(() => {
    if (!isCareerOpen) return;
    computeCareerDropdownPosition();
    const onRescroll = () => computeCareerDropdownPosition();
    window.addEventListener('resize', onRescroll);
    window.addEventListener('scroll', onRescroll, true);
    return () => {
      window.removeEventListener('resize', onRescroll);
      window.removeEventListener('scroll', onRescroll, true);
    };
  }, [isCareerOpen, computeCareerDropdownPosition]);

  // Rarity dropdown positioning
  const [rarityDropdownStyle, setRarityDropdownStyle] = useState<React.CSSProperties | null>(null);
  const computeRarityDropdownPosition = useCallback(() => {
    const btn = rarityButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const belowSpace = viewportH - rect.bottom - 8;
    const aboveSpace = rect.top - 8;
    const desiredHeight = 240;
    let style: React.CSSProperties = {
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      zIndex: 60,
      maxHeight: Math.max(120, Math.min(desiredHeight, belowSpace))
    };
    if (belowSpace < 160 && aboveSpace > belowSpace) {
      style = { ...style, bottom: Math.round(viewportH - rect.top), maxHeight: Math.max(120, Math.min(desiredHeight, aboveSpace)) };
    } else {
      style = { ...style, top: Math.round(rect.bottom) };
    }
    setRarityDropdownStyle(style);
  }, []);

  useEffect(() => {
    if (!isRarityOpen) return;
    computeRarityDropdownPosition();
    const onRescroll = () => computeRarityDropdownPosition();
    window.addEventListener('resize', onRescroll);
    window.addEventListener('scroll', onRescroll, true);
    return () => {
      window.removeEventListener('resize', onRescroll);
      window.removeEventListener('scroll', onRescroll, true);
    };
  }, [isRarityOpen, computeRarityDropdownPosition]);

  // Slot dropdown positioning
  const [slotDropdownStyle, setSlotDropdownStyle] = useState<React.CSSProperties | null>(null);
  const computeSlotDropdownPosition = useCallback(() => {
    const btn = slotButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const belowSpace = viewportH - rect.bottom - 8;
    const aboveSpace = rect.top - 8;
    const desiredHeight = 240;
    let style: React.CSSProperties = {
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      zIndex: 60,
      maxHeight: Math.max(120, Math.min(desiredHeight, belowSpace))
    };
    if (belowSpace < 160 && aboveSpace > belowSpace) {
      style = { ...style, bottom: Math.round(viewportH - rect.top), maxHeight: Math.max(120, Math.min(desiredHeight, aboveSpace)) };
    } else {
      style = { ...style, top: Math.round(rect.bottom) };
    }
    setSlotDropdownStyle(style);
  }, []);

  useEffect(() => {
    if (!isSlotOpen) return;
    computeSlotDropdownPosition();
    const onRescroll = () => computeSlotDropdownPosition();
    window.addEventListener('resize', onRescroll);
    window.addEventListener('scroll', onRescroll, true);
    return () => {
      window.removeEventListener('resize', onRescroll);
      window.removeEventListener('scroll', onRescroll, true);
    };
  }, [isSlotOpen, computeSlotDropdownPosition]);

  // Fetch items for current page
  const fetchItems = useCallback(async (
    after?: string,
    filter?: string,
    stats?: Stat[],
    rarities?: ItemRarity[],
    overrideCareer?: Career | '',
    overrideSlot?: EquipSlot | '',
    beforeCursor?: string,
    isBackwards?: boolean
  ) => {
    if (isTalismanMode) {
      if (!holdingItemLevelReq) return;
    } else {
      if (!effectiveLoadout) return;
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
          isBackwards ? undefined : after,
          filter,
          stats,
          rarities,
          isBackwards ? (beforeCursor ?? undefined) : undefined,
          isBackwards ? ITEMS_PER_PAGE : undefined
        );
      } else {
        connection = await loadoutService.getItemsForSlot(
          ((overrideSlot ?? slotFilter) === '' ? null : (overrideSlot ?? slotFilter)) as EquipSlot | null,
          ((overrideCareer ?? careerFilter) || undefined) as Career | undefined,
          ITEMS_PER_PAGE,
          isBackwards ? undefined : after,
          effectiveLoadout?.level || 40,
          effectiveLoadout?.renownRank || 80,
          filter,
          stats,
          rarities,
          isBackwards ? (beforeCursor ?? undefined) : undefined,
          isBackwards ? ITEMS_PER_PAGE : undefined
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
  }, [isTalismanMode, holdingItemLevelReq, effectiveLoadout, slot, careerFilter, slotFilter]);

  // Initialize only when modal transitions from closed->open, avoiding resets on other updates
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const currentContext = { isTalismanMode, career: career || null };
      setCurrentPage(1);
      setPageHistory([]);
      setPageData({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
      prevContextRef.current = currentContext;
      const initCareer = selectedCareer || '';
  // If current slot is a trophy, default filter to Any Slot (empty) since trophies are not selectable in filter
  const isTrophySlot = [EquipSlot.TROPHY1, EquipSlot.TROPHY2, EquipSlot.TROPHY3, EquipSlot.TROPHY4, EquipSlot.TROPHY5].includes(slot);
  const initSlot = (slot === EquipSlot.NONE || isTrophySlot ? '' : slot) || '';
      setCareerFilter(initCareer);
      setSlotFilter(initSlot);
      if (isTalismanMode || effectiveLoadout) {
        fetchItems(undefined, nameFilter, statsFilter, rarityFilter, initCareer, initSlot);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, isTalismanMode, career, effectiveLoadout, nameFilter, statsFilter, rarityFilter, fetchItems, selectedCareer, slot]);

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
    if (pageData.startCursor) {
      // Use backward pagination via before/startCursor and last
      setPageHistory(prev => (prev.length > 0 ? prev.slice(0, -1) : prev));
      setCurrentPage(prev => Math.max(1, prev - 1));
      fetchItems(undefined, nameFilter, statsFilter, rarityFilter, undefined, undefined, pageData.startCursor, true);
    } else if (currentPage > 1) {
      // Client-side fallback
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
            {isTalismanMode ? `Select Talisman for ${formatSlotName(slot)}` : `Select Item for ${formatSlotName(slot)}`}
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="modal-close-btn hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        
    {/* Filters: Career/Slot row above, then Name/Rarity/Stat/Reset in talisman grid below. */}
    {!isTalismanMode && (
      <div className="mb-1 flex gap-1 items-center">
        <div ref={careerSelectRef} className="w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0">
          {/* ...Career dropdown button code... */}
          <button
            type="button"
            ref={careerButtonRef}
            onClick={() => setIsCareerOpen(o => !o)}
            className="w-full py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 flex items-center gap-2 min-w-0"
            aria-haspopup="listbox"
            aria-expanded={isCareerOpen}
          >
            <>
              {careerFilter && <img src={getCareerIconUrl(careerFilter as Career)} alt="" className="w-5 h-5" />}
              <span className={`truncate flex-1 min-w-0 text-left ${careerFilter ? '' : 'text-muted'}`}>
                {careerFilter ? formatCareerName(careerFilter as Career) : 'Any Career'}
              </span>
            </>
            <span className="ml-auto">▾</span>
          </button>
          {isCareerOpen && careerDropdownStyle && createPortal(
            <div
              ref={careerPortalRef}
              role="listbox"
              className="z-[60] fixed border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100 overflow-auto"
              style={careerDropdownStyle}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  setCareerFilter('');
                  setIsCareerOpen(false);
                  setCurrentPage(1);
                  setPageHistory([]);
                  fetchItems(undefined, nameFilter, statsFilter, rarityFilter, '', slotFilter);
                }}
              >
                Any Career
              </button>
              {Object.values(Career).map(c => (
                <button
                  key={c}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => {
                    setCareerFilter(c);
                    setIsCareerOpen(false);
                    setCurrentPage(1);
                    setPageHistory([]);
                    fetchItems(undefined, nameFilter, statsFilter, rarityFilter, c, slotFilter);
                  }}
                >
                  <img src={getCareerIconUrl(c as Career)} alt="" className="w-5 h-5" />
                  <span>{formatCareerName(c as Career)}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
        <div ref={slotSelectRef} className="w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0 relative">
          {/* ...Slot dropdown button code... */}
          <button
            type="button"
            ref={slotButtonRef}
            onClick={() => setIsSlotOpen(o => !o)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 min-w-0"
            aria-haspopup="listbox"
            aria-expanded={isSlotOpen}
          >
            <span className={`truncate flex-1 min-w-0 text-left ${slotFilter ? '' : 'text-muted'}`}>
              {slotFilter ? formatSlotName(slotFilter as EquipSlot) : 'Any Slot'}
            </span>
            <span className="ml-auto">▾</span>
          </button>
          {isSlotOpen && slotDropdownStyle && createPortal(
            <div
              ref={slotPortalRef}
              role="listbox"
              className="z-[60] fixed border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100 overflow-auto"
              style={slotDropdownStyle}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  const val = '' as EquipSlot | '';
                  setSlotFilter(val);
                  setIsSlotOpen(false);
                  setCurrentPage(1);
                  setPageHistory([]);
                  fetchItems(undefined, nameFilter, statsFilter, rarityFilter, careerFilter, val);
                }}
              >
                Any Slot
              </button>
              {EQUIPMENT_SLOTS.map(s => (
                <button
                  key={s}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    const val = s as EquipSlot;
                    setSlotFilter(val);
                    setIsSlotOpen(false);
                    setCurrentPage(1);
                    setPageHistory([]);
                    fetchItems(undefined, nameFilter, statsFilter, rarityFilter, careerFilter, val);
                  }}
                >
                  {formatSlotName(s as EquipSlot)}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
        <span className="italic text-xs text-secondary ml-2 truncate" title={'If items are missing for the selected career select "Any Career" and filter the item by name'}>
          If items are missing for the selected career select "Any Career" and filter the item by name
        </span>
      </div>
    )}
    {/* Second row: Name/Rarity/Stat/Reset, always talisman grid */}
    <div className={`mb-2 grid grid-cols-[minmax(0,1fr)_10rem_10rem_5.5rem] gap-1`}>
      {/* Name */}
      <div className={`col-[1/2] w-full min-w-0 max-w-full`}>
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(e) => handleNameFilterChange(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Rarity */}
      <div ref={raritySelectRef} className={`col-[2/3] w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0`}>
        {/* ...rarity dropdown button code... */}
        <button
          type="button"
          ref={rarityButtonRef}
          onClick={() => setIsRarityOpen(o => !o)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 min-w-0"
          aria-haspopup="listbox"
          aria-expanded={isRarityOpen}
        >
          <span className={`truncate flex-1 min-w-0 text-left ${rarityFilter.length ? '' : 'text-muted'}`}>
            {rarityFilter.length ? formatRarityName(rarityFilter[0]) : 'All Rarities'}
          </span>
          <span className="ml-auto">▾</span>
        </button>
        {isRarityOpen && rarityDropdownStyle && createPortal(
          <div
            ref={rarityPortalRef}
            role="listbox"
            className="z-[60] fixed border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100 overflow-auto"
            style={rarityDropdownStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onRarityFilterChange([]);
                setIsRarityOpen(false);
                setCurrentPage(1);
                setPageHistory([]);
                fetchItems(undefined, nameFilter, statsFilter, []);
              }}
            >
              All Rarities
            </button>
            {Object.values(ItemRarity).map(rarity => (
              <button
                key={rarity}
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  const newRarityFilter = [rarity as ItemRarity];
                  onRarityFilterChange(newRarityFilter);
                  setIsRarityOpen(false);
                  setCurrentPage(1);
                  setPageHistory([]);
                  fetchItems(undefined, nameFilter, statsFilter, newRarityFilter);
                }}
              >
                {formatRarityName(rarity as ItemRarity)}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
      {/* Stat */}
      <div className={`col-[3/4] w-[10rem] min-w-[10rem] max-w-[10rem] shrink-0`}>
        <select
              value={statsFilter[0] ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value as Stat | '';
                const normalized = val && allowedStatOptions.includes(val as Stat) ? [val as Stat] : [];
                onStatsFilterChange(normalized);
                setCurrentPage(1);
                setPageHistory([]);
                fetchItems(undefined, nameFilter, normalized, rarityFilter);
              }}
              size={1}
              className={`w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
          onClick={() => {
            onNameFilterChange('');
            onStatsFilterChange([]);
            onRarityFilterChange([]);
            const resetCareer = selectedCareer || '';
            const resetIsTrophy = [EquipSlot.TROPHY1, EquipSlot.TROPHY2, EquipSlot.TROPHY3, EquipSlot.TROPHY4, EquipSlot.TROPHY5].includes(slot);
            const resetSlot = (slot === EquipSlot.NONE || resetIsTrophy ? '' : slot) || '';
            setCareerFilter(resetCareer);
            setSlotFilter(resetSlot);
            setCurrentPage(1);
            setPageHistory([]);
            fetchItems(undefined, '', [], [], resetCareer, resetSlot as EquipSlot | '');
          }}
          className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full"
          title="Reset filters"
        >
          Reset
        </button>
      </div>
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
              // Always enforce eligibility against the loadout's career (not the filter)
              const eligibilityCareer = (career || '') as Career | '';
              const allowedRaces = eligibilityCareer ? CAREER_RACE_MAPPING[eligibilityCareer as Career] || [] : [];
              const isRaceRestricted = !!eligibilityCareer && item.raceRestriction && item.raceRestriction.length > 0 && 
                                     !item.raceRestriction.some((race: any) => allowedRaces.includes(race));
              // Career restriction check against the loadout career
              const isCareerRestricted = !!eligibilityCareer && item.careerRestriction && item.careerRestriction.length > 0 &&
                                        !item.careerRestriction.includes(eligibilityCareer);
              // Slot compatibility relative to the target slot for this selector
              const isSlotIncompatible = !isTalismanMode && (() => {
                const targetSlot = slot;
                if (targetSlot === EquipSlot.POCKET1 || targetSlot === EquipSlot.POCKET2) {
                  return !(item.slot === EquipSlot.POCKET1 || item.slot === EquipSlot.POCKET2);
                }
                if (targetSlot === EquipSlot.MAIN_HAND) {
                  return !(item.slot === EquipSlot.MAIN_HAND || item.slot === EquipSlot.EITHER_HAND);
                }
                if (targetSlot === EquipSlot.OFF_HAND) {
                  return !(item.slot === EquipSlot.OFF_HAND || item.slot === EquipSlot.EITHER_HAND);
                }
                if (targetSlot === EquipSlot.JEWELLERY2 || targetSlot === EquipSlot.JEWELLERY3 || targetSlot === EquipSlot.JEWELLERY4) {
                  return !(item.slot === targetSlot || item.slot === EquipSlot.JEWELLERY1);
                }
                return item.slot !== targetSlot;
              })();
              const isTalismanAlreadySlotted = isTalismanMode && talismanSlotIndex !== undefined && (
                                             loadoutId
                                               ? loadoutService.isTalismanAlreadySlottedInItemForLoadout(loadoutId, item.id, slot, talismanSlotIndex)
                                               : loadoutService.isTalismanAlreadySlottedInItem(item.id, slot, talismanSlotIndex)
                                           );
              const isDisabled = isAlreadyEquipped || isCareerRestricted || isRaceRestricted || isTalismanAlreadySlotted || isSlotIncompatible;
              
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
                           isCareerRestricted ? 'Not usable by this career' :
                           isRaceRestricted ? 'Not usable by this race' :
                           isSlotIncompatible ? 'Not compatible with this slot' :
                           isTalismanAlreadySlotted ? 'Already slotted in this item' :
                  (isTalismanMode ? formatTalismanStats(item) : renderItemInfo(item, statsFilter))}
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
                  disabled={!pageData.hasPreviousPage && currentPage === 1 && pageHistory.length === 0}
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
