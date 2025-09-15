/* eslint-disable @typescript-eslint/no-explicit-any */

import { loadoutStoreAdapter } from '../store/loadoutStoreAdapter';
import client from '../lib/apollo-client';
import { gql } from '@apollo/client';
import { EquipSlot, Item, Career, LoadoutItem, Stat } from '../types';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { LoadoutEvents, LoadoutEventType } from '../types/events';

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

const GET_ITEMS_WITH_CAREER_WITH_STATS = gql`
  query GetItemsWithCareerWithStats($slot: EquipSlot, $usableByCareer: Career, $levelRequirement: Byte, $renownRankRequirement: Byte, $first: Int, $after: String, $nameFilter: String, $hasStats: [Stat!]) {
    items(where: {
      slot: { eq: $slot },
      type: { neq: NONE },
      levelRequirement: { lte: $levelRequirement },
      renownRankRequirement: { lte: $renownRankRequirement },
      name: { contains: $nameFilter }
    }, usableByCareer: $usableByCareer, hasStats: $hasStats, first: $first, after: $after, order: [
      { rarity: DESC },
      { itemLevel: DESC },
      { name: ASC }
    ]) {
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
      }
      totalCount
    }
  }
`;

const GET_ITEMS_WITH_CAREER = gql`
  query GetItemsWithCareer($slot: EquipSlot, $usableByCareer: Career, $levelRequirement: Byte, $renownRankRequirement: Byte, $first: Int, $after: String, $nameFilter: String) {
    items(where: { 
      slot: { eq: $slot },
      type: { neq: NONE },
      levelRequirement: { lte: $levelRequirement },
      renownRankRequirement: { lte: $renownRankRequirement },
      name: { contains: $nameFilter }
    }, usableByCareer: $usableByCareer, first: $first, after: $after, order: [
      { rarity: DESC },
      { itemLevel: DESC },
      { name: ASC }
    ]) {
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
          }
          abilities {
            name
          }
          buffs {
            name
          }
        }
      }
      nodes {
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
      totalCount
    }
  }
`;

const GET_ITEMS_WITHOUT_CAREER_WITH_STATS = gql`
  query GetItemsWithoutCareerWithStats($slot: EquipSlot, $levelRequirement: Byte, $renownRankRequirement: Byte, $first: Int, $after: String, $nameFilter: String, $hasStats: [Stat!]) {
    items(
      where: { 
        slot: { eq: $slot },
        type: { neq: NONE },
        levelRequirement: { lte: $levelRequirement },
        renownRankRequirement: { lte: $renownRankRequirement },
        name: { contains: $nameFilter }
      }, 
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
      nodes {
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
      totalCount
    }
  }
`;

const GET_ITEMS_WITHOUT_CAREER = gql`
  query GetItemsWithoutCareer($slot: EquipSlot, $levelRequirement: Byte, $renownRankRequirement: Byte, $first: Int, $after: String, $nameFilter: String) {
    items(
      where: { 
        slot: { eq: $slot },
        type: { neq: NONE },
        levelRequirement: { lte: $levelRequirement },
        renownRankRequirement: { lte: $renownRankRequirement },
        name: { contains: $nameFilter }
      }, 
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
      }
      nodes {
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
      totalCount
    }
  }
`;

const GET_TALISMANS = gql`
  query GetTalismans($itemLevel: Byte, $first: Int, $after: String, $nameFilter: String, $hasStats: [Stat!]) {
    items(
      where: {
        type: { eq: ENHANCEMENT },
        itemLevel: { lte: $itemLevel },
        name: { contains: $nameFilter }
      },
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
      }
      nodes {
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
      totalCount
    }
  }
`;

export const loadoutService = {
  // 1. Load data from named character
  async loadFromNamedCharacter(characterName: string) {
    try {
      const { data } = await client.query({
        query: SEARCH_CHARACTERS,
        variables: { name: characterName },
      });
      const characters = (data as any).characters.edges.map((e: any) => e.node);
      if (characters.length === 0) throw new Error('Character not found');
      const character = characters[0]; // Take the first match
      await loadoutStoreAdapter.importFromCharacter(character.id);
      return character.id;
    } catch (error) {
      console.error('Failed to load from named character:', error);
      throw error;
    }
  },

  // 2. Add/update specific item/talisman slots
  updateItem(slot: EquipSlot, item: Item | null) {
    loadoutStoreAdapter.setItem(slot, item);
    loadoutEventEmitter.emit({
      type: 'ITEM_UPDATED',
      payload: { slot, item },
      timestamp: Date.now(),
    });
    // Automatically recalculate stats after item update
    this.getStatsSummary();
  },

  updateTalisman(slot: EquipSlot, index: number, talisman: Item | null) {
    loadoutStoreAdapter.setTalisman(slot, index, talisman);
    loadoutEventEmitter.emit({
      type: 'TALISMAN_UPDATED',
      payload: { slot, index, talisman },
      timestamp: Date.now(),
    });
    // Automatically recalculate stats after talisman update
    this.getStatsSummary();
  },

  // 3. Fetch items for equipment selection
  async getItemsForSlot(slot: EquipSlot, career?: Career, limit: number = 50, after?: string, levelRequirement: number = 40, renownRankRequirement: number = 80, nameFilter?: string, hasStats?: Stat[]): Promise<any> {
    try {
      let query;
      let variables: any = { 
        slot, 
        first: limit,
        nameFilter: nameFilter || '',
        hasStats: hasStats && hasStats.length > 0 ? hasStats : null
      };

      if (after) {
        variables.after = after;
      }

      if (career) {
        query = hasStats && hasStats.length > 0 ? GET_ITEMS_WITH_CAREER_WITH_STATS : GET_ITEMS_WITH_CAREER;
        variables.usableByCareer = career;
        variables.levelRequirement = levelRequirement;
        variables.renownRankRequirement = renownRankRequirement;
        if (hasStats && hasStats.length > 0) {
          variables.hasStats = hasStats;
        }
      } else {
        query = hasStats && hasStats.length > 0 ? GET_ITEMS_WITHOUT_CAREER_WITH_STATS : GET_ITEMS_WITHOUT_CAREER;
        variables.levelRequirement = levelRequirement;
        variables.renownRankRequirement = renownRankRequirement;
        if (hasStats && hasStats.length > 0) {
          variables.hasStats = hasStats;
        }
      }

      const { data } = await client.query({
        query,
        variables,
      });
      return (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
    } catch (error) {
      console.error('Failed to fetch items for slot:', error);
      throw error;
    }
  },

  // 3.5. Fetch talismans for item level
  async getTalismansForItemLevel(itemLevel: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[]): Promise<any> {
    try {
      const variables: any = {
        itemLevel,
        first: limit,
        nameFilter: nameFilter || '',
        hasStats: hasStats || []
      };

      if (after) {
        variables.after = after;
      }

      const { data } = await client.query({
        query: GET_TALISMANS,
        variables,
      });
      return (data as any).items || { edges: [], nodes: [], pageInfo: {}, totalCount: 0 };
    } catch (error) {
      console.error('Failed to fetch talismans for item level:', error);
      throw error;
    }
  },

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

  setCareer(career: Career) {
    loadoutStoreAdapter.setCareer(career);
    loadoutEventEmitter.emit({
      type: 'CAREER_CHANGED',
      payload: { career },
      timestamp: Date.now(),
    });
  },

  setLevel(level: number) {
    loadoutStoreAdapter.setLevel(level);
    loadoutEventEmitter.emit({
      type: 'LEVEL_CHANGED',
      payload: { level },
      timestamp: Date.now(),
    });
  },

  setRenownRank(renownRank: number) {
    loadoutStoreAdapter.setRenownRank(renownRank);
    loadoutEventEmitter.emit({
      type: 'RENOWN_RANK_CHANGED',
      payload: { renownRank },
      timestamp: Date.now(),
    });
  },

  createLoadout(name: string) {
    const loadoutId = loadoutStoreAdapter.createLoadout(name);
    loadoutEventEmitter.emit({
      type: 'LOADOUT_CREATED',
      payload: { loadoutId, name },
      timestamp: Date.now(),
    });
    // Recalculate stats for the new loadout
    this.getStatsSummary();
    return loadoutId;
  },

  switchLoadout(id: string) {
    loadoutStoreAdapter.switchLoadout(id);
    loadoutEventEmitter.emit({
      type: 'LOADOUT_SWITCHED',
      payload: { loadoutId: id },
      timestamp: Date.now(),
    });
    // Recalculate stats for the new loadout
    this.getStatsSummary();
  },

  resetCurrentLoadout() {
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    loadoutStoreAdapter.resetCurrentLoadout();
    if (currentLoadout) {
      loadoutEventEmitter.emit({
        type: 'LOADOUT_RESET',
        payload: { loadoutId: currentLoadout.id },
        timestamp: Date.now(),
      });
    }
    // Recalculate stats after reset
    this.getStatsSummary();
  },

  // 4. Import character data and create loadout
  async importFromCharacter(characterId: string): Promise<string> {
    try {
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
      const loadoutId = loadoutService.createLoadout(`Imported from ${character.name}`);
      loadoutService.switchLoadout(loadoutId);
      loadoutService.setCareer(character.career);
      loadoutService.setLevel(character.level);
      loadoutService.setRenownRank(character.renownRank);

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

  // Get count of equipped items for a specific set
  getEquippedSetItemsCount(setName: string): number {
    const loadout = this.getCurrentLoadout();
    if (!loadout) return 0;

    let count = 0;
    Object.values(loadout.items).forEach(loadoutItem => {
      if (loadoutItem.item && loadoutItem.item.itemSet && loadoutItem.item.itemSet.name === setName) {
        count++;
      }
    });
    return count;
  },

  // Fetch single item with full details (including descriptions)
  async getItemWithDetails(itemId: string): Promise<Item | null> {
    try {
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
      });
      return (data as any).item || null;
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      throw error;
    }
  },
};

// Initialize stats on service load
loadoutService.initializeStats();
