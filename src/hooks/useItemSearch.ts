/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Career, EquipSlot, Item, ItemRarity, Stat } from '../types';
import { loadoutService } from '../services/loadout/loadoutService';

import { DEFAULT_PAGE_SIZE } from '../constants/ui';

export interface PageData {
  items: Item[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
}

export interface UseItemSearchParams {
  isOpen: boolean;
  isTalismanMode: boolean;
  slot: EquipSlot;
  holdingItemLevelReq?: number;
  effectiveLevel?: number;
  effectiveRenown?: number;
  career: Career | '';
  enableCareerFilter: boolean;
  nameFilter: string;
  statsFilter: Stat[];
  rarityFilter: ItemRarity[];
  pageSize?: number;
}

export function useItemSearch({
  isOpen,
  isTalismanMode,
  slot,
  holdingItemLevelReq,
  effectiveLevel = 40,
  effectiveRenown = 80,
  career,
  enableCareerFilter,
  nameFilter,
  statsFilter,
  rarityFilter,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseItemSearchParams) {
  const [pageData, setPageData] = useState<PageData>({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const wasOpenRef = useRef<boolean>(false);

  const fetchItems = useCallback(async (
    after?: string,
    filter?: string,
    stats?: Stat[],
    rarities?: ItemRarity[],
    beforeCursor?: string,
    isBackwards?: boolean,
    careerFilterEnabledOverride?: boolean
  ) => {
    if (isTalismanMode) {
      if (!holdingItemLevelReq) return;
    }

    setLoading(true);
    setError(null);
    try {
      let connection: any;
      if (isTalismanMode) {
        connection = await loadoutService.getTalismansForSlot(
          slot,
          holdingItemLevelReq!,
          pageSize,
          isBackwards ? undefined : after,
          filter,
          stats,
          rarities,
          isBackwards ? (beforeCursor ?? undefined) : undefined,
          isBackwards ? pageSize : undefined
        );
      } else {
        const careerFilterEnabled = careerFilterEnabledOverride ?? enableCareerFilter;
        const careerParam = careerFilterEnabled ? ((career || undefined) as Career | undefined) : undefined;
        connection = await loadoutService.getItemsForSlot(
          slot as EquipSlot,
          careerParam,
          pageSize,
          isBackwards ? undefined : after,
          effectiveLevel,
          effectiveRenown,
          filter,
          stats,
          rarities,
          isBackwards ? (beforeCursor ?? undefined) : undefined,
          isBackwards ? pageSize : undefined
        );
      }

      const nodes = connection.nodes || [];
      setPageData({
        items: nodes,
        hasNextPage: connection.pageInfo?.hasNextPage || false,
        hasPreviousPage: connection.pageInfo?.hasPreviousPage || false,
        startCursor: connection.pageInfo?.startCursor || null,
        endCursor: connection.pageInfo?.endCursor || null,
        totalCount: connection.totalCount || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setPageData({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [isTalismanMode, holdingItemLevelReq, enableCareerFilter, slot, career, effectiveLevel, effectiveRenown, pageSize]);

  const refetch = useCallback((filter?: string, stats?: Stat[], rarities?: ItemRarity[], careerFilterEnabledOverride?: boolean) => {
    setCurrentPage(1);
    setPageHistory([]);
    fetchItems(undefined, filter ?? nameFilter, stats ?? statsFilter, rarities ?? rarityFilter, undefined, undefined, careerFilterEnabledOverride);
  }, [fetchItems, nameFilter, statsFilter, rarityFilter]);

  const nextPage = useCallback(() => {
    if (pageData.hasNextPage && pageData.endCursor) {
      setPageHistory(prev => [...prev, pageData.startCursor || '']);
      setCurrentPage(prev => prev + 1);
      fetchItems(pageData.endCursor, nameFilter, statsFilter, rarityFilter);
    }
  }, [pageData, fetchItems, nameFilter, statsFilter, rarityFilter]);

  const prevPage = useCallback(() => {
    if (pageData.startCursor) {
      setPageHistory(prev => (prev.length > 0 ? prev.slice(0, -1) : prev));
      setCurrentPage(prev => Math.max(1, prev - 1));
      fetchItems(undefined, nameFilter, statsFilter, rarityFilter, pageData.startCursor, true);
    }
  }, [pageData, fetchItems, nameFilter, statsFilter, rarityFilter]);

  // Initialize when modal opens (transition closed -> open)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setCurrentPage(1);
      setPageHistory([]);
      setPageData({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
      fetchItems(undefined, nameFilter, statsFilter, rarityFilter);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, fetchItems, nameFilter, statsFilter, rarityFilter]);

  // When pageSize changes while open, reset pagination and refetch with new limit
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPage(1);
    setPageHistory([]);
    setPageData({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
    fetchItems(undefined, nameFilter, statsFilter, rarityFilter);
  }, [pageSize, isOpen, fetchItems, nameFilter, statsFilter, rarityFilter]);

  return {
    pageData,
    loading,
    error,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    refetch,
    pageHistory,
    setPageHistory,
    ITEMS_PER_PAGE: pageSize,
  } as const;
}
