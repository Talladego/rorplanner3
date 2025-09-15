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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, callback, ...deps]);
}

export function useLoadoutEvents(callback: (event: LoadoutEvents) => void, deps: React.DependencyList = []) {
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToAllEvents(callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);
}
