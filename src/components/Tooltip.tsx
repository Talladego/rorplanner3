import React, { useState, useRef, useEffect } from 'react';
import { Item, ItemSetBonusValue, ItemStat, Ability } from '../types';
import { getItemColor } from '../utils/rarityColors';
import { formatItemTypeName, formatStatName, formatSlotName, formatCareerName, formatRaceName } from '../utils/formatters';
import { loadoutService } from '../services/loadoutService';

interface TooltipProps {
  children: React.ReactNode;
  item: Item | null;
  className?: string;
  isTalismanTooltip?: boolean;
}

export default function Tooltip({ children, item, className = '', isTalismanTooltip = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [detailedItem, setDetailedItem] = useState<Item | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!item) return;

    // Check if we need to fetch detailed item data
    const needsDetails = !item.abilities?.some(a => a.description) || !item.buffs?.some(b => b.description);
    const hasCorrectDetails = detailedItem && detailedItem.id === item.id;
    
    if (needsDetails && !hasCorrectDetails && !isLoadingDetails) {
      setIsLoadingDetails(true);
      // Fetch detailed data asynchronously without blocking tooltip display
      loadoutService.getItemWithDetails(item.id)
        .then(fullItem => {
          setDetailedItem(fullItem);
        })
        .catch(error => {
          console.error('Failed to fetch item details for tooltip:', error);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }

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
    if (!displayItem) return null;
    
    const slots = [];
    for (let i = 0; i < displayItem.talismanSlots; i++) {
      const talisman = displayItem.talismans?.[i];
      slots.push(
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="flex items-center gap-1">
            <img
              src={talisman?.iconUrl || 'https://armory.returnofreckoning.com/icon/1'}
              alt={talisman?.name || 'Empty Talisman Slot'}
              className="w-4 h-4 object-contain rounded"
            />
            <span className="text-xs">
              {talisman ? (
                <>
                  <span style={{ color: getItemColor(talisman) }}>{talisman.name}</span>
                  {talisman.stats && talisman.stats.length > 0 && (
                    <span className="text-gray-400">
                      {' ('}
                      {talisman.stats.map((stat: ItemStat, idx: number) => (
                        <span key={idx}>
                          +{stat.value} {formatStatName(stat.stat)}{stat.percentage ? '%' : ''}
                          {idx < talisman.stats.length - 1 && <span className="mx-1">/</span>}
                        </span>
                      ))}
                      {')'}
                    </span>
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

  // Use detailed item data if available, otherwise use the provided item
  // Merge detailed item data with original item to preserve talismans
  const displayItem = detailedItem ? { ...item, ...detailedItem } : item;

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
          className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-2 max-w-xs pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {/* 1. Item Name */}
          <div className="mb-1">
            <p className="equipment-item-name" style={{ color: getItemColor(displayItem) }}>{displayItem.name}</p>
          </div>

          {/* 2. Item Description */}
          {displayItem.description && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 italic leading-tight">{displayItem.description}</p>
            </div>
          )}

          {/* 3. Item Info (slot, type, iLvl) */}
          <div className="mb-2">
            <div className="text-xs text-gray-200 space-y-0.5">
              <div>Slot: {formatSlotName(displayItem.slot)}</div>
              <div>Type: {formatItemTypeName(displayItem.type)}</div>
              {displayItem.itemLevel > 0 && <div>Item Level: {displayItem.itemLevel}</div>}
              {displayItem.uniqueEquipped && <div>Unique-Equipped</div>}
            </div>
          </div>

          {/* 4. Item Stats (armor, dps, speed, stats) */}
          <div className="mb-2">
            <div className="text-xs text-yellow-400 space-y-0.5">
              {displayItem.armor > 0 && <div>{displayItem.armor} Armor</div>}
              {displayItem.dps > 0 && <div>{(displayItem.dps / 10).toFixed(1)} DPS</div>}
              {displayItem.speed > 0 && <div>{(displayItem.speed / 100).toFixed(1)} Speed</div>}
              {displayItem.stats && displayItem.stats.length > 0 && displayItem.stats.map((stat: ItemStat, idx: number) => (
                <div key={idx}>
                  {stat.value > 0 ? '+' : ''}{stat.value} {formatStatName(stat.stat)}{stat.percentage ? '%' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* 4.5. Item Abilities and Buffs */}
          {(displayItem.abilities && displayItem.abilities.length > 0) || (displayItem.buffs && displayItem.buffs.length > 0) ? (
            <div className="mb-2">
              <div className="text-xs text-green-400 space-y-0.5">
                {displayItem.abilities && displayItem.abilities.length > 0 && displayItem.abilities.map((ability, idx: number) => (
                  <div key={`ability-${idx}`}>
                    <div className="text-green-400 text-xs italic">+ {ability.description || ability.name}</div>
                  </div>
                ))}
                {displayItem.buffs && displayItem.buffs.length > 0 && displayItem.buffs.map((buff, idx: number) => (
                  <div key={`buff-${idx}`}>
                    <div className="text-green-400 text-xs italic">+ {buff.description || buff.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 5. Item Talismans */}
          {!isTalismanTooltip && displayItem.talismanSlots > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-200">
                {renderTalismanSlots()}
              </div>
            </div>
          )}

          {/* 6. Item Set and Set Bonuses */}
          {displayItem.itemSet && (
            <div className="mb-2">
              <div className="text-xs text-gray-200">
                <div className="font-medium text-green-400 mb-1">{displayItem.itemSet.name}</div>
                {/* Render set bonuses with piece counts */}
                {displayItem.itemSet.bonuses && displayItem.itemSet.bonuses.length > 0 ? (
                  <div className="space-y-0.5">
                    {displayItem.itemSet.bonuses.map((bonus, idx: number) => {
                      const equippedCount = loadoutService.getEquippedSetItemsCount(displayItem.itemSet!.name);
                      const isActive = equippedCount >= bonus.itemsRequired;
                      
                      const formatBonusValue = (bonusValue: ItemSetBonusValue): React.JSX.Element => {
                        if (!bonusValue) return <span>No bonus data</span>;

                        if ('stat' in bonusValue) {
                          // It's an ItemStat
                          const itemStat = bonusValue as ItemStat;
                          const statName = formatStatName(itemStat.stat);
                          const value = itemStat.value;
                          const isPercentage = itemStat.percentage;
                          return <span>+ {value}{isPercentage ? '%' : ''} {statName}</span>;
                        } else if ('name' in bonusValue || 'description' in bonusValue) {
                          // It's an Ability
                          const ability = bonusValue as Ability;
                          return (
                            <span className="text-xs italic">
                              + {ability.description || ability.name}
                            </span>
                          );
                        } else {
                          return <span>Unknown bonus type</span>;
                        }
                      };

                      return (
                        <div key={idx} className={isActive ? "text-green-400" : "text-gray-500"}>
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
              {displayItem.levelRequirement > 0 && <div>Minimum Rank: {displayItem.levelRequirement}</div>}
              {displayItem.renownRankRequirement > 0 && <div>Requires {displayItem.renownRankRequirement} Renown</div>}
              {displayItem.careerRestriction && displayItem.careerRestriction.length > 0 && (
                <div>Career: {displayItem.careerRestriction.map(career => formatCareerName(career)).join(', ')}</div>
              )}
              {displayItem.raceRestriction && displayItem.raceRestriction.length > 0 && (
                <div>Race: {displayItem.raceRestriction.map(race => formatRaceName(race)).join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
