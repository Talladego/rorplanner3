import { describe, it, expect, beforeEach } from 'vitest';
import { getItemEligibility, getTalismanEligibility, validateItemForCurrentLoadout } from '../services/loadout/equipmentValidation';
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

function makeItem(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? 'i1',
    name: overrides.name ?? 'Item',
    description: '',
    type: overrides.type ?? ItemType.SWORD,
    slot: overrides.slot ?? EquipSlot.HELM,
    rarity: overrides.rarity ?? ItemRarity.RARE,
    armor: overrides.armor ?? 0,
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

describe('equipmentValidation', () => {
  beforeEach(() => resetStore());

  it('getItemEligibility flags slot incompatibility', () => {
    const id = loadoutStoreAdapter.createLoadout('Test', 40, 80);
    // Make it current
    useLoadoutStore.setState(s => ({ ...s, currentLoadoutId: id }));
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const item = makeItem({ slot: EquipSlot.BODY });
    const res = getItemEligibility(EquipSlot.HELM, item);
    expect(res.eligible).toBe(false);
    expect(res.reasons.some(r => r.includes('Not compatible with this slot'))).toBe(true);
  });

  it('validateItemForCurrentLoadout blocks off-hand when a two-handed main-hand is equipped', () => {
    const id = loadoutStoreAdapter.createLoadout('Test', 40, 80);
    useLoadoutStore.setState(s => ({ ...s, currentLoadoutId: id }));
    loadoutStoreAdapter.setCareer(Career.BRIGHT_WIZARD);
    // Equip a two-handed staff in main hand
    const staff = makeItem({ id: 'staff', type: ItemType.STAFF, slot: EquipSlot.MAIN_HAND, dps: 600, itemLevel: 70, levelRequirement: 40 });
    loadoutStoreAdapter.setItemForLoadout(id, EquipSlot.MAIN_HAND, staff);
    const off = makeItem({ id: 'off', slot: EquipSlot.OFF_HAND, type: ItemType.DAGGER });
    expect(() => validateItemForCurrentLoadout(EquipSlot.OFF_HAND, off)).toThrow('off-hand');
  });

  it('getTalismanEligibility detects duplicate earlier talisman on same item', () => {
    const id = loadoutStoreAdapter.createLoadout('Test', 40, 80);
    useLoadoutStore.setState(s => ({ ...s, currentLoadoutId: id }));
    loadoutStoreAdapter.setCareer(Career.SLAYER);
    const helm = makeItem({ id: 'helm', slot: EquipSlot.HELM, talismanSlots: 2 });
    loadoutStoreAdapter.setItemForLoadout(id, EquipSlot.HELM, helm);
    const tali = makeItem({ id: 't1', slot: EquipSlot.STANDARD, type: ItemType.ENHANCEMENT });
    // Place talisman at index 0
    loadoutStoreAdapter.setTalismanForLoadout(id, EquipSlot.HELM, 0, tali);
    // Eligibility for same talisman at index 1 should flag duplicate
    const res = getTalismanEligibility(EquipSlot.HELM, 1, tali);
    expect(res.eligible).toBe(false);
    expect(res.reasons.some(r => r.includes('Duplicate talisman'))).toBe(true);
  });
});
