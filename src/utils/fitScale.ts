/**
 * Compute a CSS transform scale that fits a fixed design width into an available viewport.
 * Quantizes downward so subpixel rounding never overflows and retriggers scrollbars.
 */
export function computeFitScale(
  availableWidth: number,
  designWidth: number,
  minScale: number,
  maxScale: number,
  cushionPx = 0,
): number {
  if (designWidth <= 0) return 1;
  const usable = Math.max(0, availableWidth - cushionPx);
  const desired = usable / designWidth;
  const clamped = Math.min(maxScale, Math.max(minScale, desired));
  // Floor to thousandths: rounding up by 0.0005 can be enough to spawn a horizontal scrollbar,
  // which shrinks clientWidth and fights ResizeObserver (the original ScaleToFit flicker).
  return Math.floor(clamped * 1000) / 1000;
}
