import { LoadoutEvents, LoadoutEventType } from '../types/events';

type EventCallback = (event: LoadoutEvents) => void;

/**
 * Event emitter for loadout-related events.
 * Provides pub/sub functionality for loadout state changes.
 */
class LoadoutEventEmitter {
  private listeners: Map<LoadoutEventType, EventCallback[]> = new Map();

  /**
   * Subscribe to a specific loadout event type.
   * @param eventType - The type of event to listen for
   * @param callback - Function to call when the event is emitted
   * @returns Unsubscribe function to remove the listener
   */
  subscribe<T extends LoadoutEvents>(
    eventType: T['type'],
    callback: (event: T) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback as EventCallback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit a loadout event to all subscribers.
   * @param event - The event to emit
   */
  emit(event: LoadoutEvents): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event type, or all listeners if no type specified.
   * @param eventType - Optional event type to clear listeners for
   */
  removeAllListeners(eventType?: LoadoutEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

export const loadoutEventEmitter = new LoadoutEventEmitter();
