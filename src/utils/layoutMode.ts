import {
  DESIGN_WIDTH,
  LAYOUT_OVERRIDE_STORAGE_KEY,
  TABLET_SCALE_FLOOR,
  TABLET_WIDTH_THRESHOLD,
} from '../constants/ui';

export type LayoutMode = 'desktop' | 'tablet';
export type LayoutOverride = LayoutMode | null;
export type TabletTab = 'A' | 'compare' | 'B';

export interface LayoutCapabilities {
  width: number;
  height: number;
  /** `matchMedia('(pointer: coarse)').matches` */
  coarsePointer: boolean;
  /** `matchMedia('(hover: none)').matches` */
  hoverNone: boolean;
  override?: LayoutOverride;
}

export interface TabletPresentation {
  layoutMode: LayoutMode;
  /** Portrait, or landscape that cannot fit 1440 at ≥ the scale floor. */
  useTabs: boolean;
  /** Three-column canvas with ScaleToFit is allowed (scale will be ≥ floor). */
  useScaledCanvas: boolean;
  isPortrait: boolean;
  /** Raw fit of the 1440 canvas; may be below the tablet floor. */
  rawScale: number;
}

export function parseLayoutOverride(value: string | null | undefined): LayoutOverride {
  if (value === 'desktop' || value === 'tablet') return value;
  return null;
}

export function isPortraitViewport(width: number, height: number): boolean {
  return height > width;
}

/** Viewport cannot fit the 1440 design at the tablet scale floor (~0.8). */
export function cannotFitDesignAtFloor(
  width: number,
  designWidth = DESIGN_WIDTH,
  floor = TABLET_SCALE_FLOOR,
): boolean {
  if (designWidth <= 0) return false;
  return width < designWidth * floor;
}

/**
 * Detect desktop vs tablet from capabilities. Never sniffs UA / iPad.
 * Override always wins. Otherwise tablet requires a coarse pointer and/or no hover,
 * AND a viewport that cannot fit 1440 at a reasonable scale (width ≲ ~1150, or portrait).
 */
export function detectLayoutMode(caps: LayoutCapabilities): LayoutMode {
  if (caps.override === 'desktop' || caps.override === 'tablet') return caps.override;
  const touchLike = caps.coarsePointer || caps.hoverNone;
  if (!touchLike) return 'desktop';
  const portrait = isPortraitViewport(caps.width, caps.height);
  if (portrait || cannotFitDesignAtFloor(caps.width)) return 'tablet';
  return 'desktop';
}

/**
 * In tablet mode, reflow to A | Compare | B tabs when three columns would
 * shrink below the scale floor, and always in portrait.
 */
export function shouldUseTabletTabs(mode: LayoutMode, width: number, height: number): boolean {
  if (mode !== 'tablet') return false;
  if (isPortraitViewport(width, height)) return true;
  return cannotFitDesignAtFloor(width);
}

export function resolveTabletPresentation(caps: LayoutCapabilities): TabletPresentation {
  const layoutMode = detectLayoutMode(caps);
  const isPortrait = isPortraitViewport(caps.width, caps.height);
  const rawScale = caps.width > 0 && DESIGN_WIDTH > 0 ? caps.width / DESIGN_WIDTH : 1;
  const useTabs = shouldUseTabletTabs(layoutMode, caps.width, caps.height);
  const useScaledCanvas = layoutMode === 'desktop' || (layoutMode === 'tablet' && !useTabs);
  return { layoutMode, useTabs, useScaledCanvas, isPortrait, rawScale };
}

export function readStoredLayoutOverride(
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof localStorage === 'undefined' ? null : localStorage,
): LayoutOverride {
  if (!storage) return null;
  try {
    return parseLayoutOverride(storage.getItem(LAYOUT_OVERRIDE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredLayoutOverride(
  override: LayoutOverride,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return;
  try {
    if (!override) storage.removeItem(LAYOUT_OVERRIDE_STORAGE_KEY);
    else storage.setItem(LAYOUT_OVERRIDE_STORAGE_KEY, override);
  } catch {
    // ignore quota / private-mode failures
  }
}

export { TABLET_SCALE_FLOOR, TABLET_WIDTH_THRESHOLD, LAYOUT_OVERRIDE_STORAGE_KEY };
