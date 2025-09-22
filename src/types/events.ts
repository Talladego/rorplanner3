import { EquipSlot, Item, Career } from '../types';
import { StatsSummary } from './index';

export type LoadoutEventType =
  | 'ITEM_UPDATED'
  | 'TALISMAN_UPDATED'
  | 'CAREER_CHANGED'
  | 'LEVEL_CHANGED'
  | 'RENOWN_RANK_CHANGED'
  | 'STATS_UPDATED'
  | 'LOADOUT_CREATED'
  | 'LOADOUT_SWITCHED'
  | 'LOADOUT_RESET'
  | 'CHARACTER_LOADED_FROM_URL'
  | 'LOADOUT_LOADED_FROM_URL'
  | 'CHARACTER_LOADED'
  | 'MODE_CHANGED'
  | 'ACTIVE_SIDE_CHANGED'
  | 'SIDE_LOADOUT_ASSIGNED';

export interface LoadoutEvent {
  type: LoadoutEventType;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export interface ItemUpdatedEvent extends LoadoutEvent {
  type: 'ITEM_UPDATED';
  payload: {
    slot: EquipSlot;
    item: Item | null;
  };
}

export interface TalismanUpdatedEvent extends LoadoutEvent {
  type: 'TALISMAN_UPDATED';
  payload: {
    slot: EquipSlot;
    index: number;
    talisman: Item | null;
  };
}

export interface CareerChangedEvent extends LoadoutEvent {
  type: 'CAREER_CHANGED';
  payload: {
    career: Career | null;
  };
}

export interface LevelChangedEvent extends LoadoutEvent {
  type: 'LEVEL_CHANGED';
  payload: {
    level: number;
  };
}

export interface RenownRankChangedEvent extends LoadoutEvent {
  type: 'RENOWN_RANK_CHANGED';
  payload: {
    renownRank: number;
  };
}

export interface StatsUpdatedEvent extends LoadoutEvent {
  type: 'STATS_UPDATED';
  payload: {
    stats: StatsSummary;
  };
}

export interface LoadoutCreatedEvent extends LoadoutEvent {
  type: 'LOADOUT_CREATED';
  payload: {
    loadoutId: string;
    name: string;
  };
}

export interface LoadoutSwitchedEvent extends LoadoutEvent {
  type: 'LOADOUT_SWITCHED';
  payload: {
    loadoutId: string;
  };
}

export interface LoadoutResetEvent extends LoadoutEvent {
  type: 'LOADOUT_RESET';
  payload: {
    loadoutId: string;
  };
}

export interface CharacterLoadedFromUrlEvent extends LoadoutEvent {
  type: 'CHARACTER_LOADED_FROM_URL';
  payload: {
    characterName: string;
    characterId: string;
  };
}

export interface LoadoutLoadedFromUrlEvent extends LoadoutEvent {
  type: 'LOADOUT_LOADED_FROM_URL';
  payload: {
    loadoutId: string;
  };
}

export interface CharacterLoadedEvent extends LoadoutEvent {
  type: 'CHARACTER_LOADED';
  payload: {
    characterName: string;
    characterId: string;
  };
}

export interface ModeChangedEvent extends LoadoutEvent {
  type: 'MODE_CHANGED';
  payload: {
    mode: import('../types').LoadoutMode;
  };
}

export interface ActiveSideChangedEvent extends LoadoutEvent {
  type: 'ACTIVE_SIDE_CHANGED';
  payload: {
    side: import('../types').LoadoutSide;
  };
}

export interface SideLoadoutAssignedEvent extends LoadoutEvent {
  type: 'SIDE_LOADOUT_ASSIGNED';
  payload: {
    side: import('../types').LoadoutSide;
    loadoutId: string | null;
  };
}

export type LoadoutEvents =
  | ItemUpdatedEvent
  | TalismanUpdatedEvent
  | CareerChangedEvent
  | LevelChangedEvent
  | RenownRankChangedEvent
  | StatsUpdatedEvent
  | LoadoutCreatedEvent
  | LoadoutSwitchedEvent
  | LoadoutResetEvent
  | CharacterLoadedFromUrlEvent
  | LoadoutLoadedFromUrlEvent
  | CharacterLoadedEvent
  | ModeChangedEvent
  | ActiveSideChangedEvent
  | SideLoadoutAssignedEvent;
