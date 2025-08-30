import { EquipSlot, Item, Career } from '../types';

export type LoadoutEventType =
  | 'ITEM_UPDATED'
  | 'TALISMAN_UPDATED'
  | 'CAREER_CHANGED'
  | 'LEVEL_CHANGED'
  | 'RENOWN_RANK_CHANGED'
  | 'STATS_UPDATED'
  | 'LOADOUT_CREATED'
  | 'LOADOUT_SWITCHED'
  | 'LOADOUT_RESET';

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

import { StatsSummary } from './index';

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

export type LoadoutEvents =
  | ItemUpdatedEvent
  | TalismanUpdatedEvent
  | CareerChangedEvent
  | LevelChangedEvent
  | RenownRankChangedEvent
  | StatsUpdatedEvent
  | LoadoutCreatedEvent
  | LoadoutSwitchedEvent
  | LoadoutResetEvent;
