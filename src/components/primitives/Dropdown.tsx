import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
  iconUrl?: string;
};

export type DropdownSize = 'sm' | 'md';

interface DropdownProps<T extends string> {
  value: T | '';
  onChange: (value: T | '') => void;
  options: Array<DropdownOption<T>>;
  placeholder?: string;
  size?: DropdownSize;
  className?: string; // container class (width constraints)
  buttonClassName?: string; // button class override
  menuClassName?: string; // menu class override
  usePortal?: boolean; // render the menu in a portal with fixed positioning
  disabled?: boolean;
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function Dropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  size = 'md',
  className,
  buttonClassName,
  menuClassName,
  usePortal = false,
  disabled = false,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => options.find(o => o.value === value) || null, [options, value]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const itemPadding = size === 'sm' ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-sm';

  const defaultButtonClass = classNames(
    'w-full',
    itemPadding,
    'border border-gray-300 dark:border-gray-600 rounded-md',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'flex items-center gap-2 min-w-0',
    disabled && 'opacity-50 cursor-not-allowed',
  );

  const defaultMenuClass = classNames(
    'z-[60] rounded-md border border-gray-300 dark:border-gray-600',
    'bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100',
    'overflow-auto max-h-60',
  );

  // compute portal position
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);
  const computePortalPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const belowSpace = viewportH - rect.bottom - 8;
    const aboveSpace = rect.top - 8;
    const desiredHeight = 240;
    let style: React.CSSProperties = {
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      zIndex: 60,
      maxHeight: Math.max(120, Math.min(desiredHeight, belowSpace)),
    };
    if (belowSpace < 160 && aboveSpace > belowSpace) {
      style = { ...style, bottom: Math.round(viewportH - rect.top), maxHeight: Math.max(120, Math.min(desiredHeight, aboveSpace)) };
    } else {
      style = { ...style, top: Math.round(rect.bottom) };
    }
    setPortalStyle(style);
  }, []);

  useEffect(() => {
    if (!open || !usePortal) return;
    computePortalPosition();
    const onRescroll = () => computePortalPosition();
    window.addEventListener('resize', onRescroll);
    window.addEventListener('scroll', onRescroll, true);
    return () => {
      window.removeEventListener('resize', onRescroll);
      window.removeEventListener('scroll', onRescroll, true);
    };
  }, [open, usePortal, computePortalPosition]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return; // handled in-menu
      if (buttonRef.current && buttonRef.current.contains(target)) return; // button click toggles
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // prevent modal close when clicking inside portal (stop propagation)
  const stopMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const openMenu = () => {
    setOpen(true);
    const idx = options.findIndex(o => o.value === value);
    setActiveIndex(idx);
  };

  const selectIndex = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < options.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : options.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectIndex(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  // ensure active option is in view
  useEffect(() => {
    if (!open) return;
    const el = menuRef.current?.querySelector<HTMLElement>(`[data-opt-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const renderMenu = () => (
    <div
      ref={menuRef}
      role="listbox"
      className={classNames(defaultMenuClass, menuClassName)}
      style={usePortal ? portalStyle ?? undefined : undefined}
      onMouseDown={stopMouseDown}
    >
      {/* Clear option */}
      <button
        type="button"
        className={classNames('w-full text-left', itemPadding, 'hover:bg-gray-100 dark:hover:bg-gray-700')}
        onClick={() => {
          onChange('' as T | '');
          setOpen(false);
        }}
      >
        {placeholder}
      </button>
      {options.map((opt, idx) => {
        const selected = value === opt.value;
        const active = idx === activeIndex;
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={selected}
            data-opt-idx={idx}
            className={classNames('w-full text-left flex items-center gap-2', itemPadding, selected ? 'bg-gray-700 text-white' : active ? 'bg-gray-700/60' : 'hover:bg-gray-700/40')}
            onMouseEnter={() => setActiveIndex(idx)}
            onClick={() => selectIndex(idx)}
          >
            {opt.iconUrl && <img src={opt.iconUrl} alt="" className={classNames(iconSize, 'rounded')} />}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
      {!options.length && (
        <div className={classNames(itemPadding, 'text-secondary')}>No options</div>
      )}
    </div>
  );

  return (
    <div className={classNames('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        className={classNames(defaultButtonClass, buttonClassName)}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.iconUrl ? (
            <img src={selectedOption.iconUrl} alt="" className={classNames(iconSize, 'rounded')} />
          ) : (
            <div className={classNames(iconSize)} />
          )}
          <span className={classNames('truncate', selectedOption ? '' : 'text-muted')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <svg className="w-4 h-4 text-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Inline menu */}
      {open && !usePortal && renderMenu()}

      {/* Portal menu */}
      {open && usePortal && (
        portalRef.current || (portalRef.current = document.createElement('div')),
        portalRef.current && document.body.contains(portalRef.current) ? undefined : document.body.appendChild(portalRef.current),
        createPortal(renderMenu(), portalRef.current)
      )}
    </div>
  );
}
