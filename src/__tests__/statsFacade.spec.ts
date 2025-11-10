import { describe, it, expect, beforeEach } from 'vitest';
import * as statsFacade from '../services/loadout/statsFacade';
import { loadoutEventEmitter } from '../services/loadout/loadoutEventEmitter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { EquipSlot, ItemType, ItemRarity, Career } from '../types';

function resetStore() {
  useLoadoutStore.setState((state: any) => ({
    ...state,
    loadouts: [],
    currentLoadoutId: null,
    sideLoadoutIds: { A: null, B: null },
    sideCareerLoadoutIds: { A: {}, B: {} },
    statsSummary: initialStats,
  }));
}

function makeItem(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 'itm',
    name: overrides.name ?? 'Test Item',
    description: '',
    type: overrides.type ?? ItemType.SWORD,
    slot: overrides.slot ?? EquipSlot.HELM,
    rarity: overrides.rarity ?? ItemRarity.COMMON,
    armor: overrides.armor ?? 50,
    dps: overrides.dps ?? 0,
    speed: overrides.speed ?? 0,
    levelRequirement: overrides.levelRequirement ?? 1,
    renownRankRequirement: overrides.renownRankRequirement ?? 0,
    itemLevel: overrides.itemLevel ?? 1,
    uniqueEquipped: overrides.uniqueEquipped ?? false,
    stats: overrides.stats ?? [],
    careerRestriction: overrides.careerRestriction ?? [],
    raceRestriction: overrides.raceRestriction ?? [],
    iconUrl: overrides.iconUrl ?? '',
    talismanSlots: overrides.talismanSlots ?? 0,
    itemSet: overrides.itemSet ?? null,
    abilities: overrides.abilities ?? [],
    buffs: overrides.buffs ?? [],
  };
}

describe('statsFacade', () => {
  beforeEach(() => resetStore());

  it('emits STATS_UPDATED when getStatsSummary is called', () => {
    const events: string[] = [];
    const unsub = loadoutEventEmitter.subscribe('STATS_UPDATED', (evt: any) => events.push(evt.type));
    // Create a loadout and make it current
    const id = useLoadoutStore.getState().createLoadout('StatsTest', 40, 80);
    useLoadoutStore.setState(s => ({ ...s, currentLoadoutId: id }));
    useLoadoutStore.getState().setCareer(Career.SLAYER);
    // Equip an item to ensure stats calculation does some work
    useLoadoutStore.getState().setItemForLoadout(id, EquipSlot.HELM, makeItem());
    const stats = statsFacade.getStatsSummary({ isBulk: false });
    expect(stats).toBeDefined();
  expect(events.includes('STATS_UPDATED')).toBe(true);
    unsub();
  });

  it('computeStatsForLoadout returns a stats detail object', () => {
    const id = useLoadoutStore.getState().createLoadout('StatsDetail', 40, 80);
    useLoadoutStore.setState(s => ({ ...s, currentLoadoutId: id }));
    useLoadoutStore.getState().setCareer(Career.SLAYER);
    useLoadoutStore.getState().setItemForLoadout(id, EquipSlot.HELM, makeItem());
    const summary = statsFacade.getStatsSummary({ isBulk: false });
    // Use one of the known stat keys from summary object
    const contrib = statsFacade.getStatContributionsForLoadout(id, 'armor');
    expect(summary).toBeDefined();
    expect(contrib).toBeDefined();
  });
});
