import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ScaleToFitProps {
  children: React.ReactNode;
  /** The unscaled design width (px) that the inner content is laid out for */
  designWidth: number;
  /** Smallest scale to allow (0..1). Default 0.8 */
  minScale?: number;
}

/**
 * Scales its children down with CSS transform so a fixed-width layout can fit smaller windows.
 * - Sets the inner content to a fixed pixel width (designWidth), preventing wrap.
 * - Computes a scale factor = min(1, availableWidth / designWidth), clamped by minScale.
 * - Uses a ResizeObserver on the inner content to reserve scaled height in layout.
 */
export default function ScaleToFit({ children, designWidth, minScale = 0.8 }: ScaleToFitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number>(0);

  // Measure available width and compute scale
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      const s = Math.min(1, Math.max(minScale, available / designWidth));
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [designWidth, minScale]);

  // Track natural inner height to reserve space (transforms don't affect layout)
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const updateHeight = () => setInnerHeight(inner.scrollHeight);
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} style={{ position: 'relative', height: innerHeight * scale }}>
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
