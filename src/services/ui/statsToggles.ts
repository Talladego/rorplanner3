// Shared UI state for stats toggles (Career/Base, Renown, Derived)
// Default to false unless explicitly set by StatsComparePanel or URL init.

let includeBaseStats = false;
let includeRenownStats = false;
let includeDerivedStats = false;

export function setIncludeBaseStats(val: boolean) {
  includeBaseStats = !!val;
}

export function setIncludeRenownStats(val: boolean) {
  includeRenownStats = !!val;
}

export function setIncludeDerivedStats(val: boolean) {
  includeDerivedStats = !!val;
}

export function getIncludeBaseStats(): boolean {
  return includeBaseStats;
}

export function getIncludeRenownStats(): boolean {
  return includeRenownStats;
}

export function getIncludeDerivedStats(): boolean {
  return includeDerivedStats;
}

export function getAllToggles() {
  return { includeBaseStats, includeRenownStats, includeDerivedStats };
}
