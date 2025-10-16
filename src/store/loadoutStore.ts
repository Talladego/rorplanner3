import { create } from 'zustand';
import { Loadout, EquipSlot, Career, Item, StatsSummary, LoadoutSide } from '../types';
import { initialStats } from './loadout/state';
import { buildActions } from './loadout/actions';
// Note: The data layer must not depend on the service layer. Do not import loadoutService here.

interface LoadoutState {
  loadouts: Loadout[];
  currentLoadoutId: string | null;
  // Compare mode state (dual-only)
  activeSide: LoadoutSide; // which side is currently being edited/viewed
  sideLoadoutIds: Record<LoadoutSide, string | null>; // mapping from side to loadout id
  sideCareerLoadoutIds: Record<LoadoutSide, Partial<Record<Career, string>>>; // per-side, per-career mapping
  statsSummary: StatsSummary;
  // Actions for current loadout
  setCareer: (career: Career | null) => void;
  setLevel: (level: number) => void;
  setRenownRank: (renownRank: number) => void;
  setItem: (slot: EquipSlot, item: Item | null) => void;
  setTalisman: (slot: EquipSlot, index: number, talisman: Item | null) => void;
  setItemForLoadout: (loadoutId: string, slot: EquipSlot, item: Item | null) => void;
  setTalismanForLoadout: (loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null) => void;
  setCareerForLoadout: (loadoutId: string, career: Career | null) => void;
  setLevelForLoadout: (loadoutId: string, level: number) => void;
  setRenownForLoadout: (loadoutId: string, renownRank: number) => void;
  setLoadoutNameForLoadout: (loadoutId: string, name: string) => void;
  resetLoadoutById: (loadoutId: string) => void;
  resetCurrentLoadout: () => void;
  calculateStats: () => void;
  // Mode actions
  getActiveSide: () => LoadoutSide;
  setActiveSide: (side: LoadoutSide) => void;
  getSideLoadoutId: (side: LoadoutSide) => string | null;
  getLoadoutForSide: (side: LoadoutSide) => Loadout | null;
  getSideCareerLoadoutId: (side: LoadoutSide, career: Career) => string | null;
  setSideCareerLoadoutId: (side: LoadoutSide, career: Career, loadoutId: string | null) => void;
  assignSideLoadout: (side: LoadoutSide, loadoutId: string | null) => void;
  // Actions for multiple loadouts
  createLoadout: (name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string) => string;
  deleteLoadout: (id: string) => void;
  switchLoadout: (id: string) => Promise<void>;
  markLoadoutAsModified: (id: string) => void; // Mark loadout as no longer from character
  updateLoadoutCharacterStatus: (id: string, isFromCharacter: boolean, characterName?: string) => void; // Update character status
  getCurrentLoadout: () => Loadout | null;
}

// moved createInitialLoadout and initialStats to ./loadout/state

export const useLoadoutStore = create<LoadoutState>((set, get) => ({
  loadouts: [],
  currentLoadoutId: null,
  activeSide: 'A',
  sideLoadoutIds: { A: null, B: null },
  sideCareerLoadoutIds: { A: {}, B: {} },
  statsSummary: initialStats,
  ...buildActions(set, get),
}));
