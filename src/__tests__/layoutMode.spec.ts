import { DESIGN_WIDTH, SCALE_MAX, SCALE_MIN, TABLET_SCALE_FLOOR, TABLET_WIDTH_THRESHOLD } from '../constants/ui';
import { computeFitScale } from '../utils/fitScale';
import {
  cannotFitDesignAtFloor,
  detectLayoutMode,
  parseLayoutOverride,
  readStoredLayoutOverride,
  resolveTabletPresentation,
  shouldUseTabletTabs,
  writeStoredLayoutOverride,
  type LayoutCapabilities,
} from '../utils/layoutMode';

function caps(partial: Partial<LayoutCapabilities> & Pick<LayoutCapabilities, 'width' | 'height'>): LayoutCapabilities {
  return {
    coarsePointer: false,
    hoverNone: false,
    override: null,
    ...partial,
  };
}

describe('parseLayoutOverride', () => {
  it('accepts desktop and tablet', () => {
    expect(parseLayoutOverride('desktop')).toBe('desktop');
    expect(parseLayoutOverride('tablet')).toBe('tablet');
  });

  it('rejects unknown values', () => {
    expect(parseLayoutOverride('phone')).toBeNull();
    expect(parseLayoutOverride('')).toBeNull();
    expect(parseLayoutOverride(null)).toBeNull();
    expect(parseLayoutOverride(undefined)).toBeNull();
  });
});

describe('detectLayoutMode', () => {
  it('maps coarse pointer + narrow width to tablet', () => {
    expect(detectLayoutMode(caps({ width: 768, height: 1024, coarsePointer: true }))).toBe('tablet');
    expect(detectLayoutMode(caps({ width: 1024, height: 768, coarsePointer: true }))).toBe('tablet');
    expect(detectLayoutMode(caps({ width: 1100, height: 700, hoverNone: true }))).toBe('tablet');
  });

  it('maps wide + fine pointer (hover) to desktop', () => {
    expect(detectLayoutMode(caps({ width: 1440, height: 900 }))).toBe('desktop');
    expect(detectLayoutMode(caps({ width: 1920, height: 1080 }))).toBe('desktop');
    expect(detectLayoutMode(caps({ width: 1280, height: 800 }))).toBe('desktop');
  });

  it('keeps a wide landscape touch device on desktop when 1440 fits at ≥ 0.8', () => {
    // 12.9" landscape ~1366×1024: 1366/1440 ≈ 0.95
    expect(detectLayoutMode(caps({ width: 1366, height: 1024, coarsePointer: true, hoverNone: true }))).toBe('desktop');
  });

  it('uses tablet for portrait touch even when the short edge is wide enough', () => {
    expect(detectLayoutMode(caps({ width: 1024, height: 1366, coarsePointer: true }))).toBe('tablet');
  });

  it('does not treat a narrow desktop (fine pointer + hover) as tablet', () => {
    expect(detectLayoutMode(caps({ width: 768, height: 1024 }))).toBe('desktop');
  });

  it('lets an explicit override win over capabilities', () => {
    expect(detectLayoutMode(caps({
      width: 768,
      height: 1024,
      coarsePointer: true,
      hoverNone: true,
      override: 'desktop',
    }))).toBe('desktop');
    expect(detectLayoutMode(caps({
      width: 1920,
      height: 1080,
      override: 'tablet',
    }))).toBe('tablet');
  });
});

describe('tablet scale floor and tabs', () => {
  it('treats widths below ~1150 as unable to fit 1440 at 0.8', () => {
    expect(TABLET_WIDTH_THRESHOLD).toBe(DESIGN_WIDTH * TABLET_SCALE_FLOOR);
    expect(cannotFitDesignAtFloor(1150)).toBe(true);
    expect(cannotFitDesignAtFloor(1152)).toBe(false);
    expect(cannotFitDesignAtFloor(1024)).toBe(true);
    expect(cannotFitDesignAtFloor(768)).toBe(true);
  });

  it('kicks in tabs for tablet portrait (iPad 768×1024)', () => {
    expect(shouldUseTabletTabs('tablet', 768, 1024)).toBe(true);
    const p = resolveTabletPresentation(caps({ width: 768, height: 1024, coarsePointer: true }));
    expect(p.useTabs).toBe(true);
    expect(p.useScaledCanvas).toBe(false);
    expect(p.rawScale).toBeLessThan(TABLET_SCALE_FLOOR);
  });

  it('kicks in tabs for tablet landscape that cannot fit at 0.8 (1024×768)', () => {
    expect(shouldUseTabletTabs('tablet', 1024, 768)).toBe(true);
    const p = resolveTabletPresentation(caps({ width: 1024, height: 768, coarsePointer: true }));
    expect(p.layoutMode).toBe('tablet');
    expect(p.useTabs).toBe(true);
    expect(p.rawScale).toBeLessThan(TABLET_SCALE_FLOOR);
    // Desktop ScaleToFit would have shrunk below the floor; tablet must reflow instead.
    expect(computeFitScale(1024, DESIGN_WIDTH, SCALE_MIN, SCALE_MAX)).toBeLessThan(TABLET_SCALE_FLOOR);
  });

  it('allows three-column canvas when tablet landscape fits at ≥ 0.8 (override on 12.9")', () => {
    expect(shouldUseTabletTabs('tablet', 1366, 1024)).toBe(false);
    const p = resolveTabletPresentation(caps({
      width: 1366,
      height: 1024,
      coarsePointer: true,
      override: 'tablet',
    }));
    expect(p.useTabs).toBe(false);
    expect(p.useScaledCanvas).toBe(true);
    expect(p.rawScale).toBeGreaterThanOrEqual(TABLET_SCALE_FLOOR);
  });

  it('never uses tabs in desktop mode', () => {
    expect(shouldUseTabletTabs('desktop', 768, 1024)).toBe(false);
    expect(shouldUseTabletTabs('desktop', 1024, 768)).toBe(false);
  });

  it('keeps desktop fit-scale behavior at 1280 / 1440 / 1920', () => {
    const fit = (w: number) => computeFitScale(w, DESIGN_WIDTH, SCALE_MIN, SCALE_MAX);
    expect(fit(1280)).toBeLessThan(1);
    expect(fit(1280) * DESIGN_WIDTH).toBeLessThanOrEqual(1280);
    expect(fit(1440)).toBe(1);
    expect(fit(1920)).toBe(1);
  });
});

describe('layout override storage', () => {
  function memoryStorage(): Storage {
    const data = new Map<string, string>();
    return {
      get length() { return data.size; },
      clear: () => data.clear(),
      getItem: (k) => (data.has(k) ? data.get(k)! : null),
      setItem: (k, v) => { data.set(k, String(v)); },
      removeItem: (k) => { data.delete(k); },
      key: (i) => Array.from(data.keys())[i] ?? null,
    } as Storage;
  }

  it('round-trips an override and treats it as winning later', () => {
    const storage = memoryStorage();
    writeStoredLayoutOverride('desktop', storage);
    expect(readStoredLayoutOverride(storage)).toBe('desktop');
    expect(detectLayoutMode(caps({
      width: 768,
      height: 1024,
      coarsePointer: true,
      override: readStoredLayoutOverride(storage),
    }))).toBe('desktop');
  });

  it('clears when override is null', () => {
    const storage = memoryStorage();
    writeStoredLayoutOverride('tablet', storage);
    writeStoredLayoutOverride(null, storage);
    expect(readStoredLayoutOverride(storage)).toBeNull();
  });
});
