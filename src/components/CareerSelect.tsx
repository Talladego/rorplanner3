import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Career } from '../types';
import { formatCareerName } from '../utils/formatters';
import { getCareerIconUrl } from '../constants/careerIcons';

type Size = 'sm' | 'md';

interface CareerSelectProps {
  value: Career | '';
  onChange: (career: Career | '') => void;
  placeholder?: string;
  size?: Size;
}

export default function CareerSelect({ value, onChange, placeholder = 'Select Career', size = 'md' }: CareerSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const careers = useMemo(() => Object.values(Career), []);

  const selectedLabel = value ? formatCareerName(value as Career) : placeholder;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const itemPadding = size === 'sm' ? 'py-0.5 px-2 text-xs' : 'py-2 px-3 text-sm';

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (listRef.current && listRef.current.contains(t)) return;
      if (buttonRef.current && buttonRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const openMenu = () => {
    setOpen(true);
    // set activeIndex to selected item
    const idx = value ? careers.indexOf(value as Career) : -1;
    setActiveIndex(idx);
  };

  const selectIndex = (idx: number) => {
    const career = careers[idx];
    onChange(career as Career);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < careers.length - 1 ? i + 1 : 0;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => {
        const prev = i > 0 ? i - 1 : careers.length - 1;
        return prev;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectIndex(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`form-input form-input-text control-compact w-full ${itemPadding} rounded-md flex items-center justify-between text-left`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {value ? (
            <img src={getCareerIconUrl(value as Career)} alt={selectedLabel} className={`${iconSize} rounded`} />
          ) : (
            <div className={`${iconSize}`} />
          )}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <svg className="w-4 h-4 text-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div ref={listRef} className="absolute z-50 mt-1 w-full rounded-md border border-gray-600 bg-gray-800 text-white shadow-lg max-h-60 overflow-auto" role="listbox">
          {careers.map((career, idx) => {
            const label = formatCareerName(career);
            const selected = value === career;
            const active = idx === activeIndex;
            return (
              <div
                key={career}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                className={`${itemPadding} flex items-center gap-2 cursor-pointer ${selected ? 'bg-gray-700' : active ? 'bg-gray-700/60' : 'hover:bg-gray-700/40'}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectIndex(idx)}
              >
                <img src={getCareerIconUrl(career)} alt={label} className={`${iconSize} rounded`} />
                <span className="truncate">{label}</span>
              </div>
            );
          })}
          {!careers.length && (
            <div className={`${itemPadding} text-secondary`}>No careers</div>
          )}
        </div>
      )}
    </div>
  );
}
