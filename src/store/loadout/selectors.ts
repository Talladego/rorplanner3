import type { Career, Loadout, LoadoutSide } from '../../types';

// Minimal subset of state required by selectors
export type LoadoutStateShape = {
  loadouts: Loadout[];
  currentLoadoutId: string | null;
  activeSide: LoadoutSide;
  sideLoadoutIds: Record<LoadoutSide, string | null>;
  sideCareerLoadoutIds: Record<LoadoutSide, Partial<Record<Career, string>>>;
};

export const getCurrentLoadout = (state: LoadoutStateShape): Loadout | null => {
  const { loadouts, currentLoadoutId } = state;
  return loadouts.find(l => l.id === currentLoadoutId) || null;
};

export const getActiveSide = (state: LoadoutStateShape): LoadoutSide => state.activeSide;

export const getSideLoadoutId = (state: LoadoutStateShape, side: LoadoutSide): string | null =>
  state.sideLoadoutIds[side];

export const getLoadoutForSide = (state: LoadoutStateShape, side: LoadoutSide): Loadout | null => {
  const id = state.sideLoadoutIds[side];
  if (!id) return null;
  return state.loadouts.find(l => l.id === id) || null;
};

export const getSideCareerLoadoutId = (
  state: LoadoutStateShape,
  side: LoadoutSide,
  career: Career,
): string | null => {
  const map = state.sideCareerLoadoutIds[side];
  return (map && map[career]) || null;
};
