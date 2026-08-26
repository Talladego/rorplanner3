// UI constants centralization
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 15, 20] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];
// LocalStorage key for remembering Equipment Selector page size
export const PAGE_SIZE_STORAGE_KEY = 'ui.selector.pageSize';

/** Fixed three-column A / Compare / B canvas. ScaleToFit treats this as the layout source of truth. */
export const DESIGN_WIDTH = 1440;
/** Floor so ~360px phones still fit; 1024/1440 ≈ 0.711 needs to be below the old 0.75 clamp. */
export const SCALE_MIN = 0.25;
/** Never upscale: 1920 should match the current centered 1440 desktop layout. */
export const SCALE_MAX = 1;

/**
 * Tablet mode never shrinks the 1440 canvas below this. If it cannot fit,
 * the shell reflows (tabs) instead of scaling to a postage stamp.
 */
export const TABLET_SCALE_FLOOR = 0.8;
/** ~1152px: 0.8 × 1440. Viewports narrower than this cannot fit the canvas at the floor. */
export const TABLET_WIDTH_THRESHOLD = DESIGN_WIDTH * TABLET_SCALE_FLOOR;
/** localStorage key for an explicit desktop/tablet layout override. */
export const LAYOUT_OVERRIDE_STORAGE_KEY = 'ui.layoutMode.override';
/** Minimum tap target (CSS px) for primary tablet controls. */
export const TABLET_TAP_MIN_PX = 44;
