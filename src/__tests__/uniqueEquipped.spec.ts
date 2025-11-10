import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { EquipSlot, ItemType, ItemRarity, Career } from '../types';
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

function makeUnique(id: string, slot: EquipSlot) {
  return {
    id,
    name: `Unique ${id}`,
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
    uniqueEquipped: true,
    stats: [],
    careerRestriction: [Career.SLAYER],
    raceRestriction: [],
    iconUrl: '',
    talismanSlots: 0,
    itemSet: null,
    abilities: [],
    buffs: [],
  };
}

describe('Unique-equipped enforcement', () => {
  beforeEach(() => resetStore());

  it('prevents equipping the same unique item twice', () => {
    const id = loadoutService.createLoadout('Test', 40, 80);
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const item = makeUnique('u1', EquipSlot.HELM);
    loadoutStoreAdapter.setItemForLoadout(id, EquipSlot.HELM, item);
    // Try to equip again in another slot (should fail via service validation when using service.updateItem)
    const can = loadoutService.canEquipUniqueItem(item, id);
    expect(can.canEquip).toBe(false);
  });
});
