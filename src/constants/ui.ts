// UI constants centralization
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 15, 20] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];
// LocalStorage key for remembering Equipment Selector page size
export const PAGE_SIZE_STORAGE_KEY = 'ui.selector.pageSize';
