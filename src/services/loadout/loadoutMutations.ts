import { loadoutEventEmitter } from './loadoutEventEmitter';
import { updateUrlIfAuto } from './urlSync';
import { Career } from '../../types';
import {
  setCareerForLoadout as setCareerForLoadoutMutation,
  setLevelForLoadout as setLevelForLoadoutMutation,
  setRenownForLoadout as setRenownForLoadoutMutation,
  setLoadoutNameForLoadout as setLoadoutNameForLoadoutMutation,
  setCharacterStatusForLoadout as setCharacterStatusForLoadoutMutation,
} from './mutations';

export interface LoadoutMutationsContext {
  isBulk: boolean;
  maybeMarkModified: (loadoutId?: string) => void;
  recalcStats: () => void;
}

export function setCareerForLoadout(ctx: LoadoutMutationsContext, loadoutId: string, career: Career | null) {
  setCareerForLoadoutMutation(loadoutId, career);
  ctx.maybeMarkModified(loadoutId);
  loadoutEventEmitter.emit({ type: 'CAREER_CHANGED', payload: { career }, timestamp: Date.now() });
  ctx.recalcStats();
  updateUrlIfAuto(ctx.isBulk);
}

export function setLevelForLoadout(ctx: LoadoutMutationsContext, loadoutId: string, level: number) {
  setLevelForLoadoutMutation(loadoutId, level);
  ctx.maybeMarkModified(loadoutId);
  loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level }, timestamp: Date.now() });
  ctx.recalcStats();
  updateUrlIfAuto(ctx.isBulk);
}

export function setRenownForLoadout(ctx: LoadoutMutationsContext, loadoutId: string, renownRank: number) {
  setRenownForLoadoutMutation(loadoutId, renownRank);
  ctx.maybeMarkModified(loadoutId);
  loadoutEventEmitter.emit({ type: 'RENOWN_RANK_CHANGED', payload: { renownRank }, timestamp: Date.now() });
  ctx.recalcStats();
  updateUrlIfAuto(ctx.isBulk);
}

export function setLoadoutNameForLoadout(ctx: LoadoutMutationsContext, loadoutId: string, name: string) {
  setLoadoutNameForLoadoutMutation(loadoutId, name);
  ctx.maybeMarkModified(loadoutId);
  // Keep existing behavior emitting LOADOUT_SWITCHED on rename
  loadoutEventEmitter.emit({ type: 'LOADOUT_SWITCHED', payload: { loadoutId }, timestamp: Date.now() });
  updateUrlIfAuto(ctx.isBulk);
}

export function setCharacterStatusForLoadout(ctx: LoadoutMutationsContext, loadoutId: string, isFromCharacter: boolean, characterName?: string) {
  setCharacterStatusForLoadoutMutation(loadoutId, isFromCharacter, characterName);
  loadoutEventEmitter.emit({ type: 'LOADOUT_SWITCHED', payload: { loadoutId }, timestamp: Date.now() });
  updateUrlIfAuto(ctx.isBulk);
}
