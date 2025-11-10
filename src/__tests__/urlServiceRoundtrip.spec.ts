import { urlService } from '../services/loadout/urlService';
import { Career, EquipSlot, type Loadout } from '../types';

describe('urlService encode/decode roundtrip (compare, compact keys, no trophies)', () => {
  function makeLoadout(overrides: Partial<Loadout> = {}): Loadout {
    const base: Loadout = {
      id: 'lo-1',
      name: 'Test',
      career: Career.SLAYER,
      level: 40,
      renownRank: 80,
      renownAbilities: {
        might: 3, bladeMaster: 0, marksman: 1, impetus: 0, acumen: 0, resolve: 0, fortitude: 0, vigor: 0,
        opportunist: 0, spiritualRefinement: 0, regeneration: 0, reflexes: 2, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0,
      },
      items: {
        [EquipSlot.MAIN_HAND]: { item: { id: 'item-mh' } as any, talismans: [{ id: 'tal-0' } as any, null] },
        [EquipSlot.OFF_HAND]: { item: null, talismans: [] },
        [EquipSlot.BODY]: { item: { id: 'item-body' } as any, talismans: [] },
        [EquipSlot.TROPHY1]: { item: { id: 'trophy-1' } as any, talismans: [] }, // should be ignored
        [EquipSlot.POCKET1]: { item: { id: 'pock-1' } as any, talismans: [] },
        [EquipSlot.POCKET2]: { item: null, talismans: [] },
        [EquipSlot.HELM]: { item: null, talismans: [] },
        [EquipSlot.SHOULDER]: { item: null, talismans: [] },
        [EquipSlot.GLOVES]: { item: null, talismans: [] },
        [EquipSlot.BOOTS]: { item: null, talismans: [] },
        [EquipSlot.BACK]: { item: null, talismans: [] },
        [EquipSlot.BELT]: { item: null, talismans: [] },
        [EquipSlot.JEWELLERY1]: { item: null, talismans: [] },
        [EquipSlot.JEWELLERY2]: { item: null, talismans: [] },
        [EquipSlot.JEWELLERY3]: { item: null, talismans: [] },
        [EquipSlot.JEWELLERY4]: { item: null, talismans: [] },
        [EquipSlot.RANGED_WEAPON]: { item: null, talismans: [] },
        [EquipSlot.EITHER_HAND]: { item: null, talismans: [] },
        [EquipSlot.EVENT]: { item: null, talismans: [] },
        [EquipSlot.STANDARD]: { item: null, talismans: [] },
        [EquipSlot.NONE]: { item: null, talismans: [] },
      } as any,
    };
    return { ...base, ...overrides } as Loadout;
  }

  it('encodes compact keys and decodes back with prefix, ignoring trophy slots and unpacking renown', () => {
    const a = makeLoadout();
    const params = urlService.encodeLoadoutToUrlWithPrefix('a', a);
    // Expect compact keys present
    expect(params['a.c']).toBeDefined();
    expect(params['a.l']).toBe('40');
    expect(params['a.r']).toBe('80');
    expect(params['a.i.mh']).toBe('item-mh');
    expect(params['a.t.mh.0']).toBe('tal-0');
    // Trophy should not be present
    expect(Object.keys(params).some(k => /trophy/i.test(k))).toBe(false);

    // Build a URLSearchParams to feed into decoder by overriding getSearchParams
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const orig = urlService.getSearchParams.bind(urlService);
  // Override
  (urlService as any).getSearchParams = () => new URLSearchParams(qs);
    try {
      const decoded = urlService.decodeLoadoutFromUrlWithPrefix('a');
      expect(decoded).not.toBeNull();
      // Career, level, renown preserved
      expect(decoded!.career).toBe(Career.SLAYER);
      expect(decoded!.level).toBe(40);
      expect(decoded!.renownRank).toBe(80);
      // Renown unpacked (only non-zero were set above)
      expect(decoded!.renownAbilities.might).toBe(3);
      expect(decoded!.renownAbilities.marksman).toBe(1);
      expect(decoded!.renownAbilities.reflexes).toBe(2);
      // Items preserved (no trophies)
      expect(decoded!.items.MAIN_HAND.item!.id).toBe('item-mh');
      expect(decoded!.items.MAIN_HAND.talismans[0]!.id).toBe('tal-0');
      expect(decoded!.items.BODY.item!.id).toBe('item-body');
      expect(decoded!.items.POCKET1.item!.id).toBe('pock-1');
      // Trophies omitted
      expect('TROPHY1' in decoded!.items).toBe(false);
    } finally {
  // Restore
  (urlService as any).getSearchParams = orig;
    }
  });
});
