/* eslint-disable @typescript-eslint/no-explicit-any */ // GraphQL results are untyped at the boundary

import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import client from '../../lib/apollo-client';
// Note: GraphQL operations come from centralized documents in ./queries
import { EquipSlot, Item, Career, LoadoutItem, Stat, ItemRarity, LoadoutSide } from '../../types';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { subscribeToEvents as subscribeToEventsHelper, subscribeToAllEvents as subscribeToAllEventsHelper } from './events';
import { urlService } from './urlService';
import { updateUrlIfAuto } from './urlSync';
import { LoadoutEvents } from '../../types/events';
import { SEARCH_CHARACTERS, GET_CHARACTER } from './queries';
import { getItemsForSlotApi, getTalismansForItemLevelApi, getItemWithDetailsApi } from './api';
import { computeStatsForLoadout as computeStatsForLoadoutExternal, getStatContributionsForLoadout as getStatContributionsForLoadoutExternal } from './stats';
import { sanitizeHasStats, getAllowedFilterStats } from './filters';
import * as selectors from './selectors';
import {
  cloneLoadout as cloneLoadoutMutation,
  setCareer as setCareerMutation,
  setLevel as setLevelMutation,
  setRenownRank as setRenownRankMutation,
  setCareerForLoadout as setCareerForLoadoutMutation,
  setLevelForLoadout as setLevelForLoadoutMutation,
  setRenownForLoadout as setRenownForLoadoutMutation,
  setLoadoutNameForLoadout as setLoadoutNameForLoadoutMutation,
  setCharacterStatusForLoadout as setCharacterStatusForLoadoutMutation,
  updateItem as updateItemMutation,
  updateItemForLoadout as updateItemForLoadoutMutation,
  updateTalisman as updateTalismanMutation,
  updateTalismanForLoadout as updateTalismanForLoadoutMutation,
  // Fix: bring in missing helpers used below
  assignSideLoadout as assignSideLoadoutMutation,
  switchLoadout as switchLoadoutMutation,
} from './mutations';
export const loadoutService = {
  getActiveSide(): LoadoutSide {
    // Filters/selectors/mutations are split into submodules for maintainability
    return selectors.getActiveSide();
  },
  // Missing setter: update active side in the store and emit an event for UI to react
  setActiveSide(side: LoadoutSide) {
    loadoutStoreAdapter.setActiveSide(side);
    loadoutEventEmitter.emit({
      type: 'ACTIVE_SIDE_CHANGED',
      payload: { side },
      timestamp: Date.now(),
    });
  },
  assignSideLoadout(side: LoadoutSide, loadoutId: string | null) {
    // Dual-only: ensure A and B don't point to the same loadout id
    if (loadoutId) {
      const otherSide: LoadoutSide = side === 'A' ? 'B' : 'A';
      const otherId = loadoutStoreAdapter.getSideLoadoutId(otherSide);
      if (otherId && otherId === loadoutId) {
        // Clone to keep sides independent
        const clonedId = this.cloneLoadout(loadoutId, side === 'A' ? 'Side A' : 'Side B');
        loadoutId = clonedId;
      }
    }
  assignSideLoadoutMutation(side, loadoutId);
    // If the assigned loadout has a career, bind per-side per-career mapping as well
    if (loadoutId) {
      const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
      if (lo?.career) {
        loadoutStoreAdapter.setSideCareerLoadoutId(side, lo.career, loadoutId);
      }
    }
    loadoutEventEmitter.emit({ type: 'SIDE_LOADOUT_ASSIGNED', payload: { side, loadoutId }, timestamp: Date.now() });
    // Update URL to include the newly assigned side
    updateUrlIfAuto(this._isCharacterLoading);
  },
  getSideLoadoutId(side: LoadoutSide): string | null {
    return selectors.getSideLoadoutId(side);
  },
  getLoadoutForSide(side: LoadoutSide) {
    return selectors.getLoadoutForSide(side);
  },

  // Ensure a side has a loadout assigned, creating one if necessary
  ensureSideLoadout(side: LoadoutSide): string {
    const assigned = loadoutStoreAdapter.getSideLoadoutId(side);
    if (assigned) {
      // If both sides point to the same id, clone to keep them independent
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

  // Helper: pick a side to edit, ensure it exists, and switch to it (dual-only app)
  async selectSideForEdit(side: LoadoutSide): Promise<string> {
    this.setActiveSide(side);
    // Prefer existing assignment; only create if truly missing
    let id = this.getSideLoadoutId(side);
    if (!id) {
      id = this.ensureSideLoadout(side);
    }
    await this.switchLoadout(id);
    return id;
  },
  // LRU cache for item details + in-flight requests to prevent duplicate fetches
  _itemDetailsCache: new Map<string, Item | null>(),
  _itemDetailsInflight: new Map<string, Promise<Item | null>>(),
  _itemDetailsCacheLimit: 200,
  // Guard to indicate character import is in progress
  _isCharacterLoading: false as boolean,
  // Internal helper: if the referenced loadout was loaded from a character, mark it as modified
  _maybeMarkLoadoutAsModified(loadoutId?: string) {
    try {
      if (this._isCharacterLoading) return;
      const id = loadoutId ?? loadoutStoreAdapter.getCurrentLoadoutId();
      if (!id) return;
      const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === id);
      if (lo && lo.isFromCharacter) {
        loadoutStoreAdapter.markLoadoutAsModified(id);
      }
    } catch {
      // best-effort; ignore
    }
  },
  // Public guard for bulk apply (e.g., URL decoding flows)
  beginBulkApply() {
    this._isCharacterLoading = true;
  },
  endBulkApply() {
    this._isCharacterLoading = false;
  },

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
    return selectors.isUniqueItemAlreadyEquippedInLoadout(itemId, loadoutId);
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

    updateItemMutation(slot, item);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Automatically recalculate stats after item update
    this.getStatsSummary();

    // Update URL with current loadout state
  updateUrlIfAuto(this._isCharacterLoading);
  },

  async updateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null) {
    // Validate unique-equipped only within that loadout
    if (item) {
      const validation = this.canEquipUniqueItem(item, loadoutId);
      if (!validation.canEquip) {
        throw new Error(validation.reason || 'Cannot equip this unique item');
      }
    }

    updateItemForLoadoutMutation(loadoutId, slot, item);
    // If this loadout came from a character, any change flips to non-character mode
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'ITEM_UPDATED', payload: { slot, item }, timestamp: Date.now() });
    this.getStatsSummary();
    updateUrlIfAuto(this._isCharacterLoading);
  },

  async updateTalisman(slot: EquipSlot, index: number, talisman: Item | null) {
    updateTalismanMutation(slot, index, talisman);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Automatically recalculate stats after talisman update
    this.getStatsSummary();

    // Update URL with current loadout state
    updateUrlIfAuto(this._isCharacterLoading);
  },

  async updateTalismanForLoadout(loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null) {
    updateTalismanForLoadoutMutation(loadoutId, slot, index, talisman);
    // Any change breaks character mode
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'TALISMAN_UPDATED', payload: { slot, index, talisman }, timestamp: Date.now() });
    this.getStatsSummary();
    if (!this._isCharacterLoading) urlService.updateUrlForCurrentLoadout();
  },

  // 3. Fetch items for equipment selection
  /**
   * Fetch a paginated list of items for a specific slot.
   * Cache-first (Apollo) + in-memory LRU keyed by filters/cursors. Prefetches next page and warms icon cache.
   */
  async getItemsForSlot(slot: EquipSlot | null, career?: Career, limit: number = 50, after?: string, levelRequirement: number = 40, renownRankRequirement: number = 80, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[], before?: string, last?: number): Promise<any> {
    try {
      const allowedStats = sanitizeHasStats(hasStats);
      // Delegate to API module; compatibility filters handled in query builder
      return await getItemsForSlotApi(
        slot,
        career,
        limit,
        after,
        levelRequirement,
        renownRankRequirement,
        nameFilter,
        allowedStats,
        hasRarities,
        before,
        last,
      );
    } catch (error) {
      console.error('Failed to fetch items for slot:', error);
      throw error;
    }
  },

  // Helper method for single slot queries
  async getItemsForSingleSlot(slot: EquipSlot | null, career?: Career, limit: number = 50, after?: string, levelRequirement: number = 40, renownRankRequirement: number = 80, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[], before?: string, last?: number): Promise<any> {
    // Preserve method for compatibility, but delegate to API implementation
    return await getItemsForSlotApi(
      slot,
      career,
      limit,
      after,
      levelRequirement,
      renownRankRequirement,
      nameFilter,
      hasStats,
      hasRarities,
      before,
      last,
    );
  },

  // 3.5. Fetch talismans for holding item's level requirement
  // Rule (from in-game testing): talisman.levelRequirement ≤ holdingItem.levelRequirement
  /**
   * Fetch talismans whose level requirement is <= the holding item's level.
   * Cache-first + LRU; prefetch next page and warm icons.
   */
  async getTalismansForItemLevel(holdingLevelRequirement: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[], before?: string, last?: number): Promise<any> {
    try {
      const allowedStats = sanitizeHasStats(hasStats);
      return await getTalismansForItemLevelApi(
        holdingLevelRequirement,
        limit,
        after,
        nameFilter,
        allowedStats,
        hasRarities,
        before,
        last,
      );
    } catch (error) {
      console.error('Failed to fetch talismans for level req:', error);
      throw error;
    }
  },

  // Expose allowed filter stats for UI consumption
  /** Return the allowlist of stats permitted in filters. */
  getAllowedFilterStats(): Stat[] {
    return getAllowedFilterStats();
  },

  // 3.7. Get talismans for a specific slot (no special cases)
  /** Alias to getTalismansForItemLevel; slot param is unused (compat). */
  async getTalismansForSlot(_slot: EquipSlot, holdingLevelRequirement: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[], before?: string, last?: number): Promise<any> {
    return await this.getTalismansForItemLevel(holdingLevelRequirement, limit, after, nameFilter, hasStats, hasRarities, before, last);
  },

  // Removed legendary talisman special-case as the required info cannot be reliably extracted from the schema

  // 3. Retrieve stats summary
  /** Recompute and emit the aggregate stats summary for the current loadout. */
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
    return selectors.getCurrentLoadout();
  },

  getAllLoadouts() {
    return selectors.getAllLoadouts();
  },

  getCurrentLoadoutId() {
    return selectors.getCurrentLoadoutId();
  },

  // Event subscription methods
  subscribeToEvents<T extends LoadoutEvents>(eventType: T['type'], callback: (event: T) => void) {
    return subscribeToEventsHelper(eventType, callback);
  },

  subscribeToAllEvents(callback: (event: LoadoutEvents) => void) {
    return subscribeToAllEventsHelper(callback);
  },

  async setCareer(career: Career | null) {
    // Always set on current loadout
    setCareerMutation(career);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Update per-side per-career mapping for the active side if career provided
    const updated = loadoutStoreAdapter.getCurrentLoadout();
    if (career && updated) {
      loadoutStoreAdapter.setSideCareerLoadoutId(this.getActiveSide(), career, updated.id);
    }

    // Update URL with current loadout state
  updateUrlIfAuto(this._isCharacterLoading);
  },

  async setLevel(level: number) {
    // Always set on current loadout
    setLevelMutation(level);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Emit stats updated event since level changes affect item eligibility
    this.getStatsSummary();

    // Update URL with current loadout state
  updateUrlIfAuto(this._isCharacterLoading);
  },

  async setRenownRank(renownRank: number) {
    // Always set on current loadout
    setRenownRankMutation(renownRank);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Emit stats updated event since renown changes affect item eligibility
    this.getStatsSummary();

    // Update URL with current loadout state
  updateUrlIfAuto(this._isCharacterLoading);
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
    await switchLoadoutMutation(id);
    loadoutEventEmitter.emit({
      type: 'LOADOUT_SWITCHED',
      payload: { loadoutId: id },
      timestamp: Date.now(),
    });
    // Dual-only: if the active side isn't assigned, assign it implicitly to the active side
    if (this.getSideLoadoutId(this.getActiveSide()) == null) {
      this.assignSideLoadout(this.getActiveSide(), id);
    }
    // Recalculate stats for the new loadout
    this.getStatsSummary();

    // Update URL with the new loadout state
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },

  async resetCurrentLoadout() {
    // Reset the current loadout to default state
    const current = loadoutStoreAdapter.getCurrentLoadout();
    if (current) {
      // Use per-loadout reset to also normalize Side A/B names if assigned
      loadoutStoreAdapter.resetLoadoutById(current.id);
      // Clear any per-side per-career mapping that points to this loadout for the active side,
      // so that re-selecting the same career doesn't reuse a reset loadout without a career set.
      const activeSide = this.getActiveSide();
      // The adapter doesn't expose a listing; instead, proactively clear the mapping for the current loadout's career if any.
      if (current.career) {
        loadoutStoreAdapter.setSideCareerLoadoutId(activeSide, current.career, null);
      }
    } else {
      loadoutStoreAdapter.resetCurrentLoadout();
    }

    // Clear only this side's parameters from URL
  // urlService is statically imported at top
  urlService.clearSideFromUrl(this.getActiveSide());

    loadoutEventEmitter.emit({
      type: 'LOADOUT_RESET',
      payload: { loadoutId: current ? current.id : 'reset' },
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
      if (otherMapped && otherMapped === mappedId) {
        const clonedId = this.cloneLoadout(mappedId, `${career} Loadout (${activeSide})`);
        loadoutStoreAdapter.setSideCareerLoadoutId(activeSide, career, clonedId);
        this.assignSideLoadout(activeSide, clonedId);
        await this.switchLoadout(clonedId);
        return clonedId;
      }
      // Otherwise ensure the mapped loadout actually has the requested career (it may have been reset)
      const existing = loadoutStoreAdapter.getLoadouts().find(l => l.id === mappedId);
      if (!existing || existing.career !== career) {
        // Set career directly on the mapped loadout so UI reflects selection and URL picks it up on switch
        this.setCareerForLoadout(mappedId, career);
      }
      // Then switch to it and assign to the side
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
      this._isCharacterLoading = true;
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
      // Ensure subsequent updates target the correct current loadout
      await this.switchLoadout(loadoutId);
      await this.setCareer(character.career);
      // Level and renown already set in createLoadout

      // Set all the items
      for (const [slot, loadoutItem] of Object.entries(items)) {
        // Apply item first
        await this.updateItem(slot as EquipSlot, loadoutItem.item);
        // Then talismans for that slot (if any)
        if (loadoutItem.talismans && Array.isArray(loadoutItem.talismans)) {
          for (let index = 0; index < loadoutItem.talismans.length; index++) {
            const talisman = loadoutItem.talismans[index];
            if (talisman) {
              await this.updateTalisman(slot as EquipSlot, index, talisman);
            }
          }
        }
      }

      // Mark as loaded from character and ensure side mapping
      loadoutStoreAdapter.updateLoadoutCharacterStatus(loadoutId, true, character.name);
      loadoutStoreAdapter.setSideCareerLoadoutId(targetSide, character.career, loadoutId);
      return loadoutId;
    } catch (error) {
      console.error('Failed to import character:', error);
      throw error;
    } finally {
      // End import guard and update URL once
      this._isCharacterLoading = false;
  if (urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
    }},

  // Per-loadout setters used by compare flows
  setCareerForLoadout(loadoutId: string, career: Career | null) {
    setCareerForLoadoutMutation(loadoutId, career);
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'CAREER_CHANGED', payload: { career }, timestamp: Date.now() });
    this.getStatsSummary();
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },
  setLevelForLoadout(loadoutId: string, level: number) {
    setLevelForLoadoutMutation(loadoutId, level);
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level }, timestamp: Date.now() });
    this.getStatsSummary();
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },
  setRenownForLoadout(loadoutId: string, renownRank: number) {
    setRenownForLoadoutMutation(loadoutId, renownRank);
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'RENOWN_RANK_CHANGED', payload: { renownRank }, timestamp: Date.now() });
    this.getStatsSummary();
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },
  setLoadoutNameForLoadout(loadoutId: string, name: string) {
    setLoadoutNameForLoadoutMutation(loadoutId, name);
    // Renaming should also exit character mode
    this._maybeMarkLoadoutAsModified(loadoutId);
    loadoutEventEmitter.emit({ type: 'LOADOUT_SWITCHED', payload: { loadoutId }, timestamp: Date.now() });
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },
  setCharacterStatusForLoadout(loadoutId: string, isFromCharacter: boolean, characterName?: string) {
    setCharacterStatusForLoadoutMutation(loadoutId, isFromCharacter, characterName);
    loadoutEventEmitter.emit({ type: 'LOADOUT_SWITCHED', payload: { loadoutId }, timestamp: Date.now() });
  if (!this._isCharacterLoading && urlService.isAutoUpdateEnabled()) urlService.updateUrlForCurrentLoadout();
  },

  // Clone an existing loadout to a new id
  cloneLoadout(sourceId: string, name?: string): string {
    return cloneLoadoutMutation(sourceId, name);
  },

  // Detailed stats computation for an arbitrary loadout id (delegated)
  computeStatsForLoadout(loadoutId: string) {
    return computeStatsForLoadoutExternal(loadoutId);
  },

  getStatContributionsForLoadout(loadoutId: string, statKey: keyof import('../../types').StatsSummary | string) {
    return getStatContributionsForLoadoutExternal(loadoutId, statKey as any);
  },

  // Item details fetcher with caching
  /** Fetch a single item with full details, with LRU + in-flight dedupe. */
  async getItemWithDetails(itemId: string): Promise<Item | null> {
    try {
      if (this._itemDetailsCache.has(itemId)) {
        const cached = this._itemDetailsCache.get(itemId) ?? null;
        this._itemDetailsCache.delete(itemId);
        this._itemDetailsCache.set(itemId, cached);
        return cached;
      }
      const inflight = this._itemDetailsInflight.get(itemId);
      if (inflight) return inflight;
      const promise = (async () => {
        const item = await getItemWithDetailsApi(itemId);
        this._itemDetailsCache.set(itemId, item);
        if (this._itemDetailsCache.size > this._itemDetailsCacheLimit) {
          const firstKey = this._itemDetailsCache.keys().next().value as string | undefined;
          if (firstKey) this._itemDetailsCache.delete(firstKey);
        }
        return item;
      })();
      this._itemDetailsInflight.set(itemId, promise);
      try { return await promise; } finally { this._itemDetailsInflight.delete(itemId); }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      throw error;
    }
  },

  isTalismanAlreadySlottedInItem(talismanId: string, slot: EquipSlot, excludeIndex?: number): boolean {
    return selectors.isTalismanAlreadySlottedInItem(talismanId, slot, excludeIndex);
  },
  isTalismanAlreadySlottedInItemForLoadout(loadoutId: string, talismanId: string, slot: EquipSlot, excludeIndex?: number): boolean {
    return selectors.isTalismanAlreadySlottedInItemForLoadout(loadoutId, talismanId, slot, excludeIndex);
  },

};
