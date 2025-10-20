// Shared UI preference: whether to block invalid item selections in the selector
// Default: true (block invalid items)
let blockInvalidItems = true;

export function setBlockInvalidItems(val: boolean) {
  blockInvalidItems = !!val;
  try { localStorage.setItem('ui.selector.blockInvalidItems', blockInvalidItems ? '1' : '0'); } catch { /* ignore storage errors */ }
}

export function getBlockInvalidItems(): boolean {
  // lazy read from localStorage first time
  try {
    const raw = localStorage.getItem('ui.selector.blockInvalidItems');
    if (raw != null) {
      blockInvalidItems = raw === '1' || raw === 'true';
    }
  } catch {
    // ignore storage access errors
  }
  return blockInvalidItems;
}
