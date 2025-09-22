import { ReactNode, useRef, useState } from 'react';

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

  const handleEnter: React.MouseEventHandler<HTMLDivElement> = (e) => {
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

  return (
    <div className={`relative block ${className || ''}`} onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <span
          ref={tooltipRef}
          className={
            'fixed z-50 rounded-lg bg-gray-900 dark:bg-gray-800 p-2 text-xs leading-snug text-white shadow-lg border border-gray-700 dark:border-gray-600 pointer-events-none whitespace-nowrap'
          }
          style={{ left: pos.x, top: pos.y }}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </div>
  );
}
