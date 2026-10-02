/* eslint-disable @typescript-eslint/no-explicit-any */
import { EquipSlot, type Career, type Item, type Loadout, type LoadoutSide, type StatsSummary } from '../../types';
import { createInitialLoadout } from './state';
import { emptyRenownAbilities } from '../../services/loadout/renownConfig';
import * as sel from './selectors';
import type { StoreApi } from 'zustand';

/** Minimal store shape needed by action builders (avoids circular import with loadoutStore). */
type ActionsStore = {
  loadouts: Loadout[];
  currentLoadoutId: string | null;
  activeSide: LoadoutSide;
  sideLoadoutIds: Record<LoadoutSide, string | null>;
  sideCareerLoadoutIds: Record<LoadoutSide, Partial<Record<Career, string>>>;
  statsSummary: StatsSummary;
  getCurrentLoadout: () => Loadout | null;
  getActiveSide: () => LoadoutSide;
  getSideLoadoutId: (side: LoadoutSide) => string | null;
  getLoadoutForSide: (side: LoadoutSide) => Loadout | null;
  getSideCareerLoadoutId: (side: LoadoutSide, career: Career) => string | null;
};

type SetState = StoreApi<ActionsStore>['setState'];
type GetState = StoreApi<ActionsStore>['getState'];

export function buildActions(set: SetState, get: GetState) {
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
      if (ability === 'regeneration') return state;
      const current = state.getCurrentLoadout();
      if (!current) return state;
      const next = { ...(current.renownAbilities || {}) } as NonNullable<Loadout['renownAbilities']>;
      next[ability] = Math.max(0, Math.min(5, Number(level) || 0));
      const updated = { ...current, renownAbilities: next } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    setRenownAbilityLevelForLoadout: (loadoutId: string, ability: keyof NonNullable<Loadout['renownAbilities']>, level: number) => set((state: any) => {
      if (ability === 'regeneration') return state;
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
      const updated = { ...current, renownAbilities: emptyRenownAbilities() } as Loadout;
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === current.id ? updated : l)) };
    }),

    resetRenownAbilitiesForLoadout: (loadoutId: string) => set((state: any) => {
      const target = state.loadouts.find((l: Loadout) => l.id === loadoutId) as Loadout | undefined;
      if (!target) return state;
      const updated = { ...target, renownAbilities: emptyRenownAbilities() } as Loadout;
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

    // Single write so a side-to-side copy does not nest a React update per slot.
    copyLoadoutOnto: (targetId: string, sourceId: string) => set((state: any) => {
      if (!targetId || !sourceId || targetId === sourceId) return state;
      const source = state.loadouts.find((l: Loadout) => l.id === sourceId) as Loadout | undefined;
      const target = state.loadouts.find((l: Loadout) => l.id === targetId) as Loadout | undefined;
      if (!source || !target) return state;
      const slotKeys = new Set<string>([
        ...Object.values(EquipSlot),
        ...Object.keys(source.items || {}),
      ]);
      const items = {} as Loadout['items'];
      slotKeys.forEach((slot) => {
        const data = source.items?.[slot as EquipSlot];
        items[slot as EquipSlot] = {
          item: data?.item ?? null,
          talismans: data?.talismans ? data.talismans.slice() : [],
        };
      });
      const renownAbilities = {
        ...emptyRenownAbilities(),
        ...(source.renownAbilities || {}),
      };
      delete (renownAbilities as { regeneration?: number }).regeneration;
      const updated: Loadout = {
        ...target,
        career: source.career,
        level: source.level,
        renownRank: source.renownRank,
        renownAbilities,
        isFromCharacter: !!source.isFromCharacter,
        characterName: source.characterName,
        items,
      };
      return { loadouts: state.loadouts.map((l: Loadout) => (l.id === targetId ? updated : l)) };
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

    // Pure stats write — computation lives in statsFacade.
    setStatsSummary: (stats: StatsSummary) => set(() => ({
      statsSummary: stats,
    })),

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
