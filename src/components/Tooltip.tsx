import React, { useState, useRef, useEffect } from 'react';
import { Item } from '../types';
import { getItemColor } from '../utils/rarityColors';
import { formatItemTypeName, formatRarityName, formatStatName } from '../utils/formatters';

interface TooltipProps {
  children: React.ReactNode;
  item: Item | null;
  className?: string;
}

export default function Tooltip({ children, item, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!item) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 320; // Approximate tooltip width
    const tooltipHeight = 200; // Approximate tooltip height
    const margin = 10;

    let x = rect.right + margin; // Position to the right
    let y = rect.top; // Align with top of element

    // Check if tooltip would go off-screen to the right
    if (x + tooltipWidth > window.innerWidth) {
      x = rect.left - tooltipWidth - margin; // Position to the left instead
    }

    // Check if tooltip would go off-screen at the bottom
    if (y + tooltipHeight > window.innerHeight) {
      y = window.innerHeight - tooltipHeight - margin; // Move up to fit
    }

    // Ensure tooltip doesn't go off-screen at the top
    if (y < margin) {
      y = margin;
    }

    setPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  if (!item) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-3 max-w-xs pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {/* Item Header */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={item.iconUrl}
              alt={item.name}
              className="w-8 h-8 rounded object-contain"
            />
            <div>
              <h3 className="font-bold text-sm" style={{ color: getItemColor(item) }}>{item.name}</h3>
              <p className="text-xs text-gray-300">{formatItemTypeName(item.type)} - {formatRarityName(item.rarity)}</p>
            </div>
          </div>

          {/* Item Description */}
          <p className="text-xs text-gray-200 mb-2 leading-tight">{item.description}</p>

          {/* Item Stats */}
          <div className="space-y-1">
            {item.levelRequirement > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Level:</span> {item.levelRequirement}
              </div>
            )}
            {item.renownRankRequirement > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Renown:</span> {item.renownRankRequirement}
              </div>
            )}
            {item.itemLevel > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Item Level:</span> {item.itemLevel}
              </div>
            )}
            {item.armor > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Armor:</span> {item.armor}
              </div>
            )}
            {item.dps > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">DPS:</span> {item.dps}
              </div>
            )}
            {item.speed > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Speed:</span> {item.speed}
              </div>
            )}
            {item.stats && item.stats.length > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Stats:</span>
                <div className="ml-2">
                  {item.stats.map((stat, index) => (
                    <div key={index} className="text-xs">
                      {formatStatName(stat.stat)}: {stat.percentage ? `${stat.value}%` : stat.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {item.talismanSlots > 0 && (
              <div className="text-xs">
                <span className="text-gray-400">Talisman Slots:</span> {item.talismanSlots}
              </div>
            )}
            {item.uniqueEquipped && (
              <div className="text-xs text-yellow-400">Unique Equipped</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
