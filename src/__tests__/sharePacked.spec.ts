import { deflateSync, inflateSync } from 'fflate';
import { urlService, type DecodedShareLoadout } from '../services/loadout/urlService';
import { RENOWN_PACK_KEYS } from '../services/loadout/renownConfig';
import { makeItem } from './factories';
import { Career, EquipSlot, type Loadout, type LoadoutItem } from '../types';

/**
 * Renown pack order is append-only. Focused Power is the live key added after
 * Regeneration was retired in place. This locks the positions the binary format uses.
 */
const RENOWN_ORDER = [
  'might', 'bladeMaster', 'marksman', 'impetus', 'acumen', 'resolve', 'fortitude', 'vigor',
  'opportunist', 'spiritualRefinement', 'regeneration', 'reflexes', 'defender', 'deftDefender',
  'hardyConcession', 'futileStrikes', 'trivialBlows', 'focusedPower',
] as const;

const TEEFZ_LEGACY = [
  'a.c=7', 'a.l=40', 'a.r=100', 'a.ra=BQaMBACAEg',
  'a.i.mh=10444', 'a.t.mh.0=907491',
  'a.i.oh=206005',
  'a.i.rw=5601715', 'a.t.rw.0=907491',
  'a.i.bd=4649', 'a.t.bd.0=907280',
  'a.i.gl=435155', 'a.t.gl.0=907280',
  'a.i.bt=4651', 'a.t.bt.0=907280',
  'a.i.hm=435203', 'a.t.hm.0=907280',
  'a.i.sh=4653', 'a.t.sh.0=907280',
  'a.i.p1=4582', 'a.i.p2=462270',
  'a.i.bk=4654', 'a.t.bk.0=907280',
  'a.i.bl=4655',
  'a.i.j1=450854', 'a.i.j2=450710',
  'a.i.j3=5118', 'a.t.j3.0=193',
  'a.i.j4=435167',
  'a.i.st=187704', 'a.i.ev=50074',
  's=3',
].join('&');

type Renown = NonNullable<Loadout['renownAbilities']>;
type StatOpts = { includeBaseStats?: boolean; includeRenownStats?: boolean; includeDerivedStats?: boolean };

function installWindow(): void {
  const g = globalThis as unknown as {
    window: { location: { href: string; hash: string; search: string } };
  };
  g.window = { location: { href: 'https://rorplanner.pages.dev/', hash: '', search: '' } };
}

function renown(partial: Partial<Renown> = {}): Renown {
  return {
    might: 0, bladeMaster: 0, marksman: 0, impetus: 0, acumen: 0, resolve: 0,
    fortitude: 0, vigor: 0, opportunist: 0, spiritualRefinement: 0, focusedPower: 0,
    reflexes: 0, defender: 0, deftDefender: 0, hardyConcession: 0, futileStrikes: 0, trivialBlows: 0,
    ...partial,
  };
}

function blankItems(): Record<EquipSlot, LoadoutItem> {
  const items = {} as Record<EquipSlot, LoadoutItem>;
  for (const slot of Object.values(EquipSlot)) {
    items[slot] = { item: null, talismans: [] };
  }
  return items;
}

function put(items: Record<EquipSlot, LoadoutItem>, slot: EquipSlot, id: string | null, talismanIds: (string | null)[] = []): void {
  items[slot] = {
    item: id ? makeItem({ id, slot }) : null,
    talismans: talismanIds.map((tid) => (tid ? makeItem({ id: tid, slot: EquipSlot.NONE }) : null)),
  };
}

function makeLoadout(partial: Partial<Loadout> & { career: Career }): Loadout {
  return {
    id: 'lo',
    name: 'lo',
    level: 40,
    renownRank: 80,
    renownAbilities: renown(),
    items: blankItems(),
    ...partial,
  };
}

function shareQuery(a: Loadout | null, b: Loadout | null, options?: StatOpts): string {
  const url = urlService.buildCompareShareUrl(a, b, options);
  const qs = url.split('#/?')[1] ?? '';
  return qs;
}

function withParams<T>(qs: string, run: () => T): T {
  const orig = urlService.getSearchParams.bind(urlService);
  urlService.getSearchParams = () => new URLSearchParams(qs);
  try {
    return run();
  } finally {
    urlService.getSearchParams = orig;
  }
}

/** Mirrors UrlService.MAX_PACKED_BYTES. Real loadouts sit far below this. */
const INFLATE_CAP = 64 * 1024;
/** Version-1 packed sides use this fixed slot sequence. */
const PACKED_SLOT_COUNT = 19;

function writeVarint(out: number[], n: number): void {
  let v = Math.max(0, Math.trunc(n));
  while (v >= 0x80) {
    out.push((v % 0x80) | 0x80);
    v = Math.floor(v / 0x80);
  }
  out.push(v);
}

function writeStringId(out: number[], id: string): void {
  writeVarint(out, 1);
  const utf8 = new TextEncoder().encode(id);
  writeVarint(out, utf8.length);
  for (const b of utf8) out.push(b);
}

function writeEmptySlots(out: number[], fromSlot: number): void {
  for (let slot = fromSlot; slot < PACKED_SLOT_COUNT; slot++) {
    writeVarint(out, 0);
    writeVarint(out, 0);
  }
}

function bytesToBase64Url(bin: Uint8Array): string {
  let binStr = '';
  for (let i = 0; i < bin.length; i++) binStr += String.fromCharCode(bin[i]);
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(packed: string): Uint8Array {
  const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binStr = atob(`${b64}${pad}`);
  const out = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) out[i] = binStr.charCodeAt(i);
  return out;
}

function packedParam(bytes: number[]): string {
  return `.${bytesToBase64Url(deflateSync(new Uint8Array(bytes), { level: 9 }))}`;
}

function expectSide(decoded: DecodedShareLoadout | null, src: Loadout | null): void {
  if (!src) {
    expect(decoded).toBeNull();
    return;
  }
  expect(decoded).not.toBeNull();
  if (!decoded) return;
  expect(decoded.career).toBe(src.career);
  expect(decoded.level).toBe(src.level);
  expect(decoded.renownRank).toBe(src.renownRank);
  const ra = src.renownAbilities ?? renown();
  for (const key of RENOWN_PACK_KEYS) {
    if (key === 'regeneration') {
      expect(decoded.renownAbilities.regeneration ?? 0).toBe(0);
      continue;
    }
    expect(decoded.renownAbilities[key]).toBe(ra[key] ?? 0);
  }
  for (const slot of Object.values(EquipSlot)) {
    if (slot === EquipSlot.NONE || slot.startsWith('TROPHY')) {
      expect(decoded.items[slot]).toBeUndefined();
      continue;
    }
    const srcSlot = src.items[slot];
    const srcId = srcSlot?.item?.id ?? null;
    const srcTals = (srcSlot?.talismans ?? []).map((t) => t?.id ?? null);
    while (srcTals.length > 0 && srcTals[srcTals.length - 1] == null) srcTals.pop();
    const has = srcId != null || srcTals.some((t) => t != null);
    if (!has) {
      expect(decoded.items[slot]).toBeUndefined();
      continue;
    }
    expect(decoded.items[slot]?.item?.id ?? null).toBe(srcId);
    const got = (decoded.items[slot]?.talismans ?? []).map((t) => t?.id ?? null);
    expect(got).toEqual(srcTals);
  }
}

describe('packed share links', () => {
  beforeEach(() => {
    installWindow();
  });

  it('keeps renown keys in append-only order, with Focused Power last and Regeneration retired in place', () => {
    expect([...RENOWN_PACK_KEYS]).toEqual([...RENOWN_ORDER]);
    expect(RENOWN_PACK_KEYS[RENOWN_PACK_KEYS.length - 1]).toBe('focusedPower');
    expect(RENOWN_PACK_KEYS.includes('regeneration')).toBe(true);
  });

  it('round-trips an empty loadout and keeps stats toggles in s=', () => {
    const a = makeLoadout({ career: Career.SLAYER, level: 40, renownRank: 80 });
    const qs = shareQuery(a, null, { includeBaseStats: false, includeRenownStats: false, includeDerivedStats: false });
    const sp = new URLSearchParams(qs);
    expect(sp.get('s')).toBe('0');
    expect(sp.get('p')).toMatch(/^\./);
    expect(qs.includes('%7E')).toBe(false);
    expect(qs.includes('p=.')).toBe(true);
    expect(sp.has('a.c')).toBe(false);
    const decoded = withParams(qs, () => urlService.decodeCompareShare());
    expectSide(decoded?.a ?? null, a);
    expect(decoded?.b).toBeNull();
    expect(decoded?.activeSide).toBe('A');
    expect(new URLSearchParams(qs).get('s')).toBe('0');
  });

  it('round-trips a typical loadout, Focused Power, a non-numeric id, and s=', () => {
    const items = blankItems();
    put(items, EquipSlot.MAIN_HAND, '10444', ['907491', null, '193']);
    put(items, EquipSlot.BODY, '4649', ['907280', null]);
    put(items, EquipSlot.POCKET1, 'custom-pocket');
    put(items, EquipSlot.TROPHY1, '129838604');
    const a = makeLoadout({
      career: Career.SQUIG_HERDER,
      level: 40,
      renownRank: 100,
      renownAbilities: renown({ might: 5, impetus: 3, fortitude: 3, vigor: 4, opportunist: 4, focusedPower: 4, futileStrikes: 4, trivialBlows: 2, regeneration: 3 }),
      items,
    });
    const withoutTrophy = makeLoadout({
      career: Career.SQUIG_HERDER,
      level: a.level,
      renownRank: a.renownRank,
      renownAbilities: a.renownAbilities,
      items: blankItems(),
    });
    put(withoutTrophy.items, EquipSlot.MAIN_HAND, '10444', ['907491', null, '193']);
    put(withoutTrophy.items, EquipSlot.BODY, '4649', ['907280', null]);
    put(withoutTrophy.items, EquipSlot.POCKET1, 'custom-pocket');
    const opts = { includeBaseStats: true, includeRenownStats: true, includeDerivedStats: false };
    const qs = shareQuery(a, null, opts);
    expect(shareQuery(withoutTrophy, null, opts)).toBe(qs);
    expect(new URLSearchParams(qs).get('s')).toBe('3');
    expect(qs.includes('%7E')).toBe(false);
    const decoded = withParams(qs, () => urlService.decodeCompareShare());
    expectSide(decoded?.a ?? null, a);
    expect(decoded?.a?.renownAbilities.focusedPower).toBe(4);
    expect(decoded?.a?.renownAbilities.regeneration ?? 0).toBe(0);
    expect(decoded?.a?.items.MAIN_HAND?.talismans.map((t) => t?.id ?? null)).toEqual(['907491', null, '193']);
  });

  it('round-trips a fully geared loadout', () => {
    const items = blankItems();
    let n = 5601700;
    const gear: EquipSlot[] = [
      EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.RANGED_WEAPON, EquipSlot.EITHER_HAND,
      EquipSlot.BODY, EquipSlot.GLOVES, EquipSlot.BOOTS, EquipSlot.HELM, EquipSlot.SHOULDER,
      EquipSlot.POCKET1, EquipSlot.POCKET2, EquipSlot.BACK, EquipSlot.BELT,
      EquipSlot.JEWELLERY1, EquipSlot.JEWELLERY2, EquipSlot.JEWELLERY3, EquipSlot.JEWELLERY4,
      EquipSlot.STANDARD, EquipSlot.EVENT,
    ];
    for (const slot of gear) put(items, slot, String(n++));
    const tal = ['907280', '907491', '907325', '907118', '193', '907402'];
    let k = 0;
    for (const slot of [EquipSlot.MAIN_HAND, EquipSlot.OFF_HAND, EquipSlot.RANGED_WEAPON, EquipSlot.BODY, EquipSlot.GLOVES, EquipSlot.BOOTS, EquipSlot.HELM, EquipSlot.SHOULDER, EquipSlot.BACK, EquipSlot.BELT]) {
      put(items, slot, items[slot].item?.id ?? null, [tal[k++ % 6], tal[k++ % 6]]);
    }
    const a = makeLoadout({
      career: Career.SQUIG_HERDER,
      level: 40,
      renownRank: 100,
      renownAbilities: renown({ might: 5, bladeMaster: 5, impetus: 3, resolve: 3, fortitude: 3, vigor: 4, opportunist: 4, focusedPower: 4, reflexes: 4, defender: 4, futileStrikes: 4, trivialBlows: 2 }),
      items,
    });
    const qs = shareQuery(a, null, { includeBaseStats: true, includeRenownStats: false, includeDerivedStats: true });
    expect(new URLSearchParams(qs).get('s')).toBe('5');
    const decoded = withParams(qs, () => urlService.decodeCompareShare());
    expectSide(decoded?.a ?? null, a);
  });

  it('round-trips an A+B compare, including different Focused Power levels and all stat toggles', () => {
    const itemsA = blankItems();
    put(itemsA, EquipSlot.MAIN_HAND, '10444', ['907491']);
    put(itemsA, EquipSlot.HELM, '435203', ['907280']);
    const itemsB = blankItems();
    put(itemsB, EquipSlot.MAIN_HAND, '88001', ['193', '907402']);
    put(itemsB, EquipSlot.BODY, '77002');
    const a = makeLoadout({
      career: Career.SQUIG_HERDER,
      renownRank: 100,
      renownAbilities: renown({ might: 5, focusedPower: 4, trivialBlows: 2 }),
      items: itemsA,
    });
    const b = makeLoadout({
      career: Career.WITCH_HUNTER,
      level: 40,
      renownRank: 95,
      renownAbilities: renown({ marksman: 4, focusedPower: 1, reflexes: 2 }),
      items: itemsB,
    });
    const qs = shareQuery(a, b, { includeBaseStats: true, includeRenownStats: true, includeDerivedStats: true });
    const sp = new URLSearchParams(qs);
    expect(sp.get('s')).toBe('7');
    expect(sp.getAll('p')).toHaveLength(1);
    expect(qs.includes('a.')).toBe(false);
    expect(qs.includes('b.')).toBe(false);
    const decoded = withParams(qs, () => urlService.decodeCompareShare());
    expectSide(decoded?.a ?? null, a);
    expectSide(decoded?.b ?? null, b);
    expect(decoded?.a?.renownAbilities.focusedPower).toBe(4);
    expect(decoded?.b?.renownAbilities.focusedPower).toBe(1);
  });

  it('decodes a legacy a.*/s= link exactly, with no p=', () => {
    expect(TEEFZ_LEGACY.includes('p=')).toBe(false);
    const decoded = withParams(TEEFZ_LEGACY, () => urlService.decodeCompareShare());
    const direct = withParams(TEEFZ_LEGACY, () => urlService.decodeLoadoutFromUrlWithPrefix('a'));
    expect(decoded?.b).toBeNull();
    expect(decoded?.activeSide).toBe('A');
    expect(decoded?.a?.career).toBe(Career.SQUIG_HERDER);
    expect(decoded?.a?.level).toBe(40);
    expect(decoded?.a?.renownRank).toBe(100);
    expect(decoded?.a?.renownAbilities.might).toBe(5);
    expect(decoded?.a?.renownAbilities.impetus).toBe(3);
    expect(decoded?.a?.renownAbilities.fortitude).toBe(3);
    expect(decoded?.a?.renownAbilities.vigor).toBe(4);
    expect(decoded?.a?.renownAbilities.opportunist).toBe(4);
    expect(decoded?.a?.renownAbilities.focusedPower).toBe(2);
    expect(decoded?.a?.renownAbilities.futileStrikes).toBe(4);
    expect(decoded?.a?.renownAbilities.trivialBlows).toBe(2);
    expect(decoded?.a?.renownAbilities.regeneration ?? 0).toBe(0);
    expect(decoded?.a?.renownAbilities.bladeMaster).toBe(0);
    expect(decoded?.a?.items.MAIN_HAND?.item?.id).toBe('10444');
    expect(decoded?.a?.items.MAIN_HAND?.talismans[0]?.id).toBe('907491');
    expect(decoded?.a?.items.JEWELLERY3?.item?.id).toBe('5118');
    expect(decoded?.a?.items.JEWELLERY3?.talismans[0]?.id).toBe('193');
    expect(decoded?.a?.items.EITHER_HAND).toBeUndefined();
    expect(decoded?.a?.items.TROPHY1).toBeUndefined();
    expect(direct?.career).toBe(decoded?.a?.career);
    expect(direct?.items.MAIN_HAND?.item?.id).toBe('10444');
    expect(direct?.renownAbilities.focusedPower).toBe(2);
    expect(new URLSearchParams(TEEFZ_LEGACY).get('s')).toBe('3');

    const legacyParams = urlService.encodeLoadoutToUrlWithPrefix('a', makeLoadout({
      career: Career.SQUIG_HERDER,
      level: 40,
      renownRank: 100,
      renownAbilities: renown({ might: 5, impetus: 3, fortitude: 3, vigor: 4, opportunist: 4, focusedPower: 2, futileStrikes: 4, trivialBlows: 2 }),
      items: blankItems(),
    }));
    expect(legacyParams['a.ra']).toBe('BQaMBACAEg');
    expect(legacyParams['a.c']).toBe('7');
  });

  it('prefers a valid p= over leftover legacy params, and ignores a corrupt p= in favor of legacy', () => {
    const a = makeLoadout({ career: Career.SLAYER });
    const packed = shareQuery(a, null);
    const mixed = `${packed}&a.i.mh=99999&a.c=0`;
    const fromPacked = withParams(mixed, () => urlService.decodeCompareShare());
    expect(fromPacked?.a?.career).toBe(Career.SLAYER);
    expect(fromPacked?.a?.items.MAIN_HAND).toBeUndefined();

    const corrupt = 'p=.$$$$&a.c=1&a.l=40&a.r=70&a.i.mh=42&s=1&activeSide=b';
    const fromLegacy = withParams(corrupt, () => urlService.decodeCompareShare());
    expect(fromLegacy?.a?.career).toBe(Career.SLAYER);
    expect(fromLegacy?.a?.level).toBe(40);
    expect(fromLegacy?.a?.renownRank).toBe(70);
    expect(fromLegacy?.a?.items.MAIN_HAND?.item?.id).toBe('42');
    expect(fromLegacy?.activeSide).toBe('B');
    expect(new URLSearchParams(corrupt).get('s')).toBe('1');
  });

  it('ignores corrupt, truncated, and unknown-version p= without throwing', () => {
    const good = new URLSearchParams(shareQuery(makeLoadout({
      career: Career.CHOSEN,
      renownAbilities: renown({ focusedPower: 3 }),
    }), null, { includeBaseStats: true }));
    const p = good.get('p') ?? '';
    expect(p.startsWith('.')).toBe(true);
    const truncated = `p=${p.slice(0, Math.max(2, Math.floor(p.length / 2)))}&s=2`;
    const cases = [
      'p=',
      'p=not-valid',
      'p=.',
      'p=.$$$$',
      'p=.AAAA',
      truncated,
      'p=AQ', // uncompressed version/flags only, body missing
    ];
    for (const qs of cases) {
      expect(() => withParams(qs, () => urlService.decodeCompareShare())).not.toThrow();
      const decoded = withParams(qs, () => urlService.decodeCompareShare());
      expect(decoded).toBeNull();
    }
    expect(() => withParams('p=.$$$$', () => urlService.decodeCompareShare())).not.toThrow();
  });

  it('does not throw when loading a corrupt packed link', async () => {
    await withParams('p=.$$$$', () => urlService.handleCompareFromUrl());
  });

  it('keeps s= and activeSide when rewriting the address to p=', () => {
    const items = blankItems();
    put(items, EquipSlot.MAIN_HAND, '10444', ['907491']);
    const a = makeLoadout({
      career: Career.SQUIG_HERDER,
      renownRank: 100,
      renownAbilities: renown({ focusedPower: 2, might: 5 }),
      items,
    });
    const origAuto = urlService.isAutoUpdateEnabled();
    let captured = '';
    urlService.setAutoUpdateEnabled(true);
    urlService.setNavigateCallback((path) => { captured = path; });
    const orig = urlService.getSearchParams.bind(urlService);
    urlService.getSearchParams = () => new URLSearchParams('a.l=40&a.i.mh=1&s=6&activeSide=b');
    try {
      urlService.updateUrlWithCompare(a, null);
    } finally {
      urlService.getSearchParams = orig;
      urlService.setAutoUpdateEnabled(origAuto);
      urlService.setNavigateCallback(null);
    }
    const sp = new URLSearchParams(captured.startsWith('?') ? captured.slice(1) : captured);
    expect(sp.get('s')).toBe('6');
    expect(sp.get('activeSide')).toBe('b');
    expect(sp.get('p')).toMatch(/^\./);
    expect(sp.has('a.l')).toBe(false);
    expect(sp.has('a.i.mh')).toBe(false);
    const decoded = withParams(sp.toString(), () => urlService.decodeCompareShare());
    expect(decoded?.activeSide).toBe('B');
    expectSide(decoded?.a ?? null, a);
    expect(new URLSearchParams(sp.toString()).get('s')).toBe('6');
  });

  it('returns null when a packed payload inflates past the output cap', () => {
    const chunk = 'y'.repeat(200);
    const under: number[] = [1, 1];
    writeVarint(under, 0);
    writeVarint(under, 40);
    writeVarint(under, 0);
    writeVarint(under, 0);
    writeStringId(under, chunk);
    writeVarint(under, 32);
    for (let i = 0; i < 32; i++) writeStringId(under, chunk);
    writeEmptySlots(under, 1);
    expect(under.length).toBeLessThan(INFLATE_CAP);
    const underDecoded = withParams(`p=${packedParam(under)}`, () => urlService.decodeCompareShare());
    expect(underDecoded?.a?.level).toBe(40);
    expect(underDecoded?.a?.items.MAIN_HAND?.item?.id).toBe(chunk);
    expect(underDecoded?.a?.items.MAIN_HAND?.talismans).toHaveLength(32);
    expect(underDecoded?.a?.items.MAIN_HAND?.talismans[31]?.id).toBe(chunk);

    const over: number[] = [1, 1];
    writeVarint(over, 0);
    writeVarint(over, 40);
    writeVarint(over, 0);
    writeVarint(over, 0);
    for (let slot = 0; slot < PACKED_SLOT_COUNT; slot++) {
      writeStringId(over, chunk);
      writeVarint(over, 32);
      for (let i = 0; i < 32; i++) writeStringId(over, chunk);
    }
    expect(over.length).toBeGreaterThan(INFLATE_CAP);
    const overQuery = `p=${packedParam(over)}`;
    expect(() => withParams(overQuery, () => urlService.decodeCompareShare())).not.toThrow();
    expect(withParams(overQuery, () => urlService.decodeCompareShare())).toBeNull();
  });

  it('round-trips an id next to MAX_SAFE_INTEGER instead of failing the link', () => {
    const nearMax = String(Number.MAX_SAFE_INTEGER - 1);
    expect(nearMax).toBe('9007199254740990');
    const items = blankItems();
    put(items, EquipSlot.MAIN_HAND, nearMax);
    const decoded = withParams(
      shareQuery(makeLoadout({ career: Career.SLAYER, items }), null),
      () => urlService.decodeCompareShare(),
    );
    expect(decoded).not.toBeNull();
    expect(decoded?.a?.career).toBe(Career.SLAYER);
    expect(decoded?.a?.items.MAIN_HAND?.item?.id).toBe(nearMax);
  });

  it('round-trips item ids with leading zeros', () => {
    const items = blankItems();
    put(items, EquipSlot.MAIN_HAND, '0123', ['007']);
    const decoded = withParams(
      shareQuery(makeLoadout({ career: Career.SLAYER, items }), null),
      () => urlService.decodeCompareShare(),
    );
    expect(decoded?.a?.items.MAIN_HAND?.item?.id).toBe('0123');
    expect(decoded?.a?.items.MAIN_HAND?.talismans[0]?.id).toBe('007');
  });

  it('rejects trailing bytes after the packed payload', () => {
    const qs = shareQuery(makeLoadout({ career: Career.SLAYER }), null);
    const p = new URLSearchParams(qs).get('p') ?? '';
    expect(p.startsWith('.')).toBe(true);
    const intact = withParams(qs, () => urlService.decodeCompareShare());
    expect(intact?.a?.career).toBe(Career.SLAYER);

    const raw = inflateSync(base64UrlToBytes(p.slice(1)));
    const extra = new Uint8Array(raw.length + 1);
    extra.set(raw);
    extra[extra.length - 1] = 0x7f;
    const tampered = `p=.${bytesToBase64Url(deflateSync(extra))}`;
    expect(() => withParams(tampered, () => urlService.decodeCompareShare())).not.toThrow();
    expect(withParams(tampered, () => urlService.decodeCompareShare())).toBeNull();
  });
});
