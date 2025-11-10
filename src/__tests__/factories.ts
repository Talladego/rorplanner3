import { EquipSlot, ItemType, ItemRarity, Career, Stat, Item } from '../types';

export function makeItem(params: Partial<Item> & { id: string; slot: EquipSlot }): Item {
  return {
    id: params.id,
    name: params.name || `Item ${params.id}`,
    description: params.description || '',
    type: params.type || ItemType.SWORD,
    slot: params.slot,
    rarity: params.rarity || ItemRarity.RARE,
    armor: params.armor || 0,
    dps: params.dps || 0,
    speed: params.speed || 0,
    levelRequirement: params.levelRequirement || 1,
    renownRankRequirement: params.renownRankRequirement || 0,
    itemLevel: params.itemLevel || 1,
    uniqueEquipped: params.uniqueEquipped || false,
    stats: params.stats || [],
    careerRestriction: params.careerRestriction || [Career.SLAYER],
    raceRestriction: params.raceRestriction || [],
    iconUrl: params.iconUrl || '',
    talismanSlots: params.talismanSlots || 0,
    itemSet: params.itemSet || null,
    abilities: params.abilities || [],
    buffs: params.buffs || [],
  } as Item;
}

export function makeSetItem(id: string, slot: EquipSlot, setId: string, setName: string, bonuses: { itemsRequired: number; stat: Stat; value: number; percentage?: boolean }[]) {
  return makeItem({
    id,
    slot,
    itemSet: {
      id: setId,
      name: setName,
      level: 1,
      bonuses: bonuses.map(b => ({ itemsRequired: b.itemsRequired, bonus: { stat: b.stat, value: b.value, percentage: !!b.percentage } }))
    }
  });
}
