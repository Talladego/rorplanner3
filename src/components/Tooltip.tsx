import React, { useState, useRef, useEffect } from 'react';
import { Item, ItemSetBonusValue, ItemStat, Ability } from '../types';
import { getItemColor } from '../utils/rarityColors';
import { formatItemTypeName, formatStatName, formatSlotName, formatCareerName, formatToTitleCase } from '../utils/formatters';

interface TooltipProps {
  children: React.ReactNode;
  item: Item | null;
  className?: string;
  isTalismanTooltip?: boolean;
}

export default function Tooltip({ children, item, className = '', isTalismanTooltip = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!item) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position immediately without showing tooltip first
    // Use estimated tooltip size for initial positioning
    const estimatedTooltipWidth = 320;
    const estimatedTooltipHeight = 200;

    // Preferred anchoring: right side of element, aligned with top
    let x = rect.right + margin;
    let y = rect.top;

    // Check if positioned tooltip would go off-screen horizontally
    if (x + estimatedTooltipWidth > viewportWidth) {
      // Try positioning to the left instead
      x = rect.left - estimatedTooltipWidth - margin;
    }

    // Check if positioned tooltip would go off-screen vertically
    if (y + estimatedTooltipHeight > viewportHeight) {
      // Move up to fit within viewport
      y = viewportHeight - estimatedTooltipHeight - margin;
    }

    // Ensure tooltip doesn't go above the viewport
    if (y < 0) {
      y = margin;
    }

    // Final horizontal boundary check
    if (x < 0) {
      x = margin;
    } else if (x + estimatedTooltipWidth > viewportWidth) {
      x = viewportWidth - estimatedTooltipWidth - margin;
    }

    // Set position and show tooltip
    setPosition({ x, y });
    setIsVisible(true);

    // After tooltip is rendered, fine-tune position with actual dimensions
    setTimeout(() => {
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const actualTooltipWidth = tooltipRect.width;
        const actualTooltipHeight = tooltipRect.height;

        // Only adjust if there's a significant difference in dimensions
        const widthDiff = Math.abs(actualTooltipWidth - estimatedTooltipWidth);
        const heightDiff = Math.abs(actualTooltipHeight - estimatedTooltipHeight);

        if (widthDiff > 20 || heightDiff > 20) {
          // Recalculate with actual dimensions
          let newX = rect.right + margin;
          let newY = rect.top;

          // Check if positioned tooltip would go off-screen horizontally
          if (newX + actualTooltipWidth > viewportWidth) {
            newX = rect.left - actualTooltipWidth - margin;
          }

          // Check if positioned tooltip would go off-screen vertically
          if (newY + actualTooltipHeight > viewportHeight) {
            newY = viewportHeight - actualTooltipHeight - margin;
          }

          // Boundary checks
          if (newY < 0) {
            newY = margin;
          }
          if (newX < 0) {
            newX = margin;
          } else if (newX + actualTooltipWidth > viewportWidth) {
            newX = viewportWidth - actualTooltipWidth - margin;
          }

          setPosition({ x: newX, y: newY });
        }
      }
    }, 10);
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

  // Helper for rendering talisman slots
  const renderTalismanSlots = () => {
    const slots = [];
    for (let i = 0; i < item.talismanSlots; i++) {
      const talisman = item.talismans?.[i];
      slots.push(
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1">
            <img
              src={talisman?.iconUrl || 'https://armory.returnofreckoning.com/icon/1'}
              alt={talisman?.name || 'Empty Talisman Slot'}
              className="w-4 h-4 object-contain rounded"
            />
            <span className="text-xs">
              {talisman ? (
                <>
                  {talisman.stats && talisman.stats.length > 0 ? (
                    talisman.stats.map((stat: ItemStat, idx: number) => (
                      <span key={idx}>
                        +{stat.value} {formatStatName(stat.stat)}{stat.percentage ? '%' : ''}
                        {idx < talisman.stats.length - 1 && <span className="text-gray-400 mx-1">/</span>}
                      </span>
                    ))
                  ) : (
                    talisman.name
                  )}
                </>
              ) : (
                <>Empty Talisman Slot</>
              )}
            </span>
          </div>
        </div>
      );
    }
    return slots;
  };

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
          {/* 1. Item Name */}
          <div className="mb-2">
            <h3 className="font-bold text-base" style={{ color: getItemColor(item) }}>{item.name}</h3>
          </div>

          {/* 2. Item Description */}
          {item.description && (
            <div className="mb-3">
              <p className="text-xs text-gray-200 leading-tight">{item.description}</p>
            </div>
          )}

          {/* 3. Item Info (slot, type, iLvl) */}
          <div className="mb-3">
            <div className="text-xs text-gray-200 space-y-1">
              <div>Slot: {formatSlotName(item.slot)}</div>
              <div>Type: {formatItemTypeName(item.type)}</div>
              {item.itemLevel > 0 && <div>Item Level: {item.itemLevel}</div>}
              {item.uniqueEquipped && <div className="text-yellow-400">Unique-Equipped</div>}
            </div>
          </div>

          {/* 4. Item Stats (armor, dps, speed, stats) */}
          <div className="mb-3">
            <div className="text-xs text-gray-200 space-y-1">
              {item.armor > 0 && <div>{item.armor} Armor</div>}
              {item.dps > 0 && <div>{(item.dps / 10).toFixed(1)} DPS</div>}
              {item.speed > 0 && <div>{(item.speed / 100).toFixed(1)} Speed</div>}
              {item.stats && item.stats.length > 0 && item.stats.map((stat: ItemStat, idx: number) => (
                <div key={idx}>
                  {stat.value > 0 ? '+' : ''}{stat.value} {formatStatName(stat.stat)}{stat.percentage ? '%' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Item Talismans */}
          {!isTalismanTooltip && item.talismanSlots > 0 && item.talismans && item.talismans.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-200">
                {renderTalismanSlots()}
              </div>
            </div>
          )}

          {/* 6. Item Set and Set Bonuses */}
          {item.itemSet && (
            <div className="mb-3">
              <div className="text-xs text-gray-200">
                <div className="font-medium text-yellow-400 mb-2">{item.itemSet.name}</div>
                {/* Render set bonuses with piece counts */}
                {item.itemSet.bonuses && item.itemSet.bonuses.length > 0 ? (
                  <div className="space-y-1">
                    {item.itemSet.bonuses.map((bonus, idx: number) => {
                      const formatBonusValue = (bonusValue: ItemSetBonusValue): string => {
                        if (!bonusValue) return 'No bonus data';

                        if ('stat' in bonusValue) {
                          // It's an ItemStat
                          const itemStat = bonusValue as ItemStat;
                          const statName = formatStatName(itemStat.stat);
                          const value = itemStat.value;
                          const isPercentage = itemStat.percentage;
                          return `+ ${value}${isPercentage ? '%' : ''} ${statName}`;
                        } else if ('name' in bonusValue || 'description' in bonusValue) {
                          // It's an Ability
                          const ability = bonusValue as Ability;
                          return ability.name || ability.description || 'Unknown Ability';
                        } else {
                          return 'Unknown bonus type';
                        }
                      };

                      return (
                        <div key={idx} className="text-green-400">
                          ({bonus.itemsRequired} piece bonus:) {formatBonusValue(bonus.bonus)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500">No bonuses available</div>
                )}
              </div>
            </div>
          )}

          {/* 7. Item Requirements (levelReq, renownReq, careerReq, raceReq) */}
          <div>
            <div className="text-xs text-gray-200 space-y-1">
              {item.levelRequirement > 0 && <div>Minimum Rank: {item.levelRequirement}</div>}
              {item.renownRankRequirement > 0 && <div>Requires {item.renownRankRequirement} Renown</div>}
              {item.careerRestriction && item.careerRestriction.length > 0 && (
                <div>Career: {item.careerRestriction.map(career => formatCareerName(career)).join(', ')}</div>
              )}
              {item.raceRestriction && item.raceRestriction.length > 0 && (
                <div>Race: {item.raceRestriction.map(race => formatToTitleCase(race)).join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
