import { computeFitScale } from '../utils/fitScale';
import { DESIGN_WIDTH, SCALE_MAX, SCALE_MIN } from '../constants/ui';

describe('computeFitScale', () => {
  const fit = (available: number) => computeFitScale(available, DESIGN_WIDTH, SCALE_MIN, SCALE_MAX);

  it('scales the 1440 layout down at 1280 without overflowing', () => {
    const s = fit(1280);
    expect(s).toBeLessThan(1);
    expect(s * DESIGN_WIDTH).toBeLessThanOrEqual(1280);
  });

  it('fits 1024 without the old 0.75 floor leaving a horizontal remainder', () => {
    const s = fit(1024);
    expect(s).toBeLessThan(0.75);
    expect(s * DESIGN_WIDTH).toBeLessThanOrEqual(1024);
  });

  it('does not upscale at 1920', () => {
    expect(fit(1920)).toBe(1);
  });

  it('is 1 when the viewport matches the design width', () => {
    expect(fit(1440)).toBe(1);
  });

  it('shrinks for a typical classic scrollbar so the 1440 right edge stays on-screen', () => {
    const s = fit(1440 - 15);
    expect(s).toBeLessThan(1);
    expect(s * DESIGN_WIDTH).toBeLessThanOrEqual(1425);
  });

  it('clamps to minScale on very narrow viewports', () => {
    expect(fit(200)).toBe(SCALE_MIN);
  });

  it('quantizes so subpixel width noise does not change the committed scale', () => {
    const a = computeFitScale(1280, DESIGN_WIDTH, SCALE_MIN, SCALE_MAX);
    const b = computeFitScale(1280.1, DESIGN_WIDTH, SCALE_MIN, SCALE_MAX);
    expect(a).toBe(b);
  });
});
