import { useState, useEffect, useRef } from 'react';
import { EquipSlot, Item, Stat, Career, ItemRarity } from '../../types';
import { useLoadoutData } from '../../hooks/useLoadoutData';
import { loadoutService } from '../../services/loadout/loadoutService';
import { formatSlotName } from '../../utils/formatters';
import { useLoadoutById } from '../../hooks/useLoadoutById';
import { useItemSearch } from '../../hooks/useItemSearch';
import FilterControls from './FilterControls';
import ResultsList from './ResultsList';
import PaginationControls from './PaginationControls';
import HoverTooltip from '../tooltip/HoverTooltip';

interface EquipmentSelectorProps {
  slot: EquipSlot;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  isTalismanMode?: boolean;
  holdingItemLevelReq?: number;
  talismanSlotIndex?: number;
  loadoutId?: string | null;
  nameFilter: string;
  statsFilter: Stat[];
  rarityFilter: ItemRarity[];
  onNameFilterChange: (value: string) => void;
  onStatsFilterChange: (value: Stat[]) => void;
  onRarityFilterChange: (value: ItemRarity[]) => void;
  selectedCareer: Career | '';
}

const ITEMS_PER_PAGE = 10;

export default function EquipmentSelector({ slot, isOpen, onClose, onSelect, isTalismanMode = false, holdingItemLevelReq, talismanSlotIndex, loadoutId = null, nameFilter, statsFilter, rarityFilter, onNameFilterChange, onStatsFilterChange, onRarityFilterChange, selectedCareer }: EquipmentSelectorProps) {
  const { currentLoadout } = useLoadoutData();
  const { loadout: explicitLoadout } = useLoadoutById(loadoutId ?? null);
  const effectiveLoadout = loadoutId ? explicitLoadout : currentLoadout;
  const career = selectedCareer;
  const modalRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const allowedStatOptions = loadoutService.getAllowedFilterStats();
  const wasOpenRef = useRef<boolean>(false);
  const [enableCareerFilter, setEnableCareerFilter] = useState<boolean>(true);

  const {
    pageData,
    loading,
    error,
    refetch,
    nextPage,
    prevPage,
    setCurrentPage: setHookCurrentPage,
    setPageHistory: setHookPageHistory,
  } = useItemSearch({
    isOpen,
    isTalismanMode: !!isTalismanMode,
    slot,
    holdingItemLevelReq,
    effectiveLevel: effectiveLoadout?.level || 40,
    effectiveRenown: effectiveLoadout?.renownRank || 80,
    career: career || '',
    enableCareerFilter,
    nameFilter,
    statsFilter,
    rarityFilter,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
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

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setCurrentPage(1);
      setPageHistory([]);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleNameFilterChange = (value: string) => {
    onNameFilterChange(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setPageHistory([]);
      setHookCurrentPage(1);
      setHookPageHistory([]);
      refetch(value, statsFilter, rarityFilter);
    }, 300);
    setDebounceTimer(timer);
  };

  if (!isOpen) return null;

  const handleNextPage = () => {
    const maxPage = Math.ceil(pageData.items.length / ITEMS_PER_PAGE);
    if (pageData.hasNextPage && pageData.endCursor) {
      setPageHistory(prev => [...prev, pageData.startCursor || '']);
      setCurrentPage(prev => prev + 1);
      nextPage();
    } else if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageData.startCursor) {
      setPageHistory(prev => (prev.length > 0 ? prev.slice(0, -1) : prev));
      setCurrentPage(prev => Math.max(1, prev - 1));
      prevPage();
    } else if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleItemSelect = (item: Item) => {
    onSelect(item);
    onClose();
    setCurrentPage(1);
    setPageHistory([]);
  };

  return (
    <div className="modal-overlay">
      {/* Tier 1 (blue frame) inside modal; modal-as-panel strips default modal chrome */}
      <div ref={modalRef} className="modal-container modal-as-panel max-w-2xl">
        <div className="panel-container panel-border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="panel-heading mb-0">
              {isTalismanMode ? `Select Talisman for ${formatSlotName(slot)}` : `Select Item for ${formatSlotName(slot)}`}
            </h2>
            <div className="flex items-center gap-3">
              {!isTalismanMode && (
                <div className="inline-flex items-center gap-2 text-xs select-none text-gray-900 dark:text-gray-100">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-3 w-3"
                      checked={enableCareerFilter}
                      onChange={(e) => {
                        const val = e.currentTarget.checked;
                        setEnableCareerFilter(val);
                        setCurrentPage(1);
                        setPageHistory([]);
                        setHookCurrentPage(1);
                        setHookPageHistory([]);
                        refetch(nameFilter, statsFilter, rarityFilter, val);
                      }}
                    />
                    Enable Career Filter
                  </label>
                  <HoverTooltip content={`Filters results to items usable by the selected career. Turn OFF to find server-side anomalies or items that should be usable but are hidden by the API. Tip: Use OFF when searching by exact name to verify availability.`}>
                    <span className="cursor-help text-muted">ⓘ</span>
                  </HoverTooltip>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="modal-close-btn hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          {/* Tier 2 dashed container holds filters, list, and pagination */}
          <div className="field-group">
            <FilterControls
              nameFilter={nameFilter}
              onNameChange={(value) => handleNameFilterChange(value)}
              rarityFilter={rarityFilter}
              onRarityChange={(newRarityFilter) => {
                onRarityFilterChange(newRarityFilter);
                setCurrentPage(1);
                setPageHistory([]);
                setHookCurrentPage(1);
                setHookPageHistory([]);
                refetch(nameFilter, statsFilter, newRarityFilter);
              }}
              statsFilter={statsFilter}
              onStatsChange={(normalized) => {
                onStatsFilterChange(normalized);
                setCurrentPage(1);
                setPageHistory([]);
                setHookCurrentPage(1);
                setHookPageHistory([]);
                refetch(nameFilter, normalized, rarityFilter);
              }}
              allowedStatOptions={allowedStatOptions}
              onReset={() => {
                onNameFilterChange('');
                onStatsFilterChange([]);
                onRarityFilterChange([]);
                setEnableCareerFilter(true);
                setCurrentPage(1);
                setPageHistory([]);
                setHookCurrentPage(1);
                setHookPageHistory([]);
                refetch('', [], [], true);
              }}
            />

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
              <ResultsList
                items={pageData.items.length > ITEMS_PER_PAGE 
                  ? pageData.items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  : pageData.items}
                isTalismanMode={!!isTalismanMode}
                loadoutId={loadoutId}
                slot={slot}
                career={career}
                talismanSlotIndex={talismanSlotIndex}
                onSelect={handleItemSelect}
                effectiveLoadoutId={effectiveLoadout?.id}
                statsFilter={statsFilter}
              />
            )}

            <PaginationControls
              loading={loading}
              totalCount={pageData.totalCount}
              currentPage={currentPage}
              pageSize={ITEMS_PER_PAGE}
              hasNextPage={pageData.hasNextPage}
              hasPreviousPage={pageData.hasPreviousPage}
              pageHistoryLength={pageHistory.length}
              onPrev={handlePreviousPage}
              onNext={handleNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
