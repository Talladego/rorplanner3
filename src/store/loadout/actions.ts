/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Career, EquipSlot, Item, Loadout, LoadoutSide, StatsSummary } from '../../types';
import { createInitialLoadout, initialStats } from './state';
// Consolidated stats computation now lives in services/loadout/stats.
// Store delegates to the shared function instead of duplicating logic here.
import { computeStatsForLoadout } from '../../services/loadout/stats';
// import { mapStatToKey } from './utils'; // no longer needed; stats computed via service
import * as sel from './selectors';

export function buildActions(set: any, get: any) {
  // Ensure unique ids even for rapid successive creations within the same millisecond
  let __loadoutSeq = 0;
  return {
    // Getters
    getCurrentLoadout: (): Loadout | null => sel.getCurrentLoadout(get()),

  getActiveSide: (): LoadoutSide => sel.getActiveSide(get()),

  getSideLoadoutId: (side: LoadoutSide): string | null => sel.getSideLoadoutId(get(), side),

    getLoadoutForSide: (side: LoadoutSide): Loadout | null => sel.getLoadoutForSide(get(), side),

    getSideCareerLoadoutId: (side: LoadoutSide, career: Career): string | null => sel.getSideCareerLoadoutId(get(), side, career),

    // Mappers
    setSideCareerLoadoutId: (side: LoadoutSide, career: Career, loadoutId: string | null) => set((state: any) => {
      const next = { ...state.sideCareerLoadoutIds } as Record<LoadoutSide, Partial<Record<Career, string>>>;
      const inner = { ...(next[side] || {}) } as Partial<Record<Career, string>>;
      if (loadoutId == null) delete inner[career];
      else inner[career] = loadoutId;
      next[side] = inner;
      return { sideCareerLoadoutIds: next };
    }),

    // Mode setters
    setActiveSide: (side: LoadoutSide) => set(() => ({ activeSide: side })),

    assignSideLoadout: (side: LoadoutSide, loadoutId: string | null) => set((state: any) => {
      const next = { ...state.sideLoadoutIds } as Record<LoadoutSide, string | null>;
      next[side] = loadoutId;
      return { sideLoadoutIds: next };
    }),

    // Per-loadout setters
    setCareerForLoadout: (loadoutId: string, career: Career | null) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? { ...l, career } : l)),
    })),

    setLevelForLoadout: (loadoutId: string, level: number) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? { ...l, level } : l)),
    })),

    setRenownForLoadout: (loadoutId: string, renownRank: number) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? { ...l, renownRank } : l)),
    })),

    // Renown ability levels (0-5) per ability
    setRenownAbilityLevel: (ability: keyof NonNullable<Loadout['renownAbilities']>, level: number) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const next = { ...(current.renownAbilities || {}) } as NonNullable<Loadout['renownAbilities']>;
      next[ability] = Math.max(0, Math.min(5, Number(level) || 0));
      const updated = { ...current, renownAbilities: next } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setRenownAbilityLevelForLoadout: (loadoutId: string, ability: keyof NonNullable<Loadout['renownAbilities']>, level: number) => set((state: any) => {
      const target = state.loadouts.find((l: Loadout) => l.id === loadoutId) as Loadout | undefined;
      if (!target) return state;
      const next = { ...(target.renownAbilities || {}) } as NonNullable<Loadout['renownAbilities']>;
      next[ability] = Math.max(0, Math.min(5, Number(level) || 0));
      const updated = { ...target, renownAbilities: next } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? updated : l)) };
    }),

    resetRenownAbilities: () => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
  const zeros = { might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0, opportunist: 0, spiritualRefinement: 0, regeneration: 0, reflexes: 0, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0 } as NonNullable<Loadout['renownAbilities']>;
      const updated = { ...current, renownAbilities: zeros } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    resetRenownAbilitiesForLoadout: (loadoutId: string) => set((state: any) => {
      const target = state.loadouts.find((l: Loadout) => l.id === loadoutId) as Loadout | undefined;
      if (!target) return state;
  const zeros = { might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0, opportunist: 0, spiritualRefinement: 0, regeneration: 0, reflexes: 0, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0 } as NonNullable<Loadout['renownAbilities']>;
      const updated = { ...target, renownAbilities: zeros } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? updated : l)) };
    }),

    setLoadoutNameForLoadout: (loadoutId: string, name: string) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? { ...l, name } : l)),
    })),

    resetLoadoutById: (loadoutId: string) => set((state: any) => {
      const side = (Object.entries(state.sideLoadoutIds) as Array<[LoadoutSide, string | null]>).find(([, id]) => id === loadoutId)?.[0];
      const defaultName = side === 'A' ? 'Side A' : side === 'B' ? 'Side B' : 'Default Loadout';
      const reset = createInitialLoadout(loadoutId, defaultName);
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? reset : l)) };
    }),

    // Current loadout setters
    setCareer: (career: Career | null) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const updated = { ...current, career } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setLevel: (level: number) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const updated = { ...current, level } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setRenownRank: (renownRank: number) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const updated = { ...current, renownRank } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setItem: (slot: EquipSlot, item: Item | null) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const newItems = { ...current.items } as Loadout['items'];
      newItems[slot] = { ...newItems[slot], item };
      newItems[slot].talismans = item ? new Array(item.talismanSlots).fill(null) : [];
      const updated = { ...current, items: newItems } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setTalisman: (slot: EquipSlot, index: number, talisman: Item | null) => set((state: any) => {
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const newItems = { ...current.items } as Loadout['items'];
      const talismans = [...newItems[slot].talismans];
      talismans[index] = talisman;
      newItems[slot] = { ...newItems[slot], talismans };
      const updated = { ...current, items: newItems } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setItemForLoadout: (loadoutId: string, slot: EquipSlot, item: Item | null) => set((state: any) => {
      const target = state.loadouts.find((l: Loadout) => l.id === loadoutId) as Loadout | undefined;
      if (!target) return state;
      const newItems = { ...target.items } as Loadout['items'];
      newItems[slot] = { ...newItems[slot], item };
      newItems[slot].talismans = item ? new Array(item.talismanSlots).fill(null) : [];
      const updated = { ...target, items: newItems } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? updated : l)) };
    }),

    setTalismanForLoadout: (loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null) => set((state: any) => {
      const target = state.loadouts.find((l: Loadout) => l.id === loadoutId) as Loadout | undefined;
      if (!target) return state;
      const newItems = { ...target.items } as Loadout['items'];
      const talismans = [...newItems[slot].talismans];
      talismans[index] = talisman;
      newItems[slot] = { ...newItems[slot], talismans };
      const updated = { ...target, items: newItems } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === loadoutId ? updated : l)) };
    }),

    resetCurrentLoadout: () => set((state: any) => {
      const current = state.getCurrentLoadout() as Loadout | null;
      if (!current) return state;
      let defaultName = 'Default Loadout';
      if (state.sideLoadoutIds.A === current.id) defaultName = 'Side A';
      else if (state.sideLoadoutIds.B === current.id) defaultName = 'Side B';
      const reset = createInitialLoadout(current.id, defaultName);
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? reset : l)) };
    }),

    // Delegate to consolidated computeStatsForLoadout (single source of truth).
    // This ensures set bonuses, unique-equipped rules, slot validation, shields, and renown are applied consistently.
    calculateStats: () => set((state: any) => {
      const current = state.getCurrentLoadout() as Loadout | null;
      if (!current) return { statsSummary: initialStats };
      const stats: StatsSummary = computeStatsForLoadout(current.id, { includeRenown: true });
      return { statsSummary: stats };
    }),

    // Multi-loadout management
    createLoadout: (name: string, level: number = 40, renownRank: number = 80, isFromCharacter: boolean = false, characterName?: string): string => {
      const id = `loadout-${Date.now()}-${++__loadoutSeq}`;
      set((state: any) => ({
        loadouts: [...state.loadouts, createInitialLoadout(id, name, level, renownRank, isFromCharacter, characterName)],
        currentLoadoutId: state.currentLoadoutId || id,
        sideLoadoutIds: state.sideLoadoutIds[state.activeSide] == null
          ? { ...state.sideLoadoutIds, [state.activeSide]: id }
          : state.sideLoadoutIds,
      }));
      return id;
    },

    deleteLoadout: (id: string) => set((state: any) => {
      const newLoadouts: Loadout[] = state.loadouts.filter((l: Loadout) => l.id !== id);
      let newCurrent: string | null = state.currentLoadoutId;
      if (state.currentLoadoutId === id) newCurrent = newLoadouts.length > 0 ? newLoadouts[0].id : null;
      const nextSideMap = { ...state.sideLoadoutIds } as Record<LoadoutSide, string | null>;
      (['A', 'B'] as LoadoutSide[]).forEach((s) => { if (nextSideMap[s] === id) nextSideMap[s] = null; });
      const nextCareerMap = { ...state.sideCareerLoadoutIds } as Record<LoadoutSide, Partial<Record<Career, string>>>;
      (['A', 'B'] as LoadoutSide[]).forEach((s) => {
        const inner = { ...(nextCareerMap[s] || {}) } as Partial<Record<Career, string>>;
        Object.entries(inner).forEach(([career, lid]) => {
          if (lid === id) delete inner[career as Career];
        });
        nextCareerMap[s] = inner;
      });
      return { loadouts: newLoadouts, currentLoadoutId: newCurrent, sideLoadoutIds: nextSideMap, sideCareerLoadoutIds: nextCareerMap };
    }),

    switchLoadout: (id: string) => Promise.resolve(set(() => ({ currentLoadoutId: id }))),

    markLoadoutAsModified: (id: string) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => {
        if (l.id !== id) return l;
        const newName = l.name.startsWith('Imported from ')
          ? l.name.replace(/^Imported from\s+/, '').trim()
          : l.name;
        return { ...l, isFromCharacter: false, characterName: undefined, name: newName } as Loadout;
      }),
    })),

    updateLoadoutCharacterStatus: (id: string, isFromCharacter: boolean, characterName?: string) => set((state: any) => ({
      loadouts: state.loadouts.map((l: Loadout) => (l.id === id ? { ...l, isFromCharacter, characterName } as Loadout : l)),
    })),
  };
}
