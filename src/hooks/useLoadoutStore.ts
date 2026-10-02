/**
 * Sanctioned Zustand selector hook for the presentation layer.
 * Components and presentation hooks must use this instead of importing the store/adapter directly.
 */
import { useLoadoutStore as useLoadoutStoreRaw } from '../store/loadout/loadoutStore';

export const useLoadoutStore = useLoadoutStoreRaw;
