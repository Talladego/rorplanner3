import React, { useLayoutEffect, useRef, useState } from 'react';
import { ScaleContext } from './ScaleContext';
import { computeFitScale } from '../../utils/fitScale';

interface ScaleToFitProps {
  children: React.ReactNode;
  /** The unscaled design width (px) that the inner content is laid out for */
  designWidth: number;
  /** Smallest scale to allow (0..1). Default 0.25 */
  minScale?: number;
  /** Largest scale to allow (>1 enables upscale). Default 1 */
  maxScale?: number;
}

/**
 * Scales its children with CSS transform so a fixed-width layout can fit smaller windows.
 *
 * Flicker this replaces: ResizeObserver on width + transform height reservation used to fight
 * the vertical scrollbar. When scaled height crossed the viewport, the scrollbar toggled,
 * clientWidth jumped ~15px, scale changed, height crossed back, and the loop painted as flicker.
 *
 * Stability:
 * - Outer is width:100% with overflow:hidden so the unscaled 1440px inner box never creates
 *   a horizontal page scrollbar (transforms do not affect layout).
 * - Height is reserved as innerHeight * scale; width-driven scale updates ignore height-only
 *   observer callbacks.
 * - Scale is quantized (see computeFitScale) and only committed when it actually changes.
 * - html { scrollbar-gutter: stable } keeps clientWidth stable when a vertical bar appears.
 */
export default function ScaleToFit({ children, designWidth, minScale = 0.25, maxScale = 1 }: ScaleToFitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);
  const scaleRef = useRef(1);
  const heightRef = useRef(0);
  const widthRef = useRef(-1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const available = outer.clientWidth;
      // Ignore subpixel width noise; real scrollbar jumps are handled by scrollbar-gutter.
      if (Math.abs(available - widthRef.current) >= 0.5) {
        widthRef.current = available;
        const nextScale = computeFitScale(available, designWidth, minScale, maxScale);
        if (nextScale !== scaleRef.current) {
          scaleRef.current = nextScale;
          setScale(nextScale);
        }
      }
      const nextHeight = inner.offsetHeight;
      if (Math.abs(nextHeight - heightRef.current) >= 1) {
        heightRef.current = nextHeight;
        setInnerHeight(nextHeight);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };

    apply();

    const ro = new ResizeObserver(schedule);
    ro.observe(outer);
    ro.observe(inner);
    window.addEventListener('resize', schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [designWidth, minScale, maxScale]);

  return (
    <ScaleContext.Provider value={scale}>
      <div
        ref={outerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: innerHeight * scale,
          overflow: 'hidden',
        }}
      >
        <div
          ref={innerRef}
          style={{
            width: designWidth,
            position: 'absolute',
            left: '50%',
            top: 0,
            marginLeft: -designWidth / 2,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>
    </ScaleContext.Provider>
  );
}
