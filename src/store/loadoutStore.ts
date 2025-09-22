import { create } from 'zustand';
import { Loadout, LoadoutItem, EquipSlot, Career, Item, StatsSummary, ItemSetBonus, ItemSet, LoadoutMode, LoadoutSide } from '../types';

interface LoadoutState {
  loadouts: Loadout[];
  currentLoadoutId: string | null;
  // Compare mode state
  mode: LoadoutMode; // 'single' | 'dual'
  activeSide: LoadoutSide; // which side is currently being edited/viewed
  sideLoadoutIds: Record<LoadoutSide, string | null>; // mapping from side to loadout id
  sideCareerLoadoutIds: Record<LoadoutSide, Partial<Record<Career, string>>>; // per-side, per-career mapping
  statsSummary: StatsSummary;
  // Actions for current loadout
  setCareer: (career: Career | null) => void;
  setLevel: (level: number) => void;
  setRenownRank: (renownRank: number) => void;
  setItem: (slot: EquipSlot, item: Item | null) => void;
  setTalisman: (slot: EquipSlot, index: number, talisman: Item | null) => void;
  setItemForLoadout: (loadoutId: string, slot: EquipSlot, item: Item | null) => void;
  setTalismanForLoadout: (loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null) => void;
  setCareerForLoadout: (loadoutId: string, career: Career | null) => void;
  setLevelForLoadout: (loadoutId: string, level: number) => void;
  setRenownForLoadout: (loadoutId: string, renownRank: number) => void;
  setLoadoutNameForLoadout: (loadoutId: string, name: string) => void;
  resetLoadoutById: (loadoutId: string) => void;
  resetCurrentLoadout: () => void;
  calculateStats: () => void;
  // Mode actions
  getMode: () => LoadoutMode;
  getActiveSide: () => LoadoutSide;
  setMode: (mode: LoadoutMode) => void;
  setActiveSide: (side: LoadoutSide) => void;
  getSideLoadoutId: (side: LoadoutSide) => string | null;
  getLoadoutForSide: (side: LoadoutSide) => Loadout | null;
  getSideCareerLoadoutId: (side: LoadoutSide, career: Career) => string | null;
  setSideCareerLoadoutId: (side: LoadoutSide, career: Career, loadoutId: string | null) => void;
  assignSideLoadout: (side: LoadoutSide, loadoutId: string | null) => void;
  // Actions for multiple loadouts
  createLoadout: (name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string) => string;
  deleteLoadout: (id: string) => void;
  switchLoadout: (id: string) => Promise<void>;
  markLoadoutAsModified: (id: string) => void; // Mark loadout as no longer from character
  updateLoadoutCharacterStatus: (id: string, isFromCharacter: boolean, characterName?: string) => void; // Update character status
  importFromCharacter: (characterId: string) => Promise<string>; // Will use GraphQL
  getCurrentLoadout: () => Loadout | null;
}

const createInitialLoadout = (id: string, name: string, level: number = 40, renownRank: number = 80, isFromCharacter: boolean = false, characterName?: string): Loadout => ({
  id,
  name,
  career: null,
  level,
  renownRank,
  items: Object.values(EquipSlot).reduce((acc, slot) => {
    acc[slot] = { item: null, talismans: [] };
    return acc;
  }, {} as Record<EquipSlot, LoadoutItem>),
  isFromCharacter,
  characterName,
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
  mode: 'dual',
  activeSide: 'A',
  sideLoadoutIds: { A: null, B: null },
  sideCareerLoadoutIds: { A: {}, B: {} },
  statsSummary: initialStats,

  getCurrentLoadout: () => {
    const { loadouts, currentLoadoutId } = get();
    return loadouts.find(l => l.id === currentLoadoutId) || null;
  },

  // Mode getters
  getMode: () => get().mode,
  getActiveSide: () => get().activeSide,
  getSideLoadoutId: (side) => get().sideLoadoutIds[side],
  getLoadoutForSide: (side) => {
    const id = get().sideLoadoutIds[side];
    if (!id) return null;
    return get().loadouts.find(l => l.id === id) || null;
  },

  getSideCareerLoadoutId: (side, career) => {
    const map = get().sideCareerLoadoutIds[side];
    return (map && map[career]) || null;
  },

  setSideCareerLoadoutId: (side, career, loadoutId) => set((state) => {
    const next = { ...state.sideCareerLoadoutIds } as Record<LoadoutSide, Partial<Record<Career, string>>>;
    const inner = { ...(next[side] || {}) } as Partial<Record<Career, string>>;
    if (loadoutId == null) {
      delete inner[career];
    } else {
      inner[career] = loadoutId;
    }
    next[side] = inner;
    return { sideCareerLoadoutIds: next };
  }),

  // Mode setters
  setMode: (mode) => set((state) => {
    // Preserve activeSide and existing side mappings across mode switches
    const updates: Partial<LoadoutState> = { mode };
    const nextMap = { ...state.sideLoadoutIds } as Record<LoadoutSide, string | null>;
    if (mode === 'dual') {
      // Seed A with current loadout if A is unassigned
      const current = state.getCurrentLoadout();
      if (!nextMap.A && current) {
        nextMap.A = current.id;
      }
      // If both sides end up pointing to the same id, keep mapping for now; service will clone on ensure/assign
      updates.sideLoadoutIds = nextMap;
      // Do not override activeSide
    } else {
      // Single mode: keep mappings to remember A/B selections for later compare
      updates.sideLoadoutIds = nextMap;
      // Do not override activeSide
    }
    return updates;
  }),

  setActiveSide: (side) => set(() => ({ activeSide: side })),

  assignSideLoadout: (side, loadoutId) => set((state) => {
    const next = { ...state.sideLoadoutIds };
    next[side] = loadoutId;
    return { sideLoadoutIds: next };
  }),

  setCareerForLoadout: (loadoutId, career) => set((state) => {
    const updated = state.loadouts.map(l => l.id === loadoutId ? { ...l, career } : l);
    return { loadouts: updated };
  }),

  setLevelForLoadout: (loadoutId, level) => set((state) => {
    const updated = state.loadouts.map(l => l.id === loadoutId ? { ...l, level } : l);
    return { loadouts: updated };
  }),

  setRenownForLoadout: (loadoutId, renownRank) => set((state) => {
    const updated = state.loadouts.map(l => l.id === loadoutId ? { ...l, renownRank } : l);
    return { loadouts: updated };
  }),

  setLoadoutNameForLoadout: (loadoutId, name) => set((state) => {
    const updated = state.loadouts.map(l => l.id === loadoutId ? { ...l, name } : l);
    return { loadouts: updated };
  }),

  resetLoadoutById: (loadoutId) => set((state) => {
    const side = Object.entries(state.sideLoadoutIds).find(([, id]) => id === loadoutId)?.[0] as LoadoutSide | undefined;
    const defaultName = side === 'A' ? 'Side A' : side === 'B' ? 'Side B' : 'Default Loadout';
    const reset = createInitialLoadout(loadoutId, defaultName);
    return { loadouts: state.loadouts.map(l => l.id === loadoutId ? reset : l) };
  }),

  setCareer: (career: Career | null) => set((state) => {
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

  setItemForLoadout: (loadoutId, slot, item) => set((state) => {
    const target = state.loadouts.find(l => l.id === loadoutId);
    if (!target) return state;
    const newItems = { ...target.items };
    newItems[slot] = { ...newItems[slot], item };
    if (item) {
      newItems[slot].talismans = new Array(item.talismanSlots).fill(null);
    } else {
      newItems[slot].talismans = [];
    }
    const updated = { ...target, items: newItems };
    return {
      loadouts: state.loadouts.map(l => l.id === loadoutId ? updated : l),
    };
  }),

  setTalismanForLoadout: (loadoutId, slot, index, talisman) => set((state) => {
    const target = state.loadouts.find(l => l.id === loadoutId);
    if (!target) return state;
    const newItems = { ...target.items };
    const talismans = [...newItems[slot].talismans];
    talismans[index] = talisman;
    newItems[slot] = { ...newItems[slot], talismans };
    const updated = { ...target, items: newItems };
    return {
      loadouts: state.loadouts.map(l => l.id === loadoutId ? updated : l),
    };
  }),

  resetCurrentLoadout: () => set((state) => {
    const current = state.getCurrentLoadout();
    if (!current) return state;
    // Determine side and default name for that side
    let defaultName = 'Default Loadout';
    if (state.sideLoadoutIds.A === current.id) defaultName = 'Side A';
    else if (state.sideLoadoutIds.B === current.id) defaultName = 'Side B';
    const reset = createInitialLoadout(current.id, defaultName);
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

  createLoadout: (name, level = 40, renownRank = 80, isFromCharacter = false, characterName) => {
    const id = `loadout-${Date.now()}`;
    set((state) => ({
      loadouts: [...state.loadouts, createInitialLoadout(id, name, level, renownRank, isFromCharacter, characterName)],
      currentLoadoutId: state.currentLoadoutId || id,
      // If we're in dual mode and the active side isn't assigned, assign this new loadout to it
      sideLoadoutIds: state.mode === 'dual' && state.sideLoadoutIds[state.activeSide] == null
        ? { ...state.sideLoadoutIds, [state.activeSide]: id }
        : state.sideLoadoutIds,
    }));
    return id;
  },

  deleteLoadout: (id) => set((state) => {
    const newLoadouts = state.loadouts.filter(l => l.id !== id);
    let newCurrent = state.currentLoadoutId;
    if (state.currentLoadoutId === id) {
      newCurrent = newLoadouts.length > 0 ? newLoadouts[0].id : null;
    }
    // Clean side mappings that reference this id
    const nextSideMap = { ...state.sideLoadoutIds } as Record<LoadoutSide, string | null>;
    (['A','B'] as LoadoutSide[]).forEach(s => { if (nextSideMap[s] === id) nextSideMap[s] = null; });
    // Clean per-career mappings referencing this id
    const nextCareerMap = { ...state.sideCareerLoadoutIds } as Record<LoadoutSide, Partial<Record<Career, string>>>;
    (['A','B'] as LoadoutSide[]).forEach(s => {
      const inner = { ...(nextCareerMap[s] || {}) } as Partial<Record<Career, string>>;
      Object.entries(inner).forEach(([career, lid]) => {
        if (lid === id) delete inner[career as Career];
      });
      nextCareerMap[s] = inner;
    });
    return {
      loadouts: newLoadouts,
      currentLoadoutId: newCurrent,
      sideLoadoutIds: nextSideMap,
      sideCareerLoadoutIds: nextCareerMap,
    };
  }),

  switchLoadout: (id) => Promise.resolve(set(() => ({
    currentLoadoutId: id,
  }))),

  markLoadoutAsModified: (id) => set((state) => ({
    loadouts: state.loadouts.map(l => {
      if (l.id !== id) return l;
      const newName = l.name.startsWith('Imported from ')
        ? l.name.replace(/^Imported from\s+/, '').trim()
        : l.name;
      return { ...l, isFromCharacter: false, characterName: undefined, name: newName };
    }),
  })),

  updateLoadoutCharacterStatus: (id, isFromCharacter, characterName) => set((state) => ({
    loadouts: state.loadouts.map(l => 
      l.id === id ? { ...l, isFromCharacter, characterName } : l
    ),
  })),

  importFromCharacter: async (characterId) => {
    // Delegate to service layer for proper separation of concerns
    const { loadoutService } = await import('../services/loadoutService');
    return loadoutService.importFromCharacter(characterId);
  },
}));
