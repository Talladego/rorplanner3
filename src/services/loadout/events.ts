import { loadoutEventEmitter } from '../loadoutEventEmitter';
import type { LoadoutEvents, LoadoutEventType } from '../../types/events';

/** Subscribe to a single loadout event type. Returns an unsubscribe function. */
export function subscribeToEvents<T extends LoadoutEvents>(
  eventType: T['type'],
  callback: (event: T) => void
) {
  return loadoutEventEmitter.subscribe(eventType, callback as (e: LoadoutEvents) => void);
}

/** Subscribe to all loadout event types at once. Returns an unsubscribe for the whole group. */
export function subscribeToAllEvents(callback: (event: LoadoutEvents) => void) {
  const unsubscribeFunctions: (() => void)[] = [];
  const eventTypes: LoadoutEventType[] = [
    'ITEM_UPDATED',
    'TALISMAN_UPDATED',
    'CAREER_CHANGED',
    'LEVEL_CHANGED',
    'RENOWN_RANK_CHANGED',
    'STATS_UPDATED',
    'LOADOUT_CREATED',
    'LOADOUT_SWITCHED',
    'LOADOUT_RESET',
    'CHARACTER_LOADED_FROM_URL',
    'LOADOUT_LOADED_FROM_URL',
    'CHARACTER_LOADED',
    'ACTIVE_SIDE_CHANGED',
    'SIDE_LOADOUT_ASSIGNED',
  ];

  eventTypes.forEach(eventType => {
    unsubscribeFunctions.push(
      loadoutEventEmitter.subscribe(eventType, callback)
    );
  });

  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
}
