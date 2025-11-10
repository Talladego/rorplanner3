/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Career, EquipSlot, Item, ItemRarity, Stat } from '../types';
// loadoutService no longer needed after hook-based refactor
import { GetPocketItemsDocument, GetTalismansDocument, type GetPocketItemsQueryVariables, type GetTalismansQueryVariables, type GetPocketItemsQuery, type GetTalismansQuery } from '../generated/graphql';
import { useLazyQuery } from '@apollo/client/react';

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
  const requestSeqRef = useRef(0);

  const isAbortError = (err: unknown) => {
    const anyErr = err as any;
    const name = anyErr?.name || anyErr?.networkError?.name || anyErr?.cause?.name;
    const message: string | undefined = anyErr?.message || anyErr?.networkError?.message;
    return name === 'AbortError' || (typeof message === 'string' && /aborted/i.test(message));
  };

  // Lazily execute queries using generated typed documents
  const [runPocketQuery] = useLazyQuery<GetPocketItemsQuery, GetPocketItemsQueryVariables>(GetPocketItemsDocument, { fetchPolicy: 'cache-first' });
  const [runTalismanQuery] = useLazyQuery<GetTalismansQuery, GetTalismansQueryVariables>(GetTalismansDocument, { fetchPolicy: 'cache-first' });

  const fetchItems = useCallback(async (
    after?: string,
    filter?: string,
    stats?: Stat[],
    rarities?: ItemRarity[],
    beforeCursor?: string,
    isBackwards?: boolean,
    careerFilterEnabledOverride?: boolean
  ) => {
    if (isTalismanMode && !holdingItemLevelReq) return;
    const reqId = ++requestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      if (isTalismanMode) {
        const vars: GetTalismansQueryVariables = {
          first: isBackwards ? undefined : pageSize,
          after: isBackwards ? undefined : after,
          last: isBackwards ? pageSize : undefined,
          before: isBackwards ? beforeCursor : undefined,
          hasStats: stats && stats.length ? stats : undefined,
          where: {
            type: { eq: 'ENHANCEMENT' },
            levelRequirement: { lte: holdingItemLevelReq! },
            name: { contains: filter || '' },
            // Talismans are enhancements and are not filtered by gear equip slot
            ...(rarities && rarities.length ? { rarity: { in: rarities } } : {}),
          } as any,
        };
  const { data } = await runTalismanQuery({ variables: vars });
        // Drop stale responses
        if (reqId !== requestSeqRef.current) return;
        const conn = data?.items;
        setPageData({
          items: (conn?.nodes as Item[]) || [],
          hasNextPage: !!conn?.pageInfo.hasNextPage,
          hasPreviousPage: !!conn?.pageInfo.hasPreviousPage,
          startCursor: conn?.pageInfo.startCursor || null,
          endCursor: conn?.pageInfo.endCursor || null,
          totalCount: conn?.totalCount || 0,
        });
      } else {
        const careerFilterEnabled = careerFilterEnabledOverride ?? enableCareerFilter;
        const careerParam = careerFilterEnabled ? ((career || undefined) as Career | undefined) : undefined;
        const vars: GetPocketItemsQueryVariables = {
          first: isBackwards ? undefined : pageSize,
            after: isBackwards ? undefined : after,
          last: isBackwards ? pageSize : undefined,
          before: isBackwards ? beforeCursor : undefined,
          hasStats: stats && stats.length ? stats : undefined,
          usableByCareer: careerParam,
          where: {
            levelRequirement: { lte: effectiveLevel },
            renownRankRequirement: { lte: effectiveRenown },
            name: { contains: filter || '' },
            ...(slot !== EquipSlot.POCKET1 && slot !== EquipSlot.POCKET2 ? { type: { neq: 'NONE' } } : {}),
            slot: (slot == null || slot === EquipSlot.NONE)
              ? { in: [
                EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.RANGED_WEAPON, EquipSlot.EITHER_HAND,
                EquipSlot.HELM, EquipSlot.SHOULDER, EquipSlot.BODY, EquipSlot.GLOVES, EquipSlot.BOOTS, EquipSlot.BACK,
                EquipSlot.BELT, EquipSlot.JEWELLERY1, EquipSlot.JEWELLERY2, EquipSlot.JEWELLERY3, EquipSlot.JEWELLERY4,
                EquipSlot.POCKET1, EquipSlot.POCKET2,
              ] }
              : (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2)
                ? { in: [EquipSlot.POCKET1, EquipSlot.POCKET2] }
                : (slot === EquipSlot.MAIN_HAND || slot === EquipSlot.OFF_HAND)
                  ? { in: [slot, EquipSlot.EITHER_HAND] }
                  : (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4)
                    ? { in: [slot, EquipSlot.JEWELLERY1] }
                    : { eq: slot },
            ...(rarities && rarities.length ? { rarity: { in: rarities } } : {}),
          } as any,
        };
  const { data } = await runPocketQuery({ variables: vars });
        if (reqId !== requestSeqRef.current) return;
        const conn = data?.items;
        setPageData({
          items: (conn?.nodes as Item[]) || [],
          hasNextPage: !!conn?.pageInfo.hasNextPage,
          hasPreviousPage: !!conn?.pageInfo.hasPreviousPage,
          startCursor: conn?.pageInfo.startCursor || null,
          endCursor: conn?.pageInfo.endCursor || null,
          totalCount: conn?.totalCount || 0,
        });
      }
    } catch (err) {
      if (isAbortError(err)) {
        // Ignore aborted requests (from rapid refetches or unmounts)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
        setPageData({ items: [], hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null, totalCount: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [isTalismanMode, holdingItemLevelReq, enableCareerFilter, slot, career, effectiveLevel, effectiveRenown, pageSize, runPocketQuery, runTalismanQuery]);

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
