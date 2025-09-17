import { create } from 'zustand';
import { Loadout, LoadoutItem, EquipSlot, Career, Item, StatsSummary, ItemSetBonus } from '../types';

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
    const isItemEligible = (item: any): boolean => {
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
      };
      return statMap[stat] || null;
    };

    // Collect set items for bonus calculation
    const setItems: Record<string, { item: any; set: any }[]> = {};

    Object.values(current.items).forEach(({ item, talismans }) => {
      // Only include stats from eligible items
      if (item && isItemEligible(item) && item.stats) {
        item.stats.forEach(({ stat, value }) => {
          const key = mapStatToKey(stat);
          if (key && stats[key] !== undefined) {
            stats[key] += value;
          }
        });

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
            if (talisman && isItemEligible(talisman) && talisman.stats) {
              talisman.stats.forEach(({ stat, value }) => {
                const key = mapStatToKey(stat);
                if (key && stats[key] !== undefined) {
                  stats[key] += value;
                }
              });
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
                stats[key] += setBonus.bonus.value;
              }
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
