import { ReactNode, useEffect, useRef, useState } from 'react';
import type { MouseEventHandler } from 'react';
import { createPortal } from 'react-dom';

type HoverTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: 'left' | 'right' | 'bottom';
  className?: string;
};

// Lightweight hover tooltip suitable for inline rows (no portals)
// Positions below the trigger; hides on scroll via CSS overflow of parent containers
export default function HoverTooltip({ content, children, placement = 'right', className }: HoverTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const computePosition = (rect: DOMRect) => {
    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedWidth = 320;
    const estimatedHeight = 60; // these tooltips are short, no wrap

    let x = rect.right + margin;
    let y = rect.top;

    if (placement === 'left') {
      x = rect.left - estimatedWidth - margin;
      y = rect.top;
    } else if (placement === 'bottom') {
      x = rect.left;
      y = rect.bottom + margin;
    }

    // Flip horizontally if overflowing
    if (x + estimatedWidth > viewportWidth) {
      x = rect.left - estimatedWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }

    // Keep within vertical bounds
    if (y + estimatedHeight > viewportHeight) {
      y = viewportHeight - estimatedHeight - margin;
    }
    if (y < margin) {
      y = margin;
    }

    setPos({ x, y });
  };

  const handleEnter: MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    computePosition(rect);
    setOpen(true);

    // Refine after render using real size
    setTimeout(() => {
      if (!tooltipRef.current) return;
      const tipRect = tooltipRef.current.getBoundingClientRect();
      const margin = 10;
      // Start from desired placement like regular tooltip (prefer right)
      let x = rect.right + margin;
      let y = rect.top;

      if (placement === 'left') {
        x = rect.left - tipRect.width - margin;
        y = rect.top;
      } else if (placement === 'bottom') {
        x = rect.left;
        y = rect.bottom + margin;
      }

      // Flip horizontally if overflowing
      if (x + tipRect.width > window.innerWidth) {
        x = rect.left - tipRect.width - margin;
      }
      // Ensure within viewport
      if (y + tipRect.height > window.innerHeight) {
        y = window.innerHeight - tipRect.height - margin;
      }
      if (x < margin) x = margin;
      if (y < margin) y = margin;
      setPos({ x, y });
    }, 10);
  };

  // Reflow position on scroll/resize while open so it stays anchored even as layout moves/scales
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const tipRect = tooltipRef.current.getBoundingClientRect();
      const margin = 10;
      let x = rect.right + margin;
      let y = rect.top;
      if (placement === 'left') {
        x = rect.left - tipRect.width - margin;
        y = rect.top;
      } else if (placement === 'bottom') {
        x = rect.left;
        y = rect.bottom + margin;
      }
      if (x + tipRect.width > window.innerWidth) x = rect.left - tipRect.width - margin;
      if (y + tipRect.height > window.innerHeight) y = window.innerHeight - tipRect.height - margin;
      if (x < margin) x = margin;
      if (y < margin) y = margin;
      setPos({ x, y });
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, placement]);

  return (
    <div ref={triggerRef} className={`relative block ${className || ''}`} onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && createPortal(
        <span
          ref={tooltipRef}
          className={'fixed z-[11000] rounded-lg bg-gray-900 dark:bg-gray-800 p-2 text-xs leading-snug text-white shadow-lg border border-gray-700 dark:border-gray-600 pointer-events-none whitespace-normal'}
          style={{ left: pos.x, top: pos.y, maxWidth: 360 }}
          role="tooltip"
        >
          {content}
        </span>,
        document.body
      )}
    </div>
  );
}
