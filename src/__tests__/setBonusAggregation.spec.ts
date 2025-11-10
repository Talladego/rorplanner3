import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { EquipSlot, ItemType, ItemRarity, Career, Stat } from '../types';
import { initialStats } from '../store/loadout/state';

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

function makeItem(id: string, slot: EquipSlot, setId: string, setName: string, bonusStat: Stat, bonusValue: number) {
  return {
    id,
    name: `Item ${id}`,
    description: '',
    type: ItemType.SWORD,
    slot,
    rarity: ItemRarity.RARE,
    armor: 0,
    dps: 0,
    speed: 0,
    levelRequirement: 1,
    renownRankRequirement: 0,
    itemLevel: 1,
    uniqueEquipped: false,
    stats: [],
    careerRestriction: [Career.SLAYER],
    raceRestriction: [],
    iconUrl: '',
    talismanSlots: 0,
    itemSet: {
      id: setId,
      name: setName,
      level: 1,
      bonuses: [
        { itemsRequired: 2, bonus: { stat: bonusStat, value: bonusValue, percentage: false } },
      ],
    },
    abilities: [],
    buffs: [],
  };
}

describe('Set bonus aggregation by ID', () => {
  beforeEach(() => resetStore());

  it('awards bonuses separately for sets with same name but different IDs', () => {
    const loadoutId = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);

    // Two sets both named "Duplicate Set" but different IDs
  const itemA1 = makeItem('a1', EquipSlot.HELM, 'SET_A', 'Duplicate Set', Stat.STRENGTH, 5);
  const itemA2 = makeItem('a2', EquipSlot.SHOULDER, 'SET_A', 'Duplicate Set', Stat.STRENGTH, 5);
  const itemB1 = makeItem('b1', EquipSlot.GLOVES, 'SET_B', 'Duplicate Set', Stat.STRENGTH, 7);
  const itemB2 = makeItem('b2', EquipSlot.BOOTS, 'SET_B', 'Duplicate Set', Stat.STRENGTH, 7);

    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.HELM, itemA1);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.SHOULDER, itemA2);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.GLOVES, itemB1);
    loadoutStoreAdapter.setItemForLoadout(loadoutId, EquipSlot.BOOTS, itemB2);

  const stats = loadoutService.computeStatsForLoadout(loadoutId, { includeRenown: false });
  // Each set's 2-piece bonus triggers once per set (not per piece): 5 (SET_A) + 7 (SET_B) = 12
  expect(stats.strength).toBe(12);
  });
});
