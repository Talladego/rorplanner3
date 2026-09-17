import {
  applySlotHoverBright,
  clearSlotHoverBright,
  collectPairedHoverTargets,
  forceClearSlotHoverBright,
  releaseSlotHoverBright,
  HOVER_BRIGHT_CLASS,
  parseAnchorKey,
  resetSlotHoverBrightState,
  type ClassListHost,
  type SweepRoot,
} from '../utils/hoverBright';

type FakeEl = ClassListHost & {
  key?: string;
  talismanParent?: FakeEl | null;
  _classes: Set<string>;
};

function makeEl(key?: string, extra: string[] = []): FakeEl {
  const classes = new Set<string>(extra);
  const el: FakeEl = {
    key,
    talismanParent: null,
    _classes: classes,
    classList: {
      add: (...tokens: string[]) => {
        tokens.forEach((t) => classes.add(t));
      },
      remove: (...tokens: string[]) => {
        tokens.forEach((t) => classes.delete(t));
      },
      contains: (token: string) => classes.has(token),
    },
    closest: (selector: string) => {
      if (selector === '[data-talisman-index]') return el.talismanParent ?? null;
      if (selector === `.${HOVER_BRIGHT_CLASS}`) {
        if (classes.has(HOVER_BRIGHT_CLASS)) return el;
        if (el.talismanParent?._classes.has(HOVER_BRIGHT_CLASS)) return el.talismanParent;
        return null;
      }
      return null;
    },
    getAttribute: (name: string) => (name === 'data-anchor-key' ? el.key ?? null : null),
  };
  return el;
}

function makeRoot(els: FakeEl[]): SweepRoot {
  return {
    querySelectorAll: () => els.filter((el) => el._classes.has(HOVER_BRIGHT_CLASS)),
  };
}

describe('hoverBright', () => {
  beforeEach(() => {
    resetSlotHoverBrightState();
  });

  it('parseAnchorKey reads side, slot, and optional talisman index', () => {
    expect(parseAnchorKey('A:HELM')).toEqual({ side: 'A', slot: 'HELM' });
    expect(parseAnchorKey('B:MAIN_HAND:t1')).toEqual({ side: 'B', slot: 'MAIN_HAND', talismanIndex: 1 });
    expect(parseAnchorKey('picker-row')).toBeNull();
  });

  it('collectPairedHoverTargets includes the opposite-side mirror', () => {
    const helmA = makeEl('A:HELM');
    const helmB = makeEl('B:HELM');
    const anchors: Record<string, FakeEl> = { 'A:HELM': helmA, 'B:HELM': helmB };
    const pair = collectPairedHoverTargets({
      trigger: helmB,
      side: 'B',
      slot: 'HELM',
      queryAnchor: (key) => anchors[key] ?? null,
    });
    expect(pair).toEqual([helmB, helmA]);
  });

  it('enter on slot B clears leftover highlight on a non-paired slot A', () => {
    const ownerA = {};
    const ownerB = {};
    const helmA = makeEl('A:HELM');
    const helmB = makeEl('B:HELM');
    const shoulderA = makeEl('A:SHOULDER');
    const root = makeRoot([helmA, helmB, shoulderA]);
    const anchors: Record<string, FakeEl> = {
      'A:HELM': helmA,
      'B:HELM': helmB,
      'A:SHOULDER': shoulderA,
    };

    applySlotHoverBright(ownerA, [helmA, helmB], root);
    // Simulate a missed mouseleave that left an extra slot lit.
    shoulderA.classList.add(HOVER_BRIGHT_CLASS);
    expect(shoulderA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(true);

    const pairFromB = collectPairedHoverTargets({
      trigger: helmB,
      side: 'B',
      slot: 'HELM',
      queryAnchor: (key) => anchors[key] ?? null,
    });
    applySlotHoverBright(ownerB, pairFromB, root);

    expect(helmB.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(true);
    expect(helmA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(true);
    expect(shoulderA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
  });

  it('leave/unmount of the current owner clears the pair', () => {
    const owner = {};
    const helmA = makeEl('A:HELM');
    const helmB = makeEl('B:HELM');
    const root = makeRoot([helmA, helmB]);
    applySlotHoverBright(owner, [helmA, helmB], root);

    clearSlotHoverBright(owner, root);

    expect(helmA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
    expect(helmB.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
  });

  it('stale leave from a previous slot does not clear the new pair', () => {
    const ownerA = {};
    const ownerB = {};
    const helmA = makeEl('A:HELM');
    const helmB = makeEl('B:HELM');
    const shoulderA = makeEl('A:SHOULDER');
    const shoulderB = makeEl('B:SHOULDER');
    const root = makeRoot([helmA, helmB, shoulderA, shoulderB]);

    applySlotHoverBright(ownerA, [helmA, helmB], root);
    applySlotHoverBright(ownerB, [shoulderA, shoulderB], root);
    // Delayed mouseleave from helm must not wipe the current shoulder pair.
    clearSlotHoverBright(ownerA, root);

    expect(shoulderA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(true);
    expect(shoulderB.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(true);
    expect(helmA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
    expect(helmB.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
  });

  it('forceClear removes leftovers even without an owner', () => {
    const helmA = makeEl('A:HELM');
    helmA.classList.add(HOVER_BRIGHT_CLASS);
    const root = makeRoot([helmA]);
    forceClearSlotHoverBright(root);
    expect(helmA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
  });

  it('collectPairedHoverTargets includes talisman containers on both sides', () => {
    const slotA = makeEl();
    const slotB = makeEl();
    const tA = makeEl('A:BODY:t0');
    const tB = makeEl('B:BODY:t0');
    tA.talismanParent = slotA;
    tB.talismanParent = slotB;
    const pair = collectPairedHoverTargets({
      trigger: tA,
      talismanIndex: 0,
      side: 'A',
      slot: 'BODY',
      queryAnchor: (key) => (key === 'B:BODY:t0' ? tB : null),
    });
    expect(pair).toEqual([tA, slotA, tB, slotB]);
  });

  it('release still clears when the trigger is lit even if a different owner applied it', () => {
    const tooltipOwner = {};
    const guardOwner = {};
    const helmA = makeEl('A:HELM');
    const helmB = makeEl('B:HELM');
    const root = makeRoot([helmA, helmB]);
    applySlotHoverBright(guardOwner, [helmA, helmB], root);

    releaseSlotHoverBright(tooltipOwner, helmA, null, root);

    expect(helmA.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
    expect(helmB.classList.contains?.(HOVER_BRIGHT_CLASS)).toBe(false);
  });
});
