/* eslint-disable @typescript-eslint/no-explicit-any */
import client from '../../lib/apollo-client';
import { EquipSlot, Item, Career, Stat, ItemRarity } from '../../types';
import { SEARCH_CHARACTERS, GET_CHARACTER, GET_POCKET_ITEMS, GET_TALISMANS } from './queries';
import { gql } from '@apollo/client';
import { makeListKey, getFromListCache, setInListCache, warmIconCacheFromConnection } from './cache';

/**
 * Search for characters by name.
 * Returns the raw Apollo query data; caller extracts edges/nodes.
 */
export async function searchCharactersByName(name: string) {
  const { data } = await client.query({ query: SEARCH_CHARACTERS, variables: { name } });
  return data;
}

/** Fetch a character by id; returns raw Apollo data. */
export async function getCharacterById(id: string) {
  const { data } = await client.query({ query: GET_CHARACTER, variables: { id } });
  return data;
}

/**
 * Fetch a paginated list of items for a slot with filters. Uses LRU cache and prefetches next page.
 */
export async function getItemsForSlotApi(
  slot: EquipSlot | null,
  career: Career | undefined,
  limit: number,
  after: string | undefined,
  levelRequirement: number,
  renownRankRequirement: number,
  nameFilter?: string,
  hasStats?: Stat[],
  hasRarities?: ItemRarity[],
  before?: string,
  last?: number,
): Promise<any> {
  let query = GET_POCKET_ITEMS;
  const variables: any = {
    first: limit,
    after: after || undefined,
    hasStats,
    usableByCareer: career,
  };

  if (before) {
    variables.before = before;
    variables.last = last ?? limit;
    delete variables.first;
    delete variables.after;
  }

  const where: any = {
    levelRequirement: { lte: levelRequirement },
    renownRankRequirement: { lte: renownRankRequirement },
    name: { contains: nameFilter || '' }
  };

  if (slot !== EquipSlot.POCKET1 && slot !== EquipSlot.POCKET2) {
    where.type = { neq: 'NONE' };
  }

  if (slot == null || slot === EquipSlot.NONE) {
    where.slot = {
      in: [
        EquipSlot.MAIN_HAND,
        EquipSlot.OFF_HAND,
        EquipSlot.RANGED_WEAPON,
        EquipSlot.EITHER_HAND,
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
      ]
    };
  } else if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
    where.slot = { in: [EquipSlot.POCKET1, EquipSlot.POCKET2] };
  } else if (slot === EquipSlot.MAIN_HAND || slot === EquipSlot.OFF_HAND) {
    where.slot = { in: [slot, EquipSlot.EITHER_HAND] };
  } else if (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4) {
    where.slot = { in: [slot, EquipSlot.JEWELLERY1] };
  } else {
    where.slot = { eq: slot };
  }

  if (hasRarities && hasRarities.length > 0) {
    where.rarity = { in: hasRarities };
  }

  variables.where = where;
  if (career) variables.usableByCareer = career;

  const key = makeListKey('items', variables);
  const cached = getFromListCache(key);
  if (cached) return cached;

  const { data } = await client.query({ query, variables });
  const connection = (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
  setInListCache(key, connection);
  warmIconCacheFromConnection(connection);

  const endCursor = connection?.pageInfo?.endCursor;
  const hasNext = connection?.pageInfo?.hasNextPage;
  if (endCursor && hasNext) {
    const nextVars = { ...variables, after: endCursor };
    delete (nextVars as any).before; delete (nextVars as any).last;
    const nextKey = makeListKey('items', nextVars);
    if (!getFromListCache(nextKey)) {
      client.query({ query, variables: nextVars }).then(({ data }) => {
        const nextConn = (data as any).items || null;
        if (nextConn) { setInListCache(nextKey, nextConn); warmIconCacheFromConnection(nextConn); }
      }).catch(() => {});
    }
  }
  return connection;
}

export async function getTalismansForSlotApi(
  slot: EquipSlot,
  levelRequirement: number,
  limit: number,
  after?: string,
  nameFilter?: string,
  hasStats?: Stat[],
  hasRarities?: ItemRarity[],
  before?: string,
  last?: number,
): Promise<any> {
  const variables: any = {
    first: limit,
    after: after || undefined,
  };

  if (before) {
    variables.before = before;
    variables.last = last ?? limit;
    delete variables.first;
    delete variables.after;
  }

  if (hasStats && hasStats.length > 0) variables.hasStats = hasStats;

  const where: any = {
    type: { eq: 'ENHANCEMENT' },
    levelRequirement: { lte: levelRequirement },
    name: { contains: nameFilter || '' },
  };

  if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
    where.slot = { in: [EquipSlot.POCKET1, EquipSlot.POCKET2] };
  } else {
    where.slot = { eq: slot };
  }

  if (hasRarities && hasRarities.length > 0) where.rarity = { in: hasRarities };
  variables.where = where;

  const key = makeListKey('talismans', variables);
  const cached = getFromListCache(key);
  if (cached) return cached;

  const { data } = await client.query({ query: GET_TALISMANS, variables });
  const connection = (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
  setInListCache(key, connection);
  warmIconCacheFromConnection(connection);

  const endCursor = connection?.pageInfo?.endCursor;
  const hasNext = connection?.pageInfo?.hasNextPage;
  if (endCursor && hasNext) {
    const nextVars = { ...variables, after: endCursor };
    delete (nextVars as any).before; delete (nextVars as any).last;
    const nextKey = makeListKey('talismans', nextVars);
    if (!getFromListCache(nextKey)) {
      client.query({ query: GET_TALISMANS, variables: nextVars }).then(({ data }) => {
        const nextConn = (data as any).items || null;
        if (nextConn) { setInListCache(nextKey, nextConn); warmIconCacheFromConnection(nextConn); }
      }).catch(() => {});
    }
  }
  return connection;
}

/**
 * Fetch talismans (type ENHANCEMENT) whose levelRequirement <= holding item's level.
 * Mirrors legacy service behavior. LRU cached and prefetches next page.
 */
export async function getTalismansForItemLevelApi(
  holdingLevelRequirement: number,
  limit: number = 50,
  after?: string,
  nameFilter?: string,
  hasStats?: Stat[],
  hasRarities?: ItemRarity[],
  before?: string,
  last?: number,
): Promise<any> {
  const variables: any = {
    first: limit,
  };

  if (after) variables.after = after;
  if (before) {
    variables.before = before;
    variables.last = last ?? limit;
    delete variables.first;
    delete variables.after;
  }

  if (hasStats && hasStats.length > 0) variables.hasStats = hasStats;

  const where: any = {
    type: { eq: 'ENHANCEMENT' },
    levelRequirement: { lte: holdingLevelRequirement },
    name: { contains: nameFilter || '' },
  };

  if (hasRarities && hasRarities.length > 0) where.rarity = { in: hasRarities };
  variables.where = where;

  const key = makeListKey('talismans', variables);
  const cached = getFromListCache(key);
  if (cached) return cached;

  const { data } = await client.query({ query: GET_TALISMANS, variables });
  const connection = (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
  setInListCache(key, connection);
  warmIconCacheFromConnection(connection);

  const endCursor = connection?.pageInfo?.endCursor;
  const hasNext = connection?.pageInfo?.hasNextPage;
  if (endCursor && hasNext) {
    const nextVars = { ...variables, after: endCursor } as any;
    delete nextVars.before; delete nextVars.last;
    const nextKey = makeListKey('talismans', nextVars);
    if (!getFromListCache(nextKey)) {
      client.query({ query: GET_TALISMANS, variables: nextVars }).then(({ data }) => {
        const nextConn = (data as any).items || null;
        if (nextConn) { setInListCache(nextKey, nextConn); warmIconCacheFromConnection(nextConn); }
      }).catch(() => {});
    }
  }
  return connection;
}

/** Fetch full item details by id; relies on Apollo cache-first policy. */
export async function getItemWithDetailsApi(itemId: string): Promise<Item | null> {
  const query = gql`
    query GetItem($id: ID!) {
      item(id: $id) {
        id
        name
        description
        type
        slot
        rarity
        armor
        dps
        speed
        levelRequirement
        renownRankRequirement
        itemLevel
        uniqueEquipped
        stats { stat value percentage }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
        itemSet { id name bonuses { itemsRequired bonus { __typename ... on ItemStat { stat value percentage } ... on Ability { name description } } } }
        abilities { name description }
        buffs { name description }
      }
    }
  `;
  const { data } = await client.query({ query, variables: { id: itemId }, fetchPolicy: 'cache-first' });
  return (data as any).item || null;
}
