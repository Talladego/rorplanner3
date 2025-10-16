import { LoadoutEvents, LoadoutEventType } from '../../types/events';

type EventCallback = (event: LoadoutEvents) => void;

class LoadoutEventEmitter {
  private listeners: Map<LoadoutEventType, EventCallback[]> = new Map();

  subscribe<T extends LoadoutEvents>(eventType: T['type'], callback: (event: T) => void): () => void {
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, []);
    this.listeners.get(eventType)!.push(callback as EventCallback);
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback as EventCallback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  emit(event: LoadoutEvents): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => {
        try { cb(event); } catch (error) { console.error(`Error in event listener for ${event.type}:`, error); }
      });
    }
  }

  removeAllListeners(eventType?: LoadoutEventType): void {
    if (eventType) this.listeners.delete(eventType);
    else this.listeners.clear();
  }
}

export const loadoutEventEmitter = new LoadoutEventEmitter();
