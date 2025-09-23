/* eslint-disable no-console */
import { urlService } from '../src/services/urlService';
import type { Loadout, EquipSlot, Career } from '../src/types';

function makeLoadout(partial: Partial<Loadout>): Loadout {
  const emptyItems: Loadout['items'] = Object.fromEntries(
    Object.values((require('../src/types') as any).EquipSlot).map((slot: string) => [slot, { item: null, talismans: [] }])
  ) as Loadout['items'];
  return {
    id: 'test',
    name: 'Test',
    level: 40,
    renownRank: 80,
    career: null,
    items: emptyItems,
    isFromCharacter: false,
    characterName: undefined,
    ...(partial as any),
  };
}

function parseQsFromShareUrl(shareUrl: string): URLSearchParams {
  const idx = shareUrl.indexOf('#/?');
  const qs = idx >= 0 ? shareUrl.slice(idx + 3) : '';
  return new URLSearchParams(qs);
}

function expect(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function run() {
  // Minimal window mocks
  (global as any).window = {
    location: { href: 'https://example.com/', hash: '' },
    history: { replaceState: () => {} },
  };

  // State 2 (full fields) case
  const a: Loadout = makeLoadout({
    id: 'A',
    name: 'A',
    level: 39,
    renownRank: 65,
    career: 'BRIGHT_WIZARD' as Career,
    items: {
      ...(makeLoadout({}).items),
      MAIN_HAND: { item: { id: 'item-main' } as any, talismans: [ { id: 'tal-0' } as any, null, { id: 'tal-2' } as any ] },
      HEAD: { item: { id: 'item-head' } as any, talismans: [ { id: 'tal-h0' } as any ] },
    },
  });
  const b: Loadout = makeLoadout({ id: 'B', name: 'B', career: 'SORCERER' as Career });

  const share = urlService.buildCompareShareUrl(a, b, 'A');
  const params = parseQsFromShareUrl(share);

  // Validate A fields
  expect(params.get('a.career') === 'BRIGHT_WIZARD', 'a.career present');
  expect(params.get('a.level') === '39', 'a.level present and non-default');
  expect(params.get('a.renownRank') === '65', 'a.renownRank present and non-default');
  expect(params.get('a.item.MAIN_HAND') === 'item-main', 'a.item for MAIN_HAND present');
  expect(params.get('a.item.HEAD') === 'item-head', 'a.item for HEAD present');
  expect(params.get('a.talisman.MAIN_HAND.0') === 'tal-0', 'a.talisman MAIN_HAND 0 present');
  expect(params.get('a.talisman.MAIN_HAND.1') === null, 'a.talisman MAIN_HAND 1 omitted');
  expect(params.get('a.talisman.MAIN_HAND.2') === 'tal-2', 'a.talisman MAIN_HAND 2 present');
  expect(params.get('a.talisman.HEAD.0') === 'tal-h0', 'a.talisman HEAD 0 present');

  // Validate B defaults omitted
  expect(params.get('b.level') === null, 'b.level omitted because default');
  expect(params.get('b.renownRank') === null, 'b.renownRank omitted because default');
  expect(params.get('b.career') === 'SORCERER', 'b.career present');

  // Decode back via prefix helper
  (global as any).window.location.hash = `#/?${params.toString()}`;
  const decA = urlService.decodeLoadoutFromUrlWithPrefix('a');
  const decB = urlService.decodeLoadoutFromUrlWithPrefix('b');
  expect(decA?.career === 'BRIGHT_WIZARD', 'decode a.career');
  expect(decA?.level === 39, 'decode a.level');
  expect(decA?.renownRank === 65, 'decode a.renownRank');
  expect(decA?.items['MAIN_HAND'].item?.id === 'item-main', 'decode a item main');
  expect(decA?.items['HEAD'].item?.id === 'item-head', 'decode a item head');
  expect(decA?.items['MAIN_HAND'].talismans[0]?.id === 'tal-0', 'decode a tal 0');
  expect(decA?.items['MAIN_HAND'].talismans[1] == null, 'decode a tal 1 omitted');
  expect(decA?.items['MAIN_HAND'].talismans[2]?.id === 'tal-2', 'decode a tal 2');
  expect(decB?.career === 'SORCERER', 'decode b.career');
  expect(decB?.level === 40, 'decode b.level default');
  expect(decB?.renownRank === 80, 'decode b.renown default');

  // State 1 (from character) case: include loadCharacterA/B flags in share URL
  const aChar = makeLoadout({ id: 'A2', name: 'A2', isFromCharacter: true, characterName: 'Alice', career: 'BRIGHT_WIZARD' as Career });
  const bChar = makeLoadout({ id: 'B2', name: 'B2', isFromCharacter: true, characterName: 'Bob', career: 'SORCERER' as Career });
  const share2 = urlService.buildCompareShareUrl(aChar, bChar, 'A');
  const p2 = parseQsFromShareUrl(share2);
  expect(p2.get('loadCharacterA') === 'Alice', 'share2 includes loadCharacterA');
  expect(p2.get('loadCharacterB') === 'Bob', 'share2 includes loadCharacterB');
  // And still includes explicit fields for robustness
  expect(p2.get('a.career') === 'BRIGHT_WIZARD', 'share2 includes a.career');
  expect(p2.get('b.career') === 'SORCERER', 'share2 includes b.career');

  console.log('OK: share URL construction and decode validated');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
