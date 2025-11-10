import { loadoutEventEmitter } from '../services/loadout/loadoutEventEmitter';
import type { LoadoutEvents } from '../types/events';

describe('loadoutEventEmitter', () => {
  afterEach(() => {
    (loadoutEventEmitter as any).removeAllListeners();
  });

  it('subscribes and receives a single event type', () => {
    const received: LoadoutEvents[] = [];
    const unsub = loadoutEventEmitter.subscribe('LEVEL_CHANGED', (e) => { received.push(e); });
    loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level: 25 }, timestamp: Date.now() });
    unsub();
    loadoutEventEmitter.emit({ type: 'LEVEL_CHANGED', payload: { level: 30 }, timestamp: Date.now() }); // should not receive
    expect(received.length).toBe(1);
    expect(received[0].type).toBe('LEVEL_CHANGED');
    expect((received[0] as any).payload.level).toBe(25);
  });

  it('handles errors in listeners without stopping other listeners', () => {
    const calls: string[] = [];
    loadoutEventEmitter.subscribe('ITEM_UPDATED', () => { calls.push('a'); throw new Error('boom'); });
    loadoutEventEmitter.subscribe('ITEM_UPDATED', () => { calls.push('b'); });
    loadoutEventEmitter.emit({ type: 'ITEM_UPDATED', payload: { slot: 'MAIN_HAND', item: null }, timestamp: Date.now() } as any);
    expect(calls).toEqual(['a','b']);
  });
});
