/* eslint-disable @typescript-eslint/no-explicit-any */

import { loadoutStoreAdapter } from '../store/loadoutStoreAdapter';
import client from '../lib/apollo-client';
import { gql } from '@apollo/client';
import { EquipSlot, Item, Career, LoadoutItem, Stat, ItemRarity, LoadoutMode, LoadoutSide } from '../types';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { LoadoutEvents, LoadoutEventType } from '../types/events';
import { getItemColor } from '../utils/rarityColors';

const SEARCH_CHARACTERS = gql`
  query GetCharacters($name: String!) {
    characters(where: { name: { eq: $name } }, first: 10) {
      edges {
        node {
          id
          name
          career
          level
          renownRank
        }
      }
    }
  }
`;

const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id
      name
      level
      renownRank
      career
      items {
        equipSlot
        item {
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
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
            bonuses {
              itemsRequired
              bonus {
                ... on ItemStat {
                  stat
                  value
                  percentage
                }
                ... on Ability {
                  name
                  description
                }
              }
            }
          }
          abilities {
            name
          }
          buffs {
            name
          }
        }
        talismans {
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
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
            bonuses {
              itemsRequired
              bonus {
                ... on ItemStat {
                  stat
                  value
                  percentage
                }
                ... on Ability {
                  name
                  description
                }
              }
            }
          }
        }
      }
    }
  }
`;


const GET_POCKET_ITEMS = gql`
  query GetPocketItems($first: Int, $after: String, $hasStats: [Stat!], $usableByCareer: Career, $where: ItemFilterInput) {
    items(
      where: $where,
      hasStats: $hasStats,
      usableByCareer: $usableByCareer,
      first: $first,
      after: $after,
      order: [
        { rarity: DESC },
        { itemLevel: DESC },
        { name: ASC }
      ]
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
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
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
          }
        }
      }
      nodes {
        id
        name
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
        stats {
          stat
          value
          percentage
        }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
        itemSet {
          id
          name
        }
      }
      totalCount
    }
  }
`;

const GET_TALISMANS = gql`
  query GetTalismans($first: Int, $after: String, $hasStats: [Stat!], $where: ItemFilterInput) {
    items(
      where: $where,
      hasStats: $hasStats,
      first: $first,
      after: $after,
      order: [
        { rarity: DESC },
        { itemLevel: DESC },
        { name: ASC }
      ]
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
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
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
          }
        }
      }
      nodes {
        id
        name
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
        stats {
          stat
          value
          percentage
        }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
        itemSet {
          id
          name
        }
      }
      totalCount
    }
  }
`;

export const loadoutService = {
  // Mode management
  getMode(): LoadoutMode {
    return loadoutStoreAdapter.getMode();
  },
  setMode(mode: LoadoutMode) {
    loadoutStoreAdapter.setMode(mode);
    // If entering compare (dual) mode, ensure both sides have loadouts assigned
    if (mode === 'dual') {
      try {
        this.ensureSideLoadout('A');
        this.ensureSideLoadout('B');
      } catch (e) {
        // non-fatal
        console.warn('Failed to ensure side loadouts when entering dual mode:', e);
      }
    }
    loadoutEventEmitter.emit({ type: 'MODE_CHANGED', payload: { mode }, timestamp: Date.now() });
    // Reflect mode in URL
    import('./urlService').then(({ urlService }) => urlService.updateUrlForCurrentLoadout());
  },
  getActiveSide(): LoadoutSide {
    return loadoutStoreAdapter.getActiveSide();
  },
  setActiveSide(side: LoadoutSide) {
    loadoutStoreAdapter.setActiveSide(side);
    loadoutEventEmitter.emit({ type: 'ACTIVE_SIDE_CHANGED', payload: { side }, timestamp: Date.now() });
    // Update URL with new active side
    import('./urlService').then(({ urlService }) => urlService.updateUrlForCurrentLoadout());
  },
  assignSideLoadout(side: LoadoutSide, loadoutId: string | null) {
    // In dual mode, ensure A and B don't point to the same loadout id
    if (this.getMode() === 'dual' && loadoutId) {
      const otherSide: LoadoutSide = side === 'A' ? 'B' : 'A';
      const otherId = loadoutStoreAdapter.getSideLoadoutId(otherSide);
      if (otherId && otherId === loadoutId) {
        // Clone to keep sides independent
        const clonedId = this.cloneLoadout(loadoutId, side === 'A' ? 'Side A' : 'Side B');
        loadoutId = clonedId;
      }
    }
    loadoutStoreAdapter.assignSideLoadout(side, loadoutId);
    // If the assigned loadout has a career, bind per-side per-career mapping as well
    if (loadoutId) {
      const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
      if (lo?.career) {
        loadoutStoreAdapter.setSideCareerLoadoutId(side, lo.career, loadoutId);
      }
    }
    loadoutEventEmitter.emit({ type: 'SIDE_LOADOUT_ASSIGNED', payload: { side, loadoutId }, timestamp: Date.now() });
    // Update URL to include the newly assigned side
    import('./urlService').then(({ urlService }) => urlService.updateUrlForCurrentLoadout());
  },
  getSideLoadoutId(side: LoadoutSide): string | null {
    return loadoutStoreAdapter.getSideLoadoutId(side);
  },
  getLoadoutForSide(side: LoadoutSide) {
    return loadoutStoreAdapter.getLoadoutForSide(side);
  },

  // Ensure a side has a loadout assigned, creating one if necessary
  ensureSideLoadout(side: LoadoutSide): string {
    const assigned = loadoutStoreAdapter.getSideLoadoutId(side);
    if (assigned) {
      // If both sides point to the same id in dual mode, clone to keep them independent
      if (this.getMode() === 'dual') {
        const otherSide: LoadoutSide = side === 'A' ? 'B' : 'A';
        const otherId = loadoutStoreAdapter.getSideLoadoutId(otherSide);
        if (otherId && otherId === assigned) {
          const clonedId = this.cloneLoadout(assigned, side === 'A' ? 'Side A' : 'Side B');
          this.assignSideLoadout(side, clonedId);
          // Preserve per-career mapping if career is set
          const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === clonedId);
          if (lo?.career) {
            loadoutStoreAdapter.setSideCareerLoadoutId(side, lo.career, clonedId);
          }
          return clonedId;
        }
      }
      return assigned;
    }
    const current = loadoutStoreAdapter.getCurrentLoadout();
    const level = current?.level ?? 40;
    const renown = current?.renownRank ?? 80;
    const name = side === 'A' ? 'Side A' : 'Side B';
    const newId = loadoutStoreAdapter.createLoadout(name, level, renown);
    // Use guarded assignment which clones if needed
    this.assignSideLoadout(side, newId);
    loadoutEventEmitter.emit({ type: 'LOADOUT_CREATED', payload: { loadoutId: newId, name }, timestamp: Date.now() });
    loadoutEventEmitter.emit({ type: 'SIDE_LOADOUT_ASSIGNED', payload: { side, loadoutId: newId }, timestamp: Date.now() });
    return newId;
  },

  // Single-mode helper: pick a side to edit, ensure it exists, and switch to it
  async selectSideForEdit(side: LoadoutSide): Promise<string> {
    this.setActiveSide(side);
    const id = this.ensureSideLoadout(side);
    await this.switchLoadout(id);
    return id;
  },
  // LRU cache for item details + in-flight requests to prevent duplicate fetches
  _itemDetailsCache: new Map<string, Item | null>(),
  _itemDetailsInflight: new Map<string, Promise<Item | null>>(),
  _itemDetailsCacheLimit: 200,
  // 1. Load data from named character
  async loadFromNamedCharacter(characterName: string) {
    try {
      const { data } = await client.query({
        query: SEARCH_CHARACTERS,
        variables: { name: characterName },
      });
      const characters = (data as any).characters.edges.map((e: any) => e.node);
      if (characters.length === 0) throw new Error(`Character "${characterName}" not found. Please check the spelling and try again.`);
      const character = characters[0]; // Take the first match
      // Ensure we are operating on the active side for clarity
      const side = this.getActiveSide();
      this.ensureSideLoadout(side);
      // Call import with explicit target side to avoid races
      await this.importFromCharacter(character.id, side);

      // Emit event that character was loaded
      loadoutEventEmitter.emit({
        type: 'CHARACTER_LOADED',
        payload: {
          characterName,
          characterId: character.id,
        },
        timestamp: Date.now(),
      });

      return character.id;
    } catch (error) {
      console.error('Failed to load from named character:', error);
      throw error;
    }
  },

  // 2. Add/update specific item/talisman slots
  // Check if a unique-equipped item is already equipped in a specific loadout
  isUniqueItemAlreadyEquippedInLoadout(itemId: string, loadoutId?: string): boolean {
    const loadout = loadoutId
      ? loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId)
      : loadoutStoreAdapter.getCurrentLoadout();
    if (!loadout) return false;
    for (const slot of Object.values(EquipSlot)) {
      const equippedItem = loadout.items[slot]?.item;
      if (equippedItem && equippedItem.id === itemId && equippedItem.uniqueEquipped) {
        return true;
      }
    }
    return false;
  },

  // Check if equipping this item would violate unique-equipped rules
  canEquipUniqueItem(item: Item, loadoutId?: string): { canEquip: boolean; reason?: string } {
    if (!item.uniqueEquipped) {
      return { canEquip: true };
    }

    // Check if this exact item is already equipped in the target loadout
    if (this.isUniqueItemAlreadyEquippedInLoadout(item.id, loadoutId)) {
      return { canEquip: false, reason: 'This unique item is already equipped' };
    }

    return { canEquip: true };
  },

  async updateItem(slot: EquipSlot, item: Item | null) {
    // Validate unique-equipped constraints
    if (item) {
      const validation = this.canEquipUniqueItem(item);
      if (!validation.canEquip) {
        throw new Error(validation.reason || 'Cannot equip this unique item');
      }
    }

    loadoutStoreAdapter.setItem(slot, item);
    loadoutEventEmitter.emit({
      type: 'ITEM_UPDATED',
      payload: { slot, item },
      timestamp: Date.now(),
    });

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Automatically recalculate stats after item update
    this.getStatsSummary();

    // Update URL with current loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async updateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null) {
    // Validate unique-equipped only within that loadout
    if (item) {
      const validation = this.canEquipUniqueItem(item, loadoutId);
      if (!validation.canEquip) {
        throw new Error(validation.reason || 'Cannot equip this unique item');
      }
    }

    loadoutStoreAdapter.setItemForLoadout(loadoutId, slot, item);
    loadoutEventEmitter.emit({ type: 'ITEM_UPDATED', payload: { slot, item }, timestamp: Date.now() });
    this.getStatsSummary();
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async updateTalisman(slot: EquipSlot, index: number, talisman: Item | null) {
    loadoutStoreAdapter.setTalisman(slot, index, talisman);
    loadoutEventEmitter.emit({
      type: 'TALISMAN_UPDATED',
      payload: { slot, index, talisman },
      timestamp: Date.now(),
    });

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Automatically recalculate stats after talisman update
    this.getStatsSummary();

    // Update URL with current loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async updateTalismanForLoadout(loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null) {
    loadoutStoreAdapter.setTalismanForLoadout(loadoutId, slot, index, talisman);
    loadoutEventEmitter.emit({ type: 'TALISMAN_UPDATED', payload: { slot, index, talisman }, timestamp: Date.now() });
    this.getStatsSummary();
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  // 3. Fetch items for equipment selection
  async getItemsForSlot(slot: EquipSlot, career?: Career, limit: number = 50, after?: string, levelRequirement: number = 40, renownRankRequirement: number = 80, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[]): Promise<any> {
    try {
      // Check if we need compatibility slots
      const needsCompatibility = (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4);

      // Check if we need to include EITHER_HAND items for hand slots
      const needsEitherHand = (slot === EquipSlot.MAIN_HAND || slot === EquipSlot.OFF_HAND);

      if (needsCompatibility) {
        // For compatibility slots, use a higher limit since pagination is disabled
        const compatibilityLimit = Math.max(limit * 5, 50); // At least 50 items or 5x the requested limit

        // Make separate queries for each compatible slot and combine results
        const compatibleSlots: EquipSlot[] = [slot];
        if (slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4) {
          compatibleSlots.push(EquipSlot.JEWELLERY1);
        }

        // Query each slot separately and combine results
        const allResults = [];
        for (const slotToQuery of compatibleSlots) {
          const result = await this.getItemsForSingleSlot(slotToQuery, career, compatibilityLimit, after, levelRequirement, renownRankRequirement, nameFilter, hasStats, hasRarities);
          if (result.edges) {
            allResults.push(...result.edges);
          }
        }

        // Remove duplicates based on item id
        const seenIds = new Set();
        let uniqueEdges = allResults.filter(edge => {
          if (seenIds.has(edge.node.id)) {
            return false;
          }
          seenIds.add(edge.node.id);
          return true;
        });

        // Apply client-side stat filtering if hasStats is provided
        if (hasStats && hasStats.length > 0) {
          uniqueEdges = uniqueEdges.filter((edge: any) => {
            const item = edge.node;
            return item.stats && item.stats.some((stat: any) => hasStats.includes(stat.stat));
          });
        }

        return {
          edges: uniqueEdges,
          nodes: uniqueEdges.map(edge => edge.node),
          pageInfo: { hasNextPage: false, hasPreviousPage: false }, // Simplified for compatibility
          totalCount: uniqueEdges.length
        };
      } else if (needsEitherHand) {
        // For hand slots, include both specific slot and EITHER_HAND items
        const handLimit = Math.max(limit * 2, 50); // At least 50 items or 2x the requested limit

        // Make separate queries for the specific slot and EITHER_HAND, then combine results
        const handSlots: EquipSlot[] = [slot, EquipSlot.EITHER_HAND];

        // Query each slot separately and combine results
        const allResults = [];
        for (const slotToQuery of handSlots) {
          // Ensure rarity filters are respected for hand slots as well
          const result = await this.getItemsForSingleSlot(
            slotToQuery,
            career,
            handLimit,
            after,
            levelRequirement,
            renownRankRequirement,
            nameFilter,
            hasStats,
            hasRarities
          );
          if (result.edges) {
            allResults.push(...result.edges);
          }
        }

        // Remove duplicates based on item id
        const seenIds = new Set();
        let uniqueEdges = allResults.filter(edge => {
          if (seenIds.has(edge.node.id)) {
            return false;
          }
          seenIds.add(edge.node.id);
          return true;
        });

        // Apply client-side stat filtering if hasStats is provided
        if (hasStats && hasStats.length > 0) {
          uniqueEdges = uniqueEdges.filter((edge: any) => {
            const item = edge.node;
            return item.stats && item.stats.some((stat: any) => hasStats.includes(stat.stat));
          });
        }

        // Apply client-side rarity filtering if requested (safety net)
        if (hasRarities && hasRarities.length > 0) {
          uniqueEdges = uniqueEdges.filter((edge: any) => hasRarities.includes(edge.node.rarity));
        }

        // Apply global sorting to match GraphQL query order: rarity DESC, itemLevel DESC, name ASC
        const rarityOrder: Record<string, number> = { MYTHIC: 6, VERY_RARE: 5, RARE: 4, UNCOMMON: 3, COMMON: 2, UTILITY: 1 };
        uniqueEdges.sort((a: any, b: any) => {
          const itemA = a.node;
          const itemB = b.node;
          
          // First sort by rarity DESC
          const rarityDiff = (rarityOrder[itemB.rarity] || 0) - (rarityOrder[itemA.rarity] || 0);
          if (rarityDiff !== 0) return rarityDiff;
          
          // Then sort by itemLevel DESC
          const levelDiff = itemB.itemLevel - itemA.itemLevel;
          if (levelDiff !== 0) return levelDiff;
          
          // Finally sort by name ASC
          return itemA.name.localeCompare(itemB.name);
        });

        return {
          edges: uniqueEdges,
          nodes: uniqueEdges.map(edge => edge.node),
          pageInfo: { hasNextPage: false, hasPreviousPage: false }, // Simplified for compatibility
          totalCount: uniqueEdges.length
        };
      } else {
        // Use the original single-slot query
        const result = await this.getItemsForSingleSlot(slot, career, limit, after, levelRequirement, renownRankRequirement, nameFilter, hasStats, hasRarities);
        
        return result;
      }
    } catch (error) {
      console.error('Failed to fetch items for slot:', error);
      throw error;
    }
  },

  // Helper method for single slot queries
  async getItemsForSingleSlot(slot: EquipSlot, career?: Career, limit: number = 50, after?: string, levelRequirement: number = 40, renownRankRequirement: number = 80, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[]): Promise<any> {
    let query;
    let variables: any = { 
      first: limit
    };

    if (after) {
      variables.after = after;
    }

    if (hasStats && hasStats.length > 0) {
      variables.hasStats = hasStats;
    }

    // Build the where clause dynamically
    const where: any = {
      levelRequirement: { lte: levelRequirement },
      renownRankRequirement: { lte: renownRankRequirement },
      name: { contains: nameFilter || '' }
    };

    // Exclude NONE type items for non-pocket slots
    if (slot !== EquipSlot.POCKET1 && slot !== EquipSlot.POCKET2) {
      where.type = { neq: 'NONE' };
    }

    if (slot === EquipSlot.POCKET1 || slot === EquipSlot.POCKET2) {
      // For pocket items, allow both POCKET1 and POCKET2 slots
      where.slot = { in: [EquipSlot.POCKET1, EquipSlot.POCKET2] };
    } else {
      where.slot = { eq: slot };
    }

    if (hasRarities && hasRarities.length > 0) {
      where.rarity = { in: hasRarities };
    }

    variables.where = where;

    // Use the general query for all items (now supports career filtering)
    query = GET_POCKET_ITEMS;
    if (career) {
      variables.usableByCareer = career;
    }

    const { data } = await client.query({
      query,
      variables,
    });
    
    return (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
  },

  // 3.5. Fetch talismans for holding item's level requirement
  // Rule (from in-game testing): talisman.levelRequirement ≤ holdingItem.levelRequirement
  async getTalismansForItemLevel(holdingLevelRequirement: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[]): Promise<any> {
    try {
      const query = GET_TALISMANS;
      const variables: any = {
        first: limit
      };

      if (after) {
        variables.after = after;
      }

      if (hasStats && hasStats.length > 0) {
        variables.hasStats = hasStats;
      }

      // Build the where clause dynamically
      const where: any = {
        type: { eq: 'ENHANCEMENT' },
        // Apply the correct matching rule against the holding item's level requirement
        levelRequirement: { lte: holdingLevelRequirement },
        name: { contains: nameFilter || '' }
      };

      // Apply rarity filtering only when specified by the user; otherwise include all rarities by default
      if (hasRarities && hasRarities.length > 0) {
        where.rarity = { in: hasRarities };
      }

      variables.where = where;

      const { data } = await client.query({
        query,
        variables,
      });
      
      return (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
    } catch (error) {
      console.error('Failed to fetch talismans for level req:', error);
      throw error;
    }
  },

  // 3.7. Get talismans for a specific slot (no special cases)
  async getTalismansForSlot(_slot: EquipSlot, holdingLevelRequirement: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[]): Promise<any> {
    return await this.getTalismansForItemLevel(holdingLevelRequirement, limit, after, nameFilter, hasStats, hasRarities);
  },

  // Removed legendary talisman special-case as the required info cannot be reliably extracted from the schema

  // 3. Retrieve stats summary
  getStatsSummary() {
    loadoutStoreAdapter.calculateStats();
    const stats = loadoutStoreAdapter.getStatsSummary();
    loadoutEventEmitter.emit({
      type: 'STATS_UPDATED',
      payload: { stats },
      timestamp: Date.now(),
    });
    return stats;
  },

  // Additional utilities
  getCurrentLoadout() {
    return loadoutStoreAdapter.getCurrentLoadout();
  },

  getAllLoadouts() {
    return loadoutStoreAdapter.getLoadouts();
  },

  getCurrentLoadoutId() {
    return loadoutStoreAdapter.getCurrentLoadoutId();
  },

  // Event subscription methods
  subscribeToEvents<T extends LoadoutEvents>(
    eventType: T['type'],
    callback: (event: T) => void
  ) {
    return loadoutEventEmitter.subscribe(eventType, callback);
  },

  subscribeToAllEvents(callback: (event: LoadoutEvents) => void) {
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to all event types
    const eventTypes: LoadoutEventType[] = [
      'ITEM_UPDATED',
      'TALISMAN_UPDATED',
      'CAREER_CHANGED',
      'LEVEL_CHANGED',
      'RENOWN_RANK_CHANGED',
      'STATS_UPDATED',
      'LOADOUT_CREATED',
      'LOADOUT_SWITCHED',
      'LOADOUT_RESET',
      'CHARACTER_LOADED_FROM_URL',
      'LOADOUT_LOADED_FROM_URL',
      'CHARACTER_LOADED',
      'MODE_CHANGED',
      'ACTIVE_SIDE_CHANGED',
      'SIDE_LOADOUT_ASSIGNED',
    ];

    eventTypes.forEach(eventType => {
      unsubscribeFunctions.push(
        loadoutEventEmitter.subscribe(eventType, callback)
      );
    });

    // Return a function that unsubscribes from all events
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  },

  async setCareer(career: Career | null) {
    // Always set on current loadout
    loadoutStoreAdapter.setCareer(career);
    loadoutEventEmitter.emit({
      type: 'CAREER_CHANGED',
      payload: { career },
      timestamp: Date.now(),
    });

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Update per-side per-career mapping for the active side if career provided
    const updated = loadoutStoreAdapter.getCurrentLoadout();
    if (career && updated) {
      loadoutStoreAdapter.setSideCareerLoadoutId(this.getActiveSide(), career, updated.id);
    }

    // Update URL with current loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async setLevel(level: number) {
    // Always set on current loadout
    loadoutStoreAdapter.setLevel(level);
    loadoutEventEmitter.emit({
      type: 'LEVEL_CHANGED',
      payload: { level },
      timestamp: Date.now(),
    });

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Emit stats updated event since level changes affect item eligibility
    this.getStatsSummary();

    // Update URL with current loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async setRenownRank(renownRank: number) {
    // Always set on current loadout
    loadoutStoreAdapter.setRenownRank(renownRank);
    loadoutEventEmitter.emit({
      type: 'RENOWN_RANK_CHANGED',
      payload: { renownRank },
      timestamp: Date.now(),
    });

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Emit stats updated event since renown changes affect item eligibility
    this.getStatsSummary();

    // Update URL with current loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  createLoadout(name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string) {
    const loadoutId = loadoutStoreAdapter.createLoadout(name, level, renownRank, isFromCharacter, characterName);
    loadoutEventEmitter.emit({
      type: 'LOADOUT_CREATED',
      payload: { loadoutId, name },
      timestamp: Date.now(),
    });
    // Recalculate stats for the new loadout
    this.getStatsSummary();
    return loadoutId;
  },

  async switchLoadout(id: string) {
    await loadoutStoreAdapter.switchLoadout(id);
    loadoutEventEmitter.emit({
      type: 'LOADOUT_SWITCHED',
      payload: { loadoutId: id },
      timestamp: Date.now(),
    });
    // If in dual mode and the active side isn't assigned, assign it implicitly to the active side
    if (this.getMode() === 'dual' && this.getSideLoadoutId(this.getActiveSide()) == null) {
      this.assignSideLoadout(this.getActiveSide(), id);
    }
    // Recalculate stats for the new loadout
    this.getStatsSummary();

    // Update URL with the new loadout state
    const { urlService } = await import('./urlService');
    urlService.updateUrlForCurrentLoadout();
  },

  async resetCurrentLoadout() {
    // Reset the current loadout to default state
    const current = loadoutStoreAdapter.getCurrentLoadout();
    if (current) {
      // Use per-loadout reset to also normalize Side A/B names if assigned
      loadoutStoreAdapter.resetLoadoutById(current.id);
    } else {
      loadoutStoreAdapter.resetCurrentLoadout();
    }

    // Clear all loadout parameters from URL
  const { urlService } = await import('./urlService');
  urlService.clearLoadoutFromUrl();

    loadoutEventEmitter.emit({
      type: 'LOADOUT_RESET',
      payload: { loadoutId: 'reset' },
      timestamp: Date.now(),
    });
    // Recalculate stats after reset
    this.getStatsSummary();
  },

  async getOrCreateLoadoutForCareer(career: Career) {
    const activeSide = this.getActiveSide();
    const otherSide: LoadoutSide = activeSide === 'A' ? 'B' : 'A';

    // 1) Check if this side already has a mapped loadout for this career
    let mappedId = loadoutStoreAdapter.getSideCareerLoadoutId(activeSide, career);
    if (mappedId) {
      // If other side is using the same mappedId in dual mode, clone to keep them separate
      const otherMapped = loadoutStoreAdapter.getSideCareerLoadoutId(otherSide, career);
      if (this.getMode() === 'dual' && otherMapped && otherMapped === mappedId) {
        const clonedId = this.cloneLoadout(mappedId, `${career} Loadout (${activeSide})`);
        loadoutStoreAdapter.setSideCareerLoadoutId(activeSide, career, clonedId);
        this.assignSideLoadout(activeSide, clonedId);
        await this.switchLoadout(clonedId);
        return clonedId;
      }
      // Otherwise just switch to it
      this.assignSideLoadout(activeSide, mappedId);
      await this.switchLoadout(mappedId);
      return mappedId;
    }

    // 2) No mapping yet: try to find an existing loadout for this career not used by the other side mapping
    const loadouts = loadoutStoreAdapter.getLoadouts();
    const otherMapped = loadoutStoreAdapter.getSideCareerLoadoutId(otherSide, career);
    const candidate = loadouts.find(l => l.career === career && l.id !== otherMapped);
    if (candidate) {
      mappedId = candidate.id;
      loadoutStoreAdapter.setSideCareerLoadoutId(activeSide, career, mappedId);
      this.assignSideLoadout(activeSide, mappedId);
      await this.switchLoadout(mappedId);
      return mappedId;
    }

    // 3) Create a brand new loadout for this side+career
    const currentLoadout = this.getCurrentLoadout();
    const currentLevel = currentLoadout?.level ?? 40;
    const currentRenown = currentLoadout?.renownRank ?? 80;
    const loadoutName = `${career} Loadout (${activeSide})`;
    const newId = this.createLoadout(loadoutName, currentLevel, currentRenown);
    await this.switchLoadout(newId);
    loadoutStoreAdapter.setCareer(career);
    this.assignSideLoadout(activeSide, newId);
    loadoutStoreAdapter.setSideCareerLoadoutId(activeSide, career, newId);
    return newId;
  },

  // 4. Import character data and create loadout
  async importFromCharacter(characterId: string, side?: LoadoutSide): Promise<string> {
    try {
      const targetSide = side ?? this.getActiveSide();
      const { data } = await client.query({
        query: GET_CHARACTER,
        variables: { id: characterId },
      });
      const character = (data as any).character;
      if (!character) throw new Error('Character not found');

      // Transform character data into loadout format
      const items: Record<EquipSlot, LoadoutItem> = Object.values(EquipSlot).reduce((acc, slot) => {
        acc[slot] = { item: null, talismans: [] };
        return acc;
      }, {} as Record<EquipSlot, LoadoutItem>);

      // Safely iterate over character items if they exist
      if (character.items && Array.isArray(character.items)) {
        character.items.forEach(({ equipSlot, item, talismans }: any) => {
          if (item) {
            items[equipSlot as EquipSlot] = {
              item: {
                id: item.id,
                name: item.name,
                description: item.description,
                type: item.type,
                slot: item.slot,
                rarity: item.rarity,
                armor: item.armor,
                dps: item.dps,
                speed: item.speed,
                levelRequirement: item.levelRequirement,
                renownRankRequirement: item.renownRankRequirement,
                itemLevel: item.itemLevel,
                uniqueEquipped: item.uniqueEquipped,
                stats: item.stats ? item.stats.map((s: any) => ({ stat: s.stat, value: s.value, percentage: s.percentage })) : [],
                careerRestriction: item.careerRestriction,
                raceRestriction: item.raceRestriction,
                iconUrl: item.iconUrl,
                talismanSlots: item.talismanSlots,
                itemSet: item.itemSet,
                abilities: item.abilities,
                buffs: item.buffs,
              },
              talismans: talismans && Array.isArray(talismans) ? talismans.map((t: any) => t ? {
                id: t.id,
                name: t.name,
                description: t.description,
                type: t.type,
                slot: t.slot,
                rarity: t.rarity,
                armor: t.armor,
                dps: t.dps,
                speed: t.speed,
                levelRequirement: t.levelRequirement,
                renownRankRequirement: t.renownRankRequirement,
                itemLevel: t.itemLevel,
                uniqueEquipped: t.uniqueEquipped,
                stats: t.stats ? t.stats.map((s: any) => ({ stat: s.stat, value: s.value, percentage: s.percentage })) : [],
                careerRestriction: t.careerRestriction,
                raceRestriction: t.raceRestriction,
                iconUrl: t.iconUrl,
                talismanSlots: t.talismanSlots,
                itemSet: t.itemSet,
                abilities: t.abilities || [],
                buffs: t.buffs || [],
              } : null) : [],
            };
          }
        });
      }

      // Create the loadout using the service (this emits LOADOUT_CREATED event)
  const loadoutId = loadoutService.createLoadout(`Imported from ${character.name}`, character.level, character.renownRank, true, character.name);
  // Assign it to the captured side mapping (single or dual)
  this.assignSideLoadout(targetSide, loadoutId);
    loadoutService.switchLoadout(loadoutId);
    loadoutService.setCareer(character.career);
      // Level and renown already set in createLoadout

      // Set all the items
      Object.entries(items).forEach(([slot, loadoutItem]) => {
        loadoutService.updateItem(slot as EquipSlot, loadoutItem.item);
        // Safely iterate over talismans if they exist
        if (loadoutItem.talismans && Array.isArray(loadoutItem.talismans)) {
          loadoutItem.talismans.forEach((talisman, index) => {
            if (talisman) {
              loadoutService.updateTalisman(slot as EquipSlot, index, talisman);
            }
          });
        }
      });

      // Stats will be recalculated automatically by the updateItem/updateTalisman methods
      // No need to call getStatsSummary() again since it's called in those methods

      // Reset the loadout to character state and update URL
  loadoutStoreAdapter.updateLoadoutCharacterStatus(loadoutId, true, character.name);
  const { urlService } = await import('./urlService');
  urlService.updateUrlForCurrentLoadout();

      // Ensure side+career mapping aligns with the captured side
      loadoutStoreAdapter.setSideCareerLoadoutId(targetSide, character.career, loadoutId);
      return loadoutId;
    } catch (error) {
      console.error('Failed to import character:', error);
      throw error;
    }
  },

  // Initialize stats on service load
  initializeStats() {
    this.getStatsSummary();
  },

  // Clone an existing loadout to a new id, deep copying items/talismans
  cloneLoadout(sourceId: string, name?: string): string {
    const all = loadoutStoreAdapter.getLoadouts();
    const src = all.find(l => l.id === sourceId);
    if (!src) throw new Error('Source loadout not found');
    const newName = name || `${src.name} (Copy)`;
    const newId = loadoutStoreAdapter.createLoadout(newName, src.level, src.renownRank, src.isFromCharacter, src.characterName);
    // Copy career
    if (src.career) {
      loadoutStoreAdapter.setCareerForLoadout(newId, src.career);
    }
    // Copy items and talismans
    Object.entries(src.items).forEach(([slot, data]) => {
      loadoutStoreAdapter.setItemForLoadout(newId, slot as EquipSlot, data.item);
      if (data.talismans && data.talismans.length > 0) {
        data.talismans.forEach((t, idx) => {
          loadoutStoreAdapter.setTalismanForLoadout(newId, slot as EquipSlot, idx, t);
        });
      }
    });
    // Emit creation event already done by createLoadout; URL will be updated by caller if needed
    return newId;
  },

  // Per-loadout setters (used for URL-driven compare loads)
  setCareerForLoadout(loadoutId: string, career: Career | null) {
    loadoutStoreAdapter.setCareerForLoadout(loadoutId, career);
    loadoutEventEmitter.emit({ type: 'CAREER_CHANGED', payload: { career }, timestamp: Date.now() });
  },
  setLevelForLoadout(loadoutId: string, level: number) {
    loadoutStoreAdapter.setLevelForLoadout(loadoutId, level);
    loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level }, timestamp: Date.now() });
  },
  setRenownForLoadout(loadoutId: string, renownRank: number) {
    loadoutStoreAdapter.setRenownForLoadout(loadoutId, renownRank);
    loadoutEventEmitter.emit({ type: 'RENOWN_RANK_CHANGED', payload: { renownRank }, timestamp: Date.now() });
  },
  setLoadoutNameForLoadout(loadoutId: string, name: string) {
    loadoutStoreAdapter.setLoadoutNameForLoadout(loadoutId, name);
    // No specific event type for name changes; reuse LOADOUT_SWITCHED to trigger subscribers to refresh labels
    loadoutEventEmitter.emit({ type: 'LOADOUT_SWITCHED', payload: { loadoutId }, timestamp: Date.now() });
  },

  // Compute stats for a specific loadout id without mutating state or emitting events
  computeStatsForLoadout(loadoutId: string): import('../types').StatsSummary {
    const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
    if (!loadout) {
      return {
        strength: 0, agility: 0, willpower: 0, toughness: 0, wounds: 0, initiative: 0,
        weaponSkill: 0, ballisticSkill: 0, intelligence: 0, spiritResistance: 0, elementalResistance: 0, corporealResistance: 0,
        incomingDamage: 0, incomingDamagePercent: 0, outgoingDamage: 0, outgoingDamagePercent: 0,
        armor: 0, velocity: 0, block: 0, parry: 0, evade: 0, disrupt: 0, actionPointRegen: 0, moraleRegen: 0,
        cooldown: 0, buildTime: 0, criticalDamage: 0, range: 0, autoAttackSpeed: 0, meleePower: 0, rangedPower: 0, magicPower: 0,
        meleeCritRate: 0, rangedCritRate: 0, magicCritRate: 0, armorPenetration: 0, healingPower: 0, healthRegen: 0, maxActionPoints: 0, fortitude: 0,
        armorPenetrationReduction: 0, criticalHitRateReduction: 0, blockStrikethrough: 0, parryStrikethrough: 0, evadeStrikethrough: 0, disruptStrikethrough: 0,
        healCritRate: 0, mastery1Bonus: 0, mastery2Bonus: 0, mastery3Bonus: 0, outgoingHealPercent: 0, incomingHealPercent: 0,
      };
    }

    const stats: import('../types').StatsSummary = {
      strength: 0, agility: 0, willpower: 0, toughness: 0, wounds: 0, initiative: 0,
      weaponSkill: 0, ballisticSkill: 0, intelligence: 0, spiritResistance: 0, elementalResistance: 0, corporealResistance: 0,
      incomingDamage: 0, incomingDamagePercent: 0, outgoingDamage: 0, outgoingDamagePercent: 0,
      armor: 0, velocity: 0, block: 0, parry: 0, evade: 0, disrupt: 0, actionPointRegen: 0, moraleRegen: 0,
      cooldown: 0, buildTime: 0, criticalDamage: 0, range: 0, autoAttackSpeed: 0, meleePower: 0, rangedPower: 0, magicPower: 0,
      meleeCritRate: 0, rangedCritRate: 0, magicCritRate: 0, armorPenetration: 0, healingPower: 0, healthRegen: 0, maxActionPoints: 0, fortitude: 0,
      armorPenetrationReduction: 0, criticalHitRateReduction: 0, blockStrikethrough: 0, parryStrikethrough: 0, evadeStrikethrough: 0, disruptStrikethrough: 0,
      healCritRate: 0, mastery1Bonus: 0, mastery2Bonus: 0, mastery3Bonus: 0, outgoingHealPercent: 0, incomingHealPercent: 0,
    };

    const isItemEligible = (item: import('../types').Item | null): boolean => {
      if (!item) return true;
      const levelEligible = !item.levelRequirement || item.levelRequirement <= loadout.level;
      const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= loadout.renownRank;
      return levelEligible && renownEligible;
    };

    const mapStatToKey = (stat: string): keyof import('../types').StatsSummary | null => {
      const statMap: Record<string, keyof import('../types').StatsSummary> = {
        'STRENGTH': 'strength', 'AGILITY': 'agility', 'WILLPOWER': 'willpower', 'TOUGHNESS': 'toughness', 'WOUNDS': 'wounds', 'INITIATIVE': 'initiative',
        'WEAPON_SKILL': 'weaponSkill', 'BALLISTIC_SKILL': 'ballisticSkill', 'INTELLIGENCE': 'intelligence',
        'SPIRIT_RESISTANCE': 'spiritResistance', 'ELEMENTAL_RESISTANCE': 'elementalResistance', 'CORPOREAL_RESISTANCE': 'corporealResistance',
        'INCOMING_DAMAGE': 'incomingDamage', 'INCOMING_DAMAGE_PERCENT': 'incomingDamagePercent', 'OUTGOING_DAMAGE': 'outgoingDamage', 'OUTGOING_DAMAGE_PERCENT': 'outgoingDamagePercent',
        'ARMOR': 'armor', 'VELOCITY': 'velocity', 'BLOCK': 'block', 'PARRY': 'parry', 'EVADE': 'evade', 'DISRUPT': 'disrupt',
        'ACTION_POINT_REGEN': 'actionPointRegen', 'MORALE_REGEN': 'moraleRegen', 'COOLDOWN': 'cooldown', 'BUILD_TIME': 'buildTime', 'CRITICAL_DAMAGE': 'criticalDamage', 'RANGE': 'range', 'AUTO_ATTACK_SPEED': 'autoAttackSpeed',
        'MELEE_POWER': 'meleePower', 'RANGED_POWER': 'rangedPower', 'MAGIC_POWER': 'magicPower', 'MELEE_CRIT_RATE': 'meleeCritRate', 'RANGED_CRIT_RATE': 'rangedCritRate', 'MAGIC_CRIT_RATE': 'magicCritRate',
        'ARMOR_PENETRATION': 'armorPenetration', 'HEALING_POWER': 'healingPower', 'HEALTH_REGEN': 'healthRegen', 'MAX_ACTION_POINTS': 'maxActionPoints', 'FORTITUDE': 'fortitude',
        'ARMOR_PENETRATION_REDUCTION': 'armorPenetrationReduction', 'CRITICAL_HIT_RATE_REDUCTION': 'criticalHitRateReduction', 'BLOCK_STRIKETHROUGH': 'blockStrikethrough', 'PARRY_STRIKETHROUGH': 'parryStrikethrough', 'EVADE_STRIKETHROUGH': 'evadeStrikethrough', 'DISRUPT_STRIKETHROUGH': 'disruptStrikethrough',
        'HEAL_CRIT_RATE': 'healCritRate', 'MASTERY_1_BONUS': 'mastery1Bonus', 'MASTERY_2_BONUS': 'mastery2Bonus', 'MASTERY_3_BONUS': 'mastery3Bonus', 'OUTGOING_HEAL_PERCENT': 'outgoingHealPercent', 'INCOMING_HEAL_PERCENT': 'incomingHealPercent',
      };
      return statMap[stat] || null;
    };

    const setItems: Record<string, { item: import('../types').Item; set: import('../types').ItemSet }[]> = {};

    Object.values(loadout.items).forEach(({ item, talismans }) => {
      if (item && isItemEligible(item)) {
        if (item.armor && item.armor > 0) {
          stats.armor += Number(item.armor);
        }
        if (item.stats) {
          item.stats.forEach(({ stat, value }) => {
            const key = mapStatToKey(stat);
            if (key && stats[key] !== undefined) {
              stats[key] += Number(value);
            }
          });
        }
        if (item.itemSet) {
          const setName = item.itemSet.name;
          if (!setItems[setName]) setItems[setName] = [];
          setItems[setName].push({ item, set: item.itemSet });
        }
        if (talismans && Array.isArray(talismans)) {
          talismans.forEach((talisman) => {
            if (talisman && isItemEligible(talisman)) {
              if (talisman.armor && talisman.armor > 0) {
                stats.armor += Number(talisman.armor);
              }
              if (talisman.stats) {
                talisman.stats.forEach(({ stat, value }) => {
                  const key = mapStatToKey(stat);
                  if (key && stats[key] !== undefined) {
                    stats[key] += Number(value);
                  }
                });
              }
            }
          });
        }
      }
    });

    Object.values(setItems).forEach((items) => {
      if (items.length > 0 && items[0].set.bonuses) {
        const setBonuses = items[0].set.bonuses;
        setBonuses.forEach((setBonus: any) => {
          if (items.length >= setBonus.itemsRequired) {
            if ('stat' in setBonus.bonus) {
              const key = mapStatToKey(setBonus.bonus.stat);
              if (key && stats[key] !== undefined) {
                const bonusValue = Number(setBonus.bonus.value);
                if (!isNaN(bonusValue)) {
                  stats[key] += bonusValue;
                }
              }
            }
          }
        });
      }
    });

    return stats;
  },

  // Get detailed contributions for a given StatsSummary key for a specific loadout id (used by compare panel)
  getStatContributionsForLoadout(loadoutId: string, statKey: keyof import('../types').StatsSummary | string): Array<{ name: string; count: number; totalValue: number; percentage: boolean; color?: string }> {
    const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
    if (!loadout) return [];

    const keyToEnum: Record<string, string> = {
      strength: 'STRENGTH', agility: 'AGILITY', willpower: 'WILLPOWER', toughness: 'TOUGHNESS', wounds: 'WOUNDS', initiative: 'INITIATIVE', weaponSkill: 'WEAPON_SKILL', ballisticSkill: 'BALLISTIC_SKILL', intelligence: 'INTELLIGENCE',
      spiritResistance: 'SPIRIT_RESISTANCE', elementalResistance: 'ELEMENTAL_RESISTANCE', corporealResistance: 'CORPOREAL_RESISTANCE', incomingDamage: 'INCOMING_DAMAGE', incomingDamagePercent: 'INCOMING_DAMAGE_PERCENT', outgoingDamage: 'OUTGOING_DAMAGE', outgoingDamagePercent: 'OUTGOING_DAMAGE_PERCENT',
      armor: 'ARMOR', velocity: 'VELOCITY', block: 'BLOCK', parry: 'PARRY', evade: 'EVADE', disrupt: 'DISRUPT', actionPointRegen: 'ACTION_POINT_REGEN', moraleRegen: 'MORALE_REGEN', cooldown: 'COOLDOWN', buildTime: 'BUILD_TIME', criticalDamage: 'CRITICAL_DAMAGE', range: 'RANGE', autoAttackSpeed: 'AUTO_ATTACK_SPEED',
      meleePower: 'MELEE_POWER', rangedPower: 'RANGED_POWER', magicPower: 'MAGIC_POWER', meleeCritRate: 'MELEE_CRIT_RATE', rangedCritRate: 'RANGED_CRIT_RATE', magicCritRate: 'MAGIC_CRIT_RATE', armorPenetration: 'ARMOR_PENETRATION', healingPower: 'HEALING_POWER', healthRegen: 'HEALTH_REGEN', maxActionPoints: 'MAX_ACTION_POINTS', fortitude: 'FORTITUDE',
      armorPenetrationReduction: 'ARMOR_PENETRATION_REDUCTION', criticalHitRateReduction: 'CRITICAL_HIT_RATE_REDUCTION', blockStrikethrough: 'BLOCK_STRIKETHROUGH', parryStrikethrough: 'PARRY_STRIKETHROUGH', evadeStrikethrough: 'EVADE_STRIKETHROUGH', disruptStrikethrough: 'DISRUPT_STRIKETHROUGH', healCritRate: 'HEAL_CRIT_RATE',
      mastery1Bonus: 'MASTERY_1_BONUS', mastery2Bonus: 'MASTERY_2_BONUS', mastery3Bonus: 'MASTERY_3_BONUS', outgoingHealPercent: 'OUTGOING_HEAL_PERCENT', incomingHealPercent: 'INCOMING_HEAL_PERCENT',
    };
    const target = keyToEnum[String(statKey)] || '';

    const isItemEligible = (item: import('../types').Item | null): boolean => {
      if (!item) return false;
      const levelEligible = !item.levelRequirement || item.levelRequirement <= loadout.level;
      const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= loadout.renownRank;
      return levelEligible && renownEligible;
    };

    const byName = new Map<string, { name: string; count: number; totalValue: number; percentage: boolean; color?: string }>();

    Object.values(loadout.items).forEach(({ item, talismans }) => {
      if (item && isItemEligible(item)) {
        if (target === 'ARMOR' && item.armor && item.armor > 0) {
          const key = item.name + '|armor';
          const prev = byName.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: false, color: getItemColor(item) };
          prev.count += 1;
          prev.totalValue += Number(item.armor);
          byName.set(key, prev);
        }
        if (item.stats) {
          item.stats.forEach((s) => {
            if (s.stat === target) {
              const key = item.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
              const prev = byName.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(item) };
              prev.count += 1;
              prev.totalValue += Number(s.value);
              prev.percentage = !!s.percentage;
              byName.set(key, prev);
            }
          });
        }
        if (talismans && Array.isArray(talismans)) {
          talismans.forEach((talisman) => {
            if (talisman && isItemEligible(talisman) && talisman.stats) {
              talisman.stats.forEach((s) => {
                if (s.stat === target) {
                  const key = talisman.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
                  const prev = byName.get(key) || { name: talisman.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(talisman) };
                  prev.count += 1;
                  prev.totalValue += Number(s.value);
                  prev.percentage = !!s.percentage;
                  byName.set(key, prev);
                }
              });
            }
          });
        }
      }
    });

    const setCounts: Record<string, number> = {};
    Object.values(loadout.items).forEach(({ item }) => {
      if (item && isItemEligible(item) && item.itemSet) {
        setCounts[item.itemSet.name] = (setCounts[item.itemSet.name] || 0) + 1;
      }
    });
    const setsMap: Record<string, { bonuses: any[] }> = {};
    Object.values(loadout.items).forEach(({ item }) => {
      if (item && isItemEligible(item) && item.itemSet && item.itemSet.bonuses) {
        const setName = item.itemSet.name;
        if (!setsMap[setName]) {
          setsMap[setName] = { bonuses: item.itemSet.bonuses };
        }
      }
    });
    Object.entries(setsMap).forEach(([setName, { bonuses }]) => {
      const pieceCount = setCounts[setName] || 0;
      bonuses.forEach((bonus) => {
        if (pieceCount >= bonus.itemsRequired && 'stat' in bonus.bonus) {
          const b = bonus.bonus as any;
          if (b.stat === target) {
            const key = setName + '|set|' + b.stat + '|' + (b.percentage ? 'pct' : 'val');
            const prev = byName.get(key) || { name: setName, count: 1, totalValue: 0, percentage: !!b.percentage, color: '#4ade80' };
            prev.count = 1;
            prev.totalValue += Number(b.value);
            prev.percentage = !!b.percentage;
            byName.set(key, prev);
          }
        }
      });
    });

    return Array.from(byName.values())
      .filter(entry => entry.totalValue !== 0)
      .sort((a, b) => b.totalValue - a.totalValue || a.name.localeCompare(b.name));
  },

  // Get detailed contributions for a given StatsSummary key (e.g., 'strength', 'armor', etc.)
  getStatContributions(statKey: keyof import('../types').StatsSummary | string): Array<{ name: string; count: number; totalValue: number; percentage: boolean; color?: string }> {
    const loadout = this.getCurrentLoadout();
    if (!loadout) return [];

    // Map StatsSummary key to Item Stat enum string
    const keyToEnum: Record<string, string> = {
      strength: 'STRENGTH',
      agility: 'AGILITY',
      willpower: 'WILLPOWER',
      toughness: 'TOUGHNESS',
      wounds: 'WOUNDS',
      initiative: 'INITIATIVE',
      weaponSkill: 'WEAPON_SKILL',
      ballisticSkill: 'BALLISTIC_SKILL',
      intelligence: 'INTELLIGENCE',
      spiritResistance: 'SPIRIT_RESISTANCE',
      elementalResistance: 'ELEMENTAL_RESISTANCE',
      corporealResistance: 'CORPOREAL_RESISTANCE',
      incomingDamage: 'INCOMING_DAMAGE',
      incomingDamagePercent: 'INCOMING_DAMAGE_PERCENT',
      outgoingDamage: 'OUTGOING_DAMAGE',
      outgoingDamagePercent: 'OUTGOING_DAMAGE_PERCENT',
      armor: 'ARMOR',
      velocity: 'VELOCITY',
      block: 'BLOCK',
      parry: 'PARRY',
      evade: 'EVADE',
      disrupt: 'DISRUPT',
      actionPointRegen: 'ACTION_POINT_REGEN',
      moraleRegen: 'MORALE_REGEN',
      cooldown: 'COOLDOWN',
      buildTime: 'BUILD_TIME',
      criticalDamage: 'CRITICAL_DAMAGE',
      range: 'RANGE',
      autoAttackSpeed: 'AUTO_ATTACK_SPEED',
      meleePower: 'MELEE_POWER',
      rangedPower: 'RANGED_POWER',
      magicPower: 'MAGIC_POWER',
      meleeCritRate: 'MELEE_CRIT_RATE',
      rangedCritRate: 'RANGED_CRIT_RATE',
      magicCritRate: 'MAGIC_CRIT_RATE',
      armorPenetration: 'ARMOR_PENETRATION',
      healingPower: 'HEALING_POWER',
      healthRegen: 'HEALTH_REGEN',
      maxActionPoints: 'MAX_ACTION_POINTS',
      fortitude: 'FORTITUDE',
      armorPenetrationReduction: 'ARMOR_PENETRATION_REDUCTION',
      criticalHitRateReduction: 'CRITICAL_HIT_RATE_REDUCTION',
      blockStrikethrough: 'BLOCK_STRIKETHROUGH',
      parryStrikethrough: 'PARRY_STRIKETHROUGH',
      evadeStrikethrough: 'EVADE_STRIKETHROUGH',
      disruptStrikethrough: 'DISRUPT_STRIKETHROUGH',
      healCritRate: 'HEAL_CRIT_RATE',
      mastery1Bonus: 'MASTERY_1_BONUS',
      mastery2Bonus: 'MASTERY_2_BONUS',
      mastery3Bonus: 'MASTERY_3_BONUS',
      outgoingHealPercent: 'OUTGOING_HEAL_PERCENT',
      incomingHealPercent: 'INCOMING_HEAL_PERCENT',
    };

    const target = keyToEnum[String(statKey)] || '';

    // Eligibility helper (same as in store)
    const isItemEligible = (item: import('../types').Item | null): boolean => {
      if (!item) return false;
      const levelEligible = !item.levelRequirement || item.levelRequirement <= loadout.level;
      const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= loadout.renownRank;
      return levelEligible && renownEligible;
    };

    // Aggregate by name
  const byName = new Map<string, { name: string; count: number; totalValue: number; percentage: boolean; color?: string }>();

    // 1) Items and their own stats (including armor property)
    Object.values(loadout.items).forEach(({ item, talismans }) => {
      if (item && isItemEligible(item)) {
        // Armor property
        if (target === 'ARMOR' && item.armor && item.armor > 0) {
          const key = item.name + '|armor';
          const prev = byName.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: false, color: getItemColor(item) };
          prev.count += 1;
          prev.totalValue += Number(item.armor);
          byName.set(key, prev);
        }

        // Stats array
        if (item.stats) {
          item.stats.forEach((s) => {
            if (s.stat === target) {
              const key = item.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
              const prev = byName.get(key) || { name: item.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(item) };
              prev.count += 1;
              prev.totalValue += Number(s.value);
              prev.percentage = !!s.percentage;
              byName.set(key, prev);
            }
          });
        }

        // 2) Talismans on the item
        if (talismans && Array.isArray(talismans)) {
          talismans.forEach((talisman) => {
            if (talisman && isItemEligible(talisman) && talisman.stats) {
              talisman.stats.forEach((s) => {
                if (s.stat === target) {
                  const key = talisman.name + '|' + s.stat + '|' + (s.percentage ? 'pct' : 'val');
                  const prev = byName.get(key) || { name: talisman.name, count: 0, totalValue: 0, percentage: !!s.percentage, color: getItemColor(talisman) };
                  prev.count += 1;
                  prev.totalValue += Number(s.value);
                  prev.percentage = !!s.percentage;
                  byName.set(key, prev);
                }
              });
            }
          });
        }
      }
    });

    // 3) Set bonuses that are active
    // Count eligible items per set
    const setCounts: Record<string, number> = {};
    Object.values(loadout.items).forEach(({ item }) => {
      if (item && isItemEligible(item) && item.itemSet) {
        setCounts[item.itemSet.name] = (setCounts[item.itemSet.name] || 0) + 1;
      }
    });

    // Build a unique map of sets present to avoid counting bonuses once per item
    const setsMap: Record<string, { bonuses: any[] }> = {};
    Object.values(loadout.items).forEach(({ item }) => {
      if (item && isItemEligible(item) && item.itemSet && item.itemSet.bonuses) {
        const setName = item.itemSet.name;
        if (!setsMap[setName]) {
          setsMap[setName] = { bonuses: item.itemSet.bonuses };
        }
      }
    });

    // For each unique set, apply active bonuses once
    Object.entries(setsMap).forEach(([setName, { bonuses }]) => {
      const pieceCount = setCounts[setName] || 0;
      bonuses.forEach((bonus) => {
        if (pieceCount >= bonus.itemsRequired && 'stat' in bonus.bonus) {
          const b = bonus.bonus as any; // ItemStat
          if (b.stat === target) {
            const key = setName + '|set|' + b.stat + '|' + (b.percentage ? 'pct' : 'val');
            const prev = byName.get(key) || { name: setName, count: 0, totalValue: 0, percentage: !!b.percentage, color: '#4ade80' };
            prev.count = 1; // set bonus counted once per set
            prev.totalValue += Number(b.value);
            prev.percentage = !!b.percentage;
            byName.set(key, prev);
          }
        }
      });
    });

    return Array.from(byName.values())
      .filter(entry => entry.totalValue !== 0)
      .sort((a, b) => b.totalValue - a.totalValue || a.name.localeCompare(b.name));
  },
  // Get count of equipped items for a specific set
  getEquippedSetItemsCount(setName: string): number {
    const loadout = this.getCurrentLoadout();
    if (!loadout) return 0;

    let count = 0;
    Object.values(loadout.items).forEach(loadoutItem => {
      if (loadoutItem.item && loadoutItem.item.itemSet && loadoutItem.item.itemSet.name === setName) {
        // Only count eligible items toward set bonuses
        const levelEligible = !loadoutItem.item.levelRequirement || loadoutItem.item.levelRequirement <= loadout.level;
        const renownEligible = !loadoutItem.item.renownRankRequirement || loadoutItem.item.renownRankRequirement <= loadout.renownRank;
        if (levelEligible && renownEligible) {
          count++;
        }
      }
    });
    return count;
  },

  // Fetch single item with full details (including descriptions)
  async getItemWithDetails(itemId: string): Promise<Item | null> {
    try {
      // Return from cache if present (and refresh LRU)
      if (this._itemDetailsCache.has(itemId)) {
        const cached = this._itemDetailsCache.get(itemId) ?? null;
        // Refresh LRU by re-inserting
        this._itemDetailsCache.delete(itemId);
        this._itemDetailsCache.set(itemId, cached);
        return cached;
      }

      // Coalesce concurrent requests
      const inflight = this._itemDetailsInflight.get(itemId);
      if (inflight) return inflight;

      const promise = (async () => {
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
              stats {
                stat
                value
                percentage
              }
              careerRestriction
              raceRestriction
              iconUrl
              talismanSlots
              itemSet {
                id
                name
                bonuses {
                  itemsRequired
                  bonus {
                    ... on ItemStat {
                      stat
                      value
                      percentage
                    }
                    ... on Ability {
                      name
                      description
                    }
                  }
                }
              }
              abilities {
                name
                description
              }
              buffs {
                name
                description
              }
            }
          }
        `;

        const { data } = await client.query({
          query,
          variables: { id: itemId },
          fetchPolicy: 'cache-first',
        });
        const item = (data as any).item || null;

        // Insert into LRU cache
        this._itemDetailsCache.set(itemId, item);
        if (this._itemDetailsCache.size > this._itemDetailsCacheLimit) {
          // Delete the oldest entry (Map preserves insertion order)
          const firstKey = this._itemDetailsCache.keys().next().value as string | undefined;
          if (firstKey) this._itemDetailsCache.delete(firstKey);
        }
        return item;
      })();

      this._itemDetailsInflight.set(itemId, promise);
      try {
        return await promise;
      } finally {
        this._itemDetailsInflight.delete(itemId);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      throw error;
    }
  },

  // Check if a talisman is already slotted in a specific item (same slot, different index)
  isTalismanAlreadySlottedInItem(talismanId: string, slot: EquipSlot, excludeIndex?: number): boolean {
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!currentLoadout) return false;

    const itemTalismans = currentLoadout.items[slot].talismans;
    return itemTalismans.some((talisman, index) => 
      talisman && talisman.id === talismanId && index !== excludeIndex
    );
  },

  // Per-loadout variant used by compare views
  isTalismanAlreadySlottedInItemForLoadout(loadoutId: string, talismanId: string, slot: EquipSlot, excludeIndex?: number): boolean {
    const loadout = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
    if (!loadout) return false;
    const itemTalismans = loadout.items[slot].talismans;
    return itemTalismans.some((talisman, index) =>
      talisman && talisman.id === talismanId && index !== excludeIndex
    );
  },
};

// Initialize stats on service load
loadoutService.initializeStats();
