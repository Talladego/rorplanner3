import React, { useEffect } from 'react';
import { loadoutService } from '../services/loadoutService';
import { LoadoutEvents } from '../types/events';

export function useLoadoutEvent<T extends LoadoutEvents>(
  eventType: T['type'],
  callback: (event: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToEvents(eventType, callback);
    return unsubscribe;
  }, deps);
}

export function useLoadoutEvents(callback: (event: LoadoutEvents) => void, deps: React.DependencyList = []) {
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToAllEvents(callback);
    return unsubscribe;
  }, deps);
}
