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
