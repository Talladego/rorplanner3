/* eslint-disable @typescript-eslint/no-explicit-any */ // GraphQL results are untyped at the boundary

import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
// GraphQL operations imported from generated typed documents
import { EquipSlot, Item, Career, Stat, ItemRarity, LoadoutSide } from '../../types';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { subscribeToEvents as subscribeToEventsHelper, subscribeToAllEvents as subscribeToAllEventsHelper } from './events';
import { urlService } from './urlService';
import { updateUrlIfAuto } from './urlSync';
import { LoadoutEvents } from '../../types/events';
// (Removed direct character GraphQL queries from service; handled in characterImport module)
// Character import extracted to separate module
import { loadFromNamedCharacter as loadFromNamedCharacterExternal, importFromCharacter as importFromCharacterExternal } from './characterImport';
import { getItemsForSlotApi, getTalismansForItemLevelApi, getItemWithDetailsApi } from './api';
import * as statsFacade from './statsFacade';
// Validation helpers handled in equipmentValidation module
import { getItemEligibility as getItemEligibilityShared, getTalismanEligibility as getTalismanEligibilityShared, validateItemForCurrentLoadout, validateItemForLoadout } from './equipmentValidation';
import { sanitizeHasStats, getAllowedFilterStats } from './filters';
import { getBlockInvalidItems } from '../ui/selectorPrefs';
import * as selectors from './selectors';
import {
  cloneLoadout as cloneLoadoutMutation,
  setCareer as setCareerMutation,
  setLevel as setLevelMutation,
  setRenownRank as setRenownRankMutation,
  updateItem as updateItemMutation,
  updateItemForLoadout as updateItemForLoadoutMutation,
  updateTalisman as updateTalismanMutation,
  updateTalismanForLoadout as updateTalismanForLoadoutMutation,
  // Fix: bring in missing helpers used below
  assignSideLoadout as assignSideLoadoutMutation,
  switchLoadout as switchLoadoutMutation,
} from './mutations';
import * as loadoutMutations from './loadoutMutations';
export const loadoutService = {
  getActiveSide(): LoadoutSide {
    return selectors.getActiveSide();
  },
  // Wrapper delegating to shared module
  getItemEligibility(slot: EquipSlot, item: Item | null, loadoutId?: string): { eligible: boolean; reasons: string[] } {
    return getItemEligibilityShared(slot, item, loadoutId);
  },
  /** Determine talisman eligibility for a slot+index on current or specific loadout.
   * Checks level, renown, race restrictions and duplicate talisman earlier in the same item.
   */
  getTalismanEligibility(slot: EquipSlot, index: number, talisman: Item | null, loadoutId?: string): { eligible: boolean; reasons: string[] } {
    return getTalismanEligibilityShared(slot, index, talisman, loadoutId);
  },
  // Renown ability updates (emit STATS_UPDATED after mutation so UI stays in sync)
  setRenownAbilityLevel(ability: keyof NonNullable<import('../../types').Loadout['renownAbilities']>, level: number) {
    loadoutStoreAdapter.setRenownAbilityLevel(ability as any, level);
    const stats = this.getStatsSummary();
    loadoutEventEmitter.emit({ type: 'STATS_UPDATED', payload: { stats }, timestamp: Date.now() });
  },
  setRenownAbilityLevelForLoadout(loadoutId: string, ability: keyof NonNullable<import('../../types').Loadout['renownAbilities']>, level: number) {
    loadoutStoreAdapter.setRenownAbilityLevelForLoadout(loadoutId, ability as any, level);
    const stats = this.getStatsSummary();
    loadoutEventEmitter.emit({ type: 'STATS_UPDATED', payload: { stats }, timestamp: Date.now() });
  },
  resetRenownAbilities() {
    loadoutStoreAdapter.resetRenownAbilities();
    const stats = this.getStatsSummary();
    loadoutEventEmitter.emit({ type: 'STATS_UPDATED', payload: { stats }, timestamp: Date.now() });
  },
  resetRenownAbilitiesForLoadout(loadoutId: string) {
    loadoutStoreAdapter.resetRenownAbilitiesForLoadout(loadoutId);
    const stats = this.getStatsSummary();
    loadoutEventEmitter.emit({ type: 'STATS_UPDATED', payload: { stats }, timestamp: Date.now() });
  },
  // Active side setter: update adapter and emit event for UI reaction
  setActiveSide(side: LoadoutSide) {
    loadoutStoreAdapter.setActiveSide(side);
    loadoutEventEmitter.emit({
      type: 'ACTIVE_SIDE_CHANGED',
      payload: { side },
      timestamp: Date.now(),
    });
  },
  assignSideLoadout(side: LoadoutSide, loadoutId: string | null) {
    // Ensure sides don't share the same loadout id; clone if collision detected.
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

  /** Return an array of careers that have a mapped loadout on the given side and that loadout currently has at least one equipped item. */
  getNonEmptyCareersForSide(side: LoadoutSide): Career[] {
    const mapped = selectors.getSideCareerLoadoutIds(side); // need selector helper
    const loadouts = loadoutStoreAdapter.getLoadouts();
    const careers: Career[] = [];
    Object.entries(mapped || {}).forEach(([career, loadoutId]) => {
      if (!loadoutId) return;
      const lo = loadouts.find(l => l.id === loadoutId);
      if (!lo) return;
      const hasItem = Object.values(lo.items).some(entry => entry?.item);
      if (hasItem) careers.push(career as Career);
    });
    return careers;
  },

  // Ensure a side has a loadout assigned, creating one if necessary; clones if both sides point to same id.
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

  // Pick a side to edit, ensure its loadout exists, then make it current.
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
  // Guard to indicate character import / bulk apply in progress
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

  // 1. Load data from named character (provisional loadout created immediately to update UI name promptly)
  async loadFromNamedCharacter(characterName: string) {
    // Delegate to external module providing only the required context methods
    return await loadFromNamedCharacterExternal(this._characterImportContext(), characterName);
  },

  // 2. Item / talisman slot mutations
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
    // When importing a character OR when the UI toggle allows invalid selections, bypass validations
    const shouldValidate = !this._isCharacterLoading && getBlockInvalidItems();
    if (shouldValidate && item) {
      validateItemForCurrentLoadout(slot, item);
    }

    updateItemMutation(slot, item);

    // Mark loadout as no longer from character if it was
    const currentLoadout = loadoutStoreAdapter.getCurrentLoadout();
    if (!this._isCharacterLoading && currentLoadout && currentLoadout.isFromCharacter) {
      loadoutStoreAdapter.markLoadoutAsModified(currentLoadout.id);
    }

    // Automatically recalculate stats after item update
    this.getStatsSummary();

    // Update URL with current loadout state (standard helper)
    updateUrlIfAuto(this._isCharacterLoading);
  },

  async updateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null) {
    const shouldValidate = !this._isCharacterLoading && getBlockInvalidItems();
    if (shouldValidate && item) {
      validateItemForLoadout(loadoutId, slot, item);
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

  // Helper method for single slot queries (compat alias)
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

  // 3.5. Fetch talismans for holding item's level requirement (rule: talisman.levelRequirement ≤ holding item.levelRequirement)
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
  /** Alias to getTalismansForItemLevel; slot param unused for compatibility. */
  async getTalismansForSlot(_slot: EquipSlot, holdingLevelRequirement: number, limit: number = 50, after?: string, nameFilter?: string, hasStats?: Stat[], hasRarities?: ItemRarity[], before?: string, last?: number): Promise<any> {
    return await this.getTalismansForItemLevel(holdingLevelRequirement, limit, after, nameFilter, hasStats, hasRarities, before, last);
  },

  // Legendary talisman special-case removed (schema lacks reliable indicators)

  // 3. Retrieve stats summary
  /** Recompute and emit the aggregate stats summary for the current loadout. */
  getStatsSummary() {
    return statsFacade.getStatsSummary({ isBulk: this._isCharacterLoading });
  },

  // Additional utilities / selectors pass-through
  getCurrentLoadout() {
    return selectors.getCurrentLoadout();
  },

  getAllLoadouts() {
    return selectors.getAllLoadouts();
  },

  /** Return the mapped loadout id for a side+career combination (facade for adapter). */
  getSideCareerLoadoutId(side: LoadoutSide, career: Career) {
    return loadoutStoreAdapter.getSideCareerLoadoutId(side, career);
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
  // If active side has no mapping yet, assign this switched loadout.
    if (this.getSideLoadoutId(this.getActiveSide()) == null) {
      this.assignSideLoadout(this.getActiveSide(), id);
    }
    // Recalculate stats for the new loadout
    this.getStatsSummary();

    // Update URL with the new loadout state
  updateUrlIfAuto(this._isCharacterLoading);
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

  // 2) Try existing loadout for this career not used by the other side mapping
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

  // 4. Import character data and create loadout (supports provisional loadout to prevent flicker)
  async importFromCharacter(characterId: string, side?: LoadoutSide, opts?: { preCreatedLoadoutId?: string }): Promise<string> {
    return await importFromCharacterExternal(this._characterImportContext(), characterId, side, opts);
  },

  // Per-loadout setters used by compare flows (emit update + recalc stats + URL sync)
  setCareerForLoadout(loadoutId: string, career: Career | null) {
    loadoutMutations.setCareerForLoadout(this._mutationsContext(), loadoutId, career);
  },
  setLevelForLoadout(loadoutId: string, level: number) {
    loadoutMutations.setLevelForLoadout(this._mutationsContext(), loadoutId, level);
  },
  setRenownForLoadout(loadoutId: string, renownRank: number) {
    loadoutMutations.setRenownForLoadout(this._mutationsContext(), loadoutId, renownRank);
  },
  setLoadoutNameForLoadout(loadoutId: string, name: string) {
    loadoutMutations.setLoadoutNameForLoadout(this._mutationsContext(), loadoutId, name);
  },
  setCharacterStatusForLoadout(loadoutId: string, isFromCharacter: boolean, characterName?: string) {
    loadoutMutations.setCharacterStatusForLoadout(this._mutationsContext(), loadoutId, isFromCharacter, characterName);
  },

  // Clone an existing loadout to a new id
  cloneLoadout(sourceId: string, name?: string): string {
    return cloneLoadoutMutation(sourceId, name);
  },

  // Detailed stats for arbitrary loadout id (delegated)
  computeStatsForLoadout(loadoutId: string, opts?: { includeRenown?: boolean }) {
    return statsFacade.computeStatsForLoadout(loadoutId, opts);
  },

  getStatContributionsForLoadout(loadoutId: string, statKey: keyof import('../../types').StatsSummary | string, opts?: { includeRenown?: boolean }) {
    return statsFacade.getStatContributionsForLoadout(loadoutId, statKey as any, opts as any);
  },

  /** Renown spend cap rule: CR < 40 => min(renownRank, careerRank); CR >= 40 => renownRank; clamped to [0,80]. */
  getRenownSpendCap(loadoutId?: string): number {
    const loadout = loadoutId
      ? loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId) || null
      : loadoutStoreAdapter.getCurrentLoadout();
    if (!loadout) return 0;
    const cr = loadout.level || 0;
    const rr = loadout.renownRank || 0;
    const rawCap = cr < 40 ? Math.min(rr, cr) : rr;
    return Math.max(0, Math.min(80, rawCap));
  },

  // Item details fetcher with caching (LRU + in-flight dedupe)
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

  // Internal: provide the context required by character import module
  _characterImportContext() {
    return {
      getActiveSide: () => this.getActiveSide(),
      ensureSideLoadout: (side: LoadoutSide) => this.ensureSideLoadout(side),
      createLoadout: (name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string) => this.createLoadout(name, level, renownRank, isFromCharacter, characterName),
      assignSideLoadout: (side: LoadoutSide, loadoutId: string | null) => this.assignSideLoadout(side, loadoutId),
      switchLoadout: (id: string) => this.switchLoadout(id),
      setLevelForLoadout: (id: string, level: number) => this.setLevelForLoadout(id, level),
      setRenownForLoadout: (id: string, renown: number) => this.setRenownForLoadout(id, renown),
      setLoadoutNameForLoadout: (id: string, name: string) => this.setLoadoutNameForLoadout(id, name),
      setCareerForLoadout: (id: string, career: Career | null) => this.setCareerForLoadout(id, career),
      resetRenownAbilitiesForLoadout: (id: string) => this.resetRenownAbilitiesForLoadout(id),
      updateItemForLoadout: (id: string, slot: EquipSlot, item: Item | null) => this.updateItemForLoadout(id, slot, item),
      updateItem: (slot: EquipSlot, item: Item | null) => this.updateItem(slot, item),
      updateTalismanForLoadout: (id: string, slot: EquipSlot, index: number, talisman: Item | null) => this.updateTalismanForLoadout(id, slot, index, talisman),
      updateTalisman: (slot: EquipSlot, index: number, talisman: Item | null) => this.updateTalisman(slot, index, talisman),
      beginBulkApply: () => this.beginBulkApply(),
      endBulkApply: () => this.endBulkApply(),
    } as import('./characterImport').CharacterImportContext;
  },
  // Internal: provide context for loadout mutation helpers
  _mutationsContext() {
    return {
      isBulk: this._isCharacterLoading,
      maybeMarkModified: (id?: string) => this._maybeMarkLoadoutAsModified(id),
      recalcStats: () => { this.getStatsSummary(); },
    } as import('./loadoutMutations').LoadoutMutationsContext;
  },

};
