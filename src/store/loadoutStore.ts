import { create } from 'zustand';
import { Loadout, LoadoutItem, EquipSlot, Career, Item, StatsSummary, ItemSetBonus, ItemSet } from '../types';

interface LoadoutState {
  loadouts: Loadout[];
  currentLoadoutId: string | null;
  statsSummary: StatsSummary;
  // Actions for current loadout
  setCareer: (career: Career) => void;
  setLevel: (level: number) => void;
  setRenownRank: (renownRank: number) => void;
  setItem: (slot: EquipSlot, item: Item | null) => void;
  setTalisman: (slot: EquipSlot, index: number, talisman: Item | null) => void;
  resetCurrentLoadout: () => void;
  calculateStats: () => void;
  // Actions for multiple loadouts
  createLoadout: (name: string, level?: number, renownRank?: number) => string;
  deleteLoadout: (id: string) => void;
  switchLoadout: (id: string) => void;
  importFromCharacter: (characterId: string) => Promise<string>; // Will use GraphQL
  getCurrentLoadout: () => Loadout | null;
}

const createInitialLoadout = (id: string, name: string, level: number = 40, renownRank: number = 80): Loadout => ({
  id,
  name,
  career: null,
  level,
  renownRank,
  items: Object.values(EquipSlot).reduce((acc, slot) => {
    acc[slot] = { item: null, talismans: [] };
    return acc;
  }, {} as Record<EquipSlot, LoadoutItem>),
});

const initialStats: StatsSummary = {
  strength: 0,
  agility: 0,
  willpower: 0,
  toughness: 0,
  wounds: 0,
  initiative: 0,
  weaponSkill: 0,
  ballisticSkill: 0,
  intelligence: 0,
  spiritResistance: 0,
  elementalResistance: 0,
  corporealResistance: 0,
  incomingDamage: 0,
  incomingDamagePercent: 0,
  outgoingDamage: 0,
  outgoingDamagePercent: 0,
  armor: 0,
  velocity: 0,
  block: 0,
  parry: 0,
  evade: 0,
  disrupt: 0,
  actionPointRegen: 0,
  moraleRegen: 0,
  cooldown: 0,
  buildTime: 0,
  criticalDamage: 0,
  range: 0,
  autoAttackSpeed: 0,
  meleePower: 0,
  rangedPower: 0,
  magicPower: 0,
  meleeCritRate: 0,
  rangedCritRate: 0,
  magicCritRate: 0,
  armorPenetration: 0,
  healingPower: 0,
  healthRegen: 0,
  maxActionPoints: 0,
  fortitude: 0,
  armorPenetrationReduction: 0,
  criticalHitRateReduction: 0,
  blockStrikethrough: 0,
  parryStrikethrough: 0,
  evadeStrikethrough: 0,
  disruptStrikethrough: 0,
  healCritRate: 0,
  mastery1Bonus: 0,
  mastery2Bonus: 0,
  mastery3Bonus: 0,
  outgoingHealPercent: 0,
  incomingHealPercent: 0,
};

export const useLoadoutStore = create<LoadoutState>((set, get) => ({
  loadouts: [],
  currentLoadoutId: null,
  statsSummary: initialStats,

  getCurrentLoadout: () => {
    const { loadouts, currentLoadoutId } = get();
    return loadouts.find(l => l.id === currentLoadoutId) || null;
  },

  setCareer: (career) => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const updated = { ...current, career };
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? updated : l),
    };
  }),

  setLevel: (level) => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const updated = { ...current, level };
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? updated : l),
    };
  }),

  setRenownRank: (renownRank) => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const updated = { ...current, renownRank };
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? updated : l),
    };
  }),

  setItem: (slot, item) => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const newItems = { ...current.items };
    newItems[slot] = { ...newItems[slot], item };
    if (item) {
      newItems[slot].talismans = new Array(item.talismanSlots).fill(null);
    } else {
      newItems[slot].talismans = [];
    }
    const updated = { ...current, items: newItems };
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? updated : l),
    };
  }),

  setTalisman: (slot, index, talisman) => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const newItems = { ...current.items };
    const talismans = [...newItems[slot].talismans];
    talismans[index] = talisman;
    newItems[slot] = { ...newItems[slot], talismans };
    const updated = { ...current, items: newItems };
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? updated : l),
    };
  }),

  resetCurrentLoadout: () => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    const reset = createInitialLoadout(current.id, current.name);
    return {
      loadouts: state.loadouts.map(l => l.id === current.id ? reset : l),
    };
  }),

  calculateStats: () => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return { statsSummary: initialStats };
    const stats = { ...initialStats };

    // Helper function to check if an item is eligible based on level/renown requirements
    const isItemEligible = (item: Item | null): boolean => {
      if (!item) return true;
      const levelEligible = !item.levelRequirement || item.levelRequirement <= current.level;
      const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= current.renownRank;
      return levelEligible && renownEligible;
    };

    // Helper function to map stat names to StatsSummary keys
    const mapStatToKey = (stat: string): keyof StatsSummary | null => {
      const statMap: Record<string, keyof StatsSummary> = {
        'STRENGTH': 'strength',
        'AGILITY': 'agility',
        'WILLPOWER': 'willpower',
        'TOUGHNESS': 'toughness',
        'WOUNDS': 'wounds',
        'INITIATIVE': 'initiative',
        'WEAPON_SKILL': 'weaponSkill',
        'BALLISTIC_SKILL': 'ballisticSkill',
        'INTELLIGENCE': 'intelligence',
        'SPIRIT_RESISTANCE': 'spiritResistance',
        'ELEMENTAL_RESISTANCE': 'elementalResistance',
        'CORPOREAL_RESISTANCE': 'corporealResistance',
        'INCOMING_DAMAGE': 'incomingDamage',
        'INCOMING_DAMAGE_PERCENT': 'incomingDamagePercent',
        'OUTGOING_DAMAGE': 'outgoingDamage',
        'OUTGOING_DAMAGE_PERCENT': 'outgoingDamagePercent',
        'ARMOR': 'armor',
        'VELOCITY': 'velocity',
        'BLOCK': 'block',
        'PARRY': 'parry',
        'EVADE': 'evade',
        'DISRUPT': 'disrupt',
        'ACTION_POINT_REGEN': 'actionPointRegen',
        'MORALE_REGEN': 'moraleRegen',
        'COOLDOWN': 'cooldown',
        'BUILD_TIME': 'buildTime',
        'CRITICAL_DAMAGE': 'criticalDamage',
        'RANGE': 'range',
        'AUTO_ATTACK_SPEED': 'autoAttackSpeed',
        'MELEE_POWER': 'meleePower',
        'RANGED_POWER': 'rangedPower',
        'MAGIC_POWER': 'magicPower',
        'MELEE_CRIT_RATE': 'meleeCritRate',
        'RANGED_CRIT_RATE': 'rangedCritRate',
        'MAGIC_CRIT_RATE': 'magicCritRate',
        'ARMOR_PENETRATION': 'armorPenetration',
        'HEALING_POWER': 'healingPower',
        'HEALTH_REGEN': 'healthRegen',
        'MAX_ACTION_POINTS': 'maxActionPoints',
        'FORTITUDE': 'fortitude',
        'ARMOR_PENETRATION_REDUCTION': 'armorPenetrationReduction',
        'CRITICAL_HIT_RATE_REDUCTION': 'criticalHitRateReduction',
        'BLOCK_STRIKETHROUGH': 'blockStrikethrough',
        'PARRY_STRIKETHROUGH': 'parryStrikethrough',
        'EVADE_STRIKETHROUGH': 'evadeStrikethrough',
        'DISRUPT_STRIKETHROUGH': 'disruptStrikethrough',
        'HEAL_CRIT_RATE': 'healCritRate',
        'MASTERY_1_BONUS': 'mastery1Bonus',
        'MASTERY_2_BONUS': 'mastery2Bonus',
        'MASTERY_3_BONUS': 'mastery3Bonus',
        'OUTGOING_HEAL_PERCENT': 'outgoingHealPercent',
        'INCOMING_HEAL_PERCENT': 'incomingHealPercent',
      };
      return statMap[stat] || null;
    };

    // Collect set items for bonus calculation
    const setItems: Record<string, { item: Item; set: ItemSet }[]> = {};

    Object.values(current.items).forEach(({ item, talismans }) => {
      // Only include stats from eligible items
      if (item && isItemEligible(item)) {
        // Handle the separate armor property
        if (item.armor && item.armor > 0) {
          stats.armor += Number(item.armor);
        }

        // Handle stats from the stats array
        if (item.stats) {
          item.stats.forEach(({ stat, value }) => {
            const key = mapStatToKey(stat);
            if (key && stats[key] !== undefined) {
              stats[key] += Number(value);
            }
          });
        }

        // Collect for set bonus calculation
        if (item.itemSet) {
          const setName = item.itemSet.name;
          if (!setItems[setName]) {
            setItems[setName] = [];
          }
          setItems[setName].push({ item, set: item.itemSet });
        }

        // Only include talisman stats if the parent item is eligible
        if (talismans && Array.isArray(talismans)) {
          talismans.forEach((talisman) => {
            // Only include stats from eligible talismans
            if (talisman && isItemEligible(talisman)) {
              // Handle the separate armor property for talismans
              if (talisman.armor && talisman.armor > 0) {
                stats.armor += Number(talisman.armor);
              }

              // Handle stats from the stats array
              if (talisman.stats) {
                talisman.stats.forEach(({ stat, value }) => {
                  const key = mapStatToKey(stat);
                  if (key && stats[key] !== undefined) {
                    stats[key] += Number(value);
                  }
                });
              }
            }
          });
        }
      }
    });

    // Calculate set bonuses
    Object.values(setItems).forEach((items) => {
      if (items.length > 0 && items[0].set.bonuses) {
        const setBonuses = items[0].set.bonuses;
        setBonuses.forEach((setBonus: ItemSetBonus) => {
          if (items.length >= setBonus.itemsRequired) {
            // Apply the bonus if we have enough eligible items
            if ('stat' in setBonus.bonus) {
              // It's an ItemStat
              const key = mapStatToKey(setBonus.bonus.stat);
              if (key && stats[key] !== undefined) {
                // Handle values that might be strings from GraphQL
                const bonusValue = Number(setBonus.bonus.value);
                if (!isNaN(bonusValue)) {
                  stats[key] += bonusValue;
                }
              } else {
                // Could not map stat or key not found in stats
              }
            } else {
              // Set bonus is an ability, not handled in stats calculation
            }
            // Note: Abilities are not handled in stats calculation as they don't affect numeric stats
          }
        });
      }
    });

    return { statsSummary: stats };
  }),

  createLoadout: (name, level = 40, renownRank = 80) => {
    const id = `loadout-${Date.now()}`;
    set((state) => ({
      loadouts: [...state.loadouts, createInitialLoadout(id, name, level, renownRank)],
      currentLoadoutId: state.currentLoadoutId || id,
    }));
    return id;
  },

  deleteLoadout: (id) => set((state) => {
    const newLoadouts = state.loadouts.filter(l => l.id !== id);
    let newCurrent = state.currentLoadoutId;
    if (state.currentLoadoutId === id) {
      newCurrent = newLoadouts.length > 0 ? newLoadouts[0].id : null;
    }
    return {
      loadouts: newLoadouts,
      currentLoadoutId: newCurrent,
    };
  }),

  switchLoadout: (id) => set(() => ({
    currentLoadoutId: id,
  })),

  importFromCharacter: async (characterId) => {
    // Delegate to service layer for proper separation of concerns
    const { loadoutService } = await import('../services/loadoutService');
    return loadoutService.importFromCharacter(characterId);
  },
}));
