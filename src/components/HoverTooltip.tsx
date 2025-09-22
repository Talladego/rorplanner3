import { ReactNode, useState } from 'react';

type HoverTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: 'left' | 'right' | 'bottom';
  className?: string;
};

// Lightweight hover tooltip suitable for inline rows (no portals)
// Positions below the trigger; hides on scroll via CSS overflow of parent containers
export default function HoverTooltip({ content, children, placement = 'bottom', className }: HoverTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`relative block ${className || ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          className={
            `absolute z-50 max-w-[28rem] rounded-lg bg-gray-900 dark:bg-gray-800 p-2 text-xs leading-snug text-white shadow-lg border border-gray-700 dark:border-gray-600 pointer-events-none ` +
            (placement === 'left'
              ? 'right-full mr-2 top-0'
              : placement === 'right'
                ? 'left-full ml-2 top-0'
                : 'left-0 mt-1 tooltip-shift-down')
          }
          role="tooltip"
        >
          {content}
        </span>
      )}
    </div>
  );
}
