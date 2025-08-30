/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { EquipSlot, Item } from '../types';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { loadoutService } from '../services/loadoutService';
import { formatSlotName } from '../utils/formatters';
import Tooltip from './Tooltip';

interface EquipmentSelectorProps {
  slot: EquipSlot;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
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

export default function EquipmentSelector({ slot, isOpen, onClose, onSelect }: EquipmentSelectorProps) {
  const { currentLoadout } = useLoadoutData();
  const career = currentLoadout?.career;
  
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

  // Fetch items for current page
  const fetchItems = async (after?: string) => {
    if (!career || !currentLoadout) return;

    setLoading(true);
    setError(null);

    try {
      const connection = await loadoutService.getItemsForSlot(
        slot, 
        career, 
        ITEMS_PER_PAGE, 
        after,
        currentLoadout.level,
        currentLoadout.renownRank
      );
      
      setPageData({
        items: connection.nodes || [],
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
      fetchItems(undefined); // Explicitly no cursor for first page
    }
  }, [isOpen, career, slot]);

  if (!isOpen) return null;

  const handleNextPage = () => {
    if (pageData.hasNextPage && pageData.endCursor) {
      setPageHistory(prev => [...prev, pageData.startCursor || '']);
      setCurrentPage(prev => prev + 1);
      fetchItems(pageData.endCursor);
    }
  };

  const handlePreviousPage = () => {
    if (pageHistory.length > 0) {
      const previousCursor = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
      fetchItems(previousCursor || undefined);
    } else {
      // Go to first page - don't pass any cursor
      setCurrentPage(1);
      fetchItems(undefined);
    }
  };

  const handleItemSelect = (item: Item) => {
    onSelect(item);
    onClose();
    // Reset state for next time
    setCurrentPage(1);
    setPageHistory([]);
  };

  const startItem = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, pageData.totalCount);

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-2xl max-h-[90vh] overflow-hidden" style={{ maxHeight: '90vh', overflow: 'hidden' }}>
        <div className="modal-header">
          <h2 className="modal-title">Select Item for {formatSlotName(slot)}</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>
        {loading && <p className="text-secondary">Loading items...</p>}
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
                    <p className="font-medium text-xs text-primary truncate leading-tight">{item.name}</p>
                    <p className="text-xs text-secondary line-clamp-1 leading-tight overflow-hidden">{item.description}</p>
                    <p className="text-xs text-muted leading-tight">Lv.{item.levelRequirement} Rn.{item.renownRankRequirement}</p>
                  </div>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>

        {/* Pagination */}
        {pageData.totalCount > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
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
        )}
      </div>
    </div>
  );
}
