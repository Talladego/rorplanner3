import React, { useState, useRef, useEffect } from 'react';
import { Item, ItemSetBonusValue, ItemStat, Ability, Loadout, EquipSlot } from '../types';
import { formatItemTypeName, formatStatName, formatSlotName, formatCareerName, formatRaceName, formatStatValue, isPercentItemStat } from '../utils/formatters';
import { loadoutService } from '../services/loadoutService';

interface TooltipProps {
  children: React.ReactNode;
  item: Item | null;
  className?: string;
  isTalismanTooltip?: boolean;
  loadoutId?: string; // ensure tooltip rules are evaluated against this loadout (A/B)
  // Dual tooltip context
  side?: 'A' | 'B';
  slot?: EquipSlot;
  talismanIndex?: number;
}

export default function Tooltip({ children, item, className = '', isTalismanTooltip = false, loadoutId, side, slot, talismanIndex }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mirrorVisible, setMirrorVisible] = useState(false);
  const [mirrorPosition, setMirrorPosition] = useState({ x: 0, y: 0 });
  const [detailedItem, setDetailedItem] = useState<Item | null>(null);
  const [otherDetailedItem, setOtherDetailedItem] = useState<Item | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingOtherDetails, setIsLoadingOtherDetails] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mirrorTooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const primaryHighlightElRef = useRef<HTMLElement | null>(null);
  const mirrorHighlightElRef = useRef<HTMLElement | null>(null);

  // Resolve the loadout we should evaluate against (A/B aware)
  const getEffectiveLoadout = (): Loadout | null => {
    if (loadoutId) {
      const list = loadoutService.getAllLoadouts();
      const found = list.find((l) => l.id === loadoutId) || null;
      if (found) return found as Loadout;
    }
    return loadoutService.getCurrentLoadout();
  };

  // Helper function to check if an item is eligible based on level/renown requirements
  const isItemEligible = (item: Item | null): boolean => {
    if (!item) return true;
    const lo = getEffectiveLoadout();
    if (!lo) return true;
    const levelEligible = !item.levelRequirement || item.levelRequirement <= lo.level;
    const renownEligible = !item.renownRankRequirement || item.renownRankRequirement <= lo.renownRank;
    return levelEligible && renownEligible;
  };

  const getEquippedSetItemsCountForLoadout = (setName: string): number => {
    const lo = getEffectiveLoadout();
    if (!lo) return 0;
    let count = 0;
    Object.values(lo.items).forEach(loadoutItem => {
      const i = loadoutItem.item;
      if (i && i.itemSet && i.itemSet.name === setName) {
        const levelEligible = !i.levelRequirement || i.levelRequirement <= lo.level;
        const renownEligible = !i.renownRankRequirement || i.renownRankRequirement <= lo.renownRank;
        if (levelEligible && renownEligible) count++;
      }
    });
    return count;
  };

  // Mirror helpers bound to a specific loadout
  const getEquippedSetItemsCountForSpecificLoadout = (setName: string, lo: Loadout | null): number => {
    if (!lo) return 0;
    let count = 0;
    Object.values(lo.items).forEach(loadoutItem => {
      const i = loadoutItem.item;
      if (i && i.itemSet && i.itemSet.name === setName) {
        const levelEligible = !i.levelRequirement || i.levelRequirement <= lo.level;
        const renownEligible = !i.renownRankRequirement || i.renownRankRequirement <= lo.renownRank;
        if (levelEligible && renownEligible) count++;
      }
    });
    return count;
  };

  const isItemEligibleForLoadout = (lo: Loadout | null, it: Item | null): boolean => {
    if (!it || !lo) return true;
    const levelEligible = !it.levelRequirement || it.levelRequirement <= lo.level;
    const renownEligible = !it.renownRankRequirement || it.renownRankRequirement <= lo.renownRank;
    return levelEligible && renownEligible;
  };

  // Renderers shared by both primary and mirror tooltips
  const renderTalismanSlotsFor = (targetItem: Item | null, _eligible: boolean, lo: Loadout | null) => {
    if (!targetItem) return null;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < (targetItem.talismanSlots || 0); i++) {
      const t = targetItem.talismans?.[i] || null;
      const talismanEligible = t ? isItemEligibleForLoadout(lo, t) : true;
      nodes.push(
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="flex items-center gap-1">
            <img
              src={t?.iconUrl || 'https://armory.returnofreckoning.com/icon/1'}
              alt={t?.name || 'Empty Talisman Slot'}
              className={`w-4 h-4 object-contain rounded ${t && !talismanEligible ? 'grayscale opacity-50' : ''}`}
            />
            <span className={`text-xs ${t && !talismanEligible ? 'text-gray-500' : ''}`}>
              {t ? (
                <>
                  <span className={`${talismanEligible ? (t.itemSet ? 'item-color-set' :
                    t.rarity === 'MYTHIC' ? 'item-color-mythic' :
                    t.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
                    t.rarity === 'RARE' ? 'item-color-rare' :
                    t.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
                    t.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : ''}`}>{t.name}</span>
                  {t.stats && t.stats.length > 0 && (
                    <span className={`text-gray-400 ${!talismanEligible ? 'text-gray-600' : ''}`}>
                      {' ('}
                      {t.stats.map((stat: ItemStat, idx: number) => (
                        <span key={idx}>
                          {formatStatValue(stat.value, isPercentItemStat(stat.stat, stat.percentage))} {formatStatName(stat.stat)}
                          {idx < t.stats.length - 1 && <span className="mx-1">/</span>}
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
    return nodes;
  };

  const renderTooltipContent = (targetItem: Item, eligible: boolean, equippedCountGetter: (setName: string) => number, lo: Loadout | null) => (
    <>
      {/* 1. Item Name */}
      <div className="mb-1">
        <p 
          className={`equipment-item-name ${!eligible ? 'text-gray-500' : ''} ${eligible ? (targetItem.itemSet ? 'item-color-set' :
            targetItem.rarity === 'MYTHIC' ? 'item-color-mythic' :
            targetItem.rarity === 'VERY_RARE' ? 'item-color-very-rare' :
            targetItem.rarity === 'RARE' ? 'item-color-rare' :
            targetItem.rarity === 'UNCOMMON' ? 'item-color-uncommon' :
            targetItem.rarity === 'UTILITY' ? 'item-color-utility' : 'item-color-common') : ''}`}
        >
          {targetItem.name}
        </p>
      </div>

      {/* 2. Item Description */}
      {targetItem.description && (
        <div className="mb-2">
          <p className="text-xs text-gray-400 italic leading-tight">{targetItem.description}</p>
        </div>
      )}

      {/* 3. Item Info (slot, type, iLvl) */}
      <div className="mb-2">
        <div className={`text-xs space-y-0.5 ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
          <div>Slot: {formatSlotName(targetItem.slot)}</div>
          <div>Type: {formatItemTypeName(targetItem.type)}</div>
          {targetItem.itemLevel > 0 && <div>Item Level: {targetItem.itemLevel}</div>}
          {targetItem.uniqueEquipped && <div>Unique-Equipped</div>}
        </div>
      </div>

      {/* 4. Item Stats (armor, dps, speed, stats) */}
      <div className="mb-2">
        <div className={`text-xs space-y-0.5 ${eligible ? 'text-yellow-400' : 'text-gray-500'}`}>
          {targetItem.armor > 0 && <div>{targetItem.armor} Armor</div>}
          {targetItem.dps > 0 && <div>{(targetItem.dps / 10).toFixed(1)} DPS</div>}
          {targetItem.speed > 0 && <div>{(targetItem.speed / 100).toFixed(1)} Speed</div>}
          {targetItem.stats && targetItem.stats.length > 0 && targetItem.stats.map((stat: ItemStat, idx: number) => (
            <div key={idx}>
              {formatStatValue(stat.value, isPercentItemStat(stat.stat, stat.percentage))} {formatStatName(stat.stat)}
            </div>
          ))}
        </div>
      </div>

      {/* 4.5. Item Abilities and Buffs */}
      {(targetItem.abilities && targetItem.abilities.length > 0) || (targetItem.buffs && targetItem.buffs.length > 0) ? (
        <div className="mb-2">
          <div className={`text-xs space-y-0.5 ${eligible ? 'text-green-400' : 'text-gray-500'}`}>
            {targetItem.abilities && targetItem.abilities.length > 0 && targetItem.abilities.map((ability, idx: number) => (
              <div key={`ability-${idx}`}>
                <div className={`text-xs italic ${eligible ? 'text-green-400' : 'text-gray-500'}`}>+ {ability.description || ability.name}</div>
              </div>
            ))}
            {targetItem.buffs && targetItem.buffs.length > 0 && targetItem.buffs.map((buff, idx: number) => (
              <div key={`buff-${idx}`}>
                <div className={`text-xs italic ${eligible ? 'text-green-400' : 'text-gray-500'}`}>+ {buff.description || buff.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. Item Talismans */}
      {!isTalismanTooltip && targetItem.talismanSlots > 0 && (
        <div className="mb-2">
          <div className={`text-xs ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
            {renderTalismanSlotsFor(targetItem, eligible, lo)}
          </div>
        </div>
      )}

      {/* 6. Item Set and Set Bonuses */}
      {targetItem.itemSet && (
        <div className="mb-2">
          <div className={`text-xs ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
            <div className={`font-medium mb-1 ${eligible ? 'text-green-400' : 'text-gray-500'}`}>{targetItem.itemSet.name}</div>
            {targetItem.itemSet.bonuses && targetItem.itemSet.bonuses.length > 0 ? (
              <div className="space-y-0.5">
                {targetItem.itemSet.bonuses.map((bonus, idx: number) => {
                  const equippedCount = equippedCountGetter(targetItem.itemSet!.name);
                  const isActive = equippedCount >= bonus.itemsRequired;
                  const formatBonusValue = (bonusValue: ItemSetBonusValue): React.JSX.Element => {
                    if (!bonusValue) return <span>No bonus data</span>;
                    if ('stat' in bonusValue) {
                      const itemStat = bonusValue as ItemStat;
                      const statName = formatStatName(itemStat.stat);
                      return <span>{formatStatValue(itemStat.value, isPercentItemStat(itemStat.stat, itemStat.percentage))} {statName}</span>;
                    } else if ('name' in bonusValue || 'description' in bonusValue) {
                      const ability = bonusValue as Ability;
                      return <span className="text-xs italic">+ {ability.description || ability.name}</span>;
                    } else {
                      return <span>Unknown bonus type</span>;
                    }
                  };
                  return (
                    <div key={idx} className={isActive && eligible ? 'text-green-400' : 'text-gray-500'}>
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

      {/* 7. Requirements */}
      <div>
        <div className={`text-xs space-y-1 ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
          {targetItem.levelRequirement > 0 && <div>Minimum Rank: {targetItem.levelRequirement}</div>}
          {targetItem.renownRankRequirement > 0 && <div>Requires {targetItem.renownRankRequirement} Renown</div>}
          {targetItem.careerRestriction && targetItem.careerRestriction.length > 0 && (
            <div>Career: {targetItem.careerRestriction.map(career => formatCareerName(career)).join(', ')}</div>
          )}
          {targetItem.raceRestriction && targetItem.raceRestriction.length > 0 && (
            <div>Race: {targetItem.raceRestriction.map(race => formatRaceName(race)).join(', ')}</div>
          )}
        </div>
      </div>
    </>
  );

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

    // Always brighten primary trigger when hovered
    if (triggerRef.current) {
      triggerRef.current.classList.add('hover-bright');
      primaryHighlightElRef.current = triggerRef.current;
      if (typeof talismanIndex === 'number') {
        const talismanContainer = triggerRef.current.closest('[data-talisman-index]') as HTMLElement | null;
        if (talismanContainer) {
          talismanContainer.classList.add('hover-bright');
        }
      }
    }

    // Compute and show mirror tooltip over opposite side's corresponding slot/talisman (if available)
    try {
      if (side && slot) {
        const otherSide = side === 'A' ? 'B' : 'A';
        // Use the exact same anchor element type by querying the Tooltip trigger wrapper via data-anchor-key
        const otherAnchorKey = `${otherSide}:${slot}${typeof talismanIndex === 'number' ? `:t${talismanIndex}` : ''}`;
        const targetEl = document.querySelector(`[data-anchor-key="${otherAnchorKey}"]`) as HTMLElement | null;
        const otherLo = loadoutService.getLoadoutForSide(otherSide);
        let otherItem: Item | null = null;
        if (otherLo) {
          const data = otherLo.items[slot as EquipSlot];
          otherItem = typeof talismanIndex === 'number' ? (data?.talismans?.[talismanIndex] || null) : (data?.item || null);
        }
        // Brighten mirror trigger if present (even if no item for mirror tooltip)
        if (targetEl) {
          targetEl.classList.add('hover-bright');
          mirrorHighlightElRef.current = targetEl;
          if (typeof talismanIndex === 'number') {
            const mirrorTalismanContainer = targetEl.closest('[data-talisman-index]') as HTMLElement | null;
            if (mirrorTalismanContainer) {
              mirrorTalismanContainer.classList.add('hover-bright');
            }
          }
        }

        if (targetEl && otherItem) {
          const tRect = targetEl.getBoundingClientRect();
          const margin2 = 10;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const estW = 320;
          const estH = 200;
          let mx = tRect.right + margin2;
          let my = tRect.top;
          if (mx + estW > vw) mx = tRect.left - estW - margin2;
          if (my + estH > vh) my = vh - estH - margin2;
          if (mx < margin2) mx = margin2;
          if (my < margin2) my = margin2;
          setMirrorPosition({ x: mx, y: my });
          setMirrorVisible(true);

          // mirror highlight already applied above if targetEl exists

          // After mirror tooltip is rendered, fine-tune position with actual dimensions
          setTimeout(() => {
            if (!mirrorTooltipRef.current) return;
            const tipRect = mirrorTooltipRef.current.getBoundingClientRect();
            const m = 10;
            let nx = tRect.right + m;
            let ny = tRect.top;
            if (nx + tipRect.width > window.innerWidth) {
              nx = tRect.left - tipRect.width - m;
            }
            if (ny + tipRect.height > window.innerHeight) {
              ny = window.innerHeight - tipRect.height - m;
            }
            if (nx < m) nx = m;
            if (ny < m) ny = m;
            setMirrorPosition({ x: nx, y: ny });
          }, 10);

          // Fetch other item details if needed
          const needsOtherDetails = !otherItem.abilities?.some(a => a.description) || !otherItem.buffs?.some(b => b.description);
          const hasOtherDetails = otherDetailedItem && otherDetailedItem.id === otherItem.id;
          if (needsOtherDetails && !hasOtherDetails && !isLoadingOtherDetails) {
            setIsLoadingOtherDetails(true);
            loadoutService.getItemWithDetails(otherItem.id)
              .then(full => setOtherDetailedItem(full))
              .catch(err => console.error('Failed to fetch other item details for mirror tooltip:', err))
              .finally(() => setIsLoadingOtherDetails(false));
          }
        } else {
          setMirrorVisible(false);
        }
      } else {
        setMirrorVisible(false);
      }
    } catch {
      setMirrorVisible(false);
    }

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
    setMirrorVisible(false);
    // Remove highlight classes if applied
    if (primaryHighlightElRef.current) {
      primaryHighlightElRef.current.classList.remove('hover-bright');
      const talismanContainer = primaryHighlightElRef.current.closest('[data-talisman-index]') as HTMLElement | null;
      if (talismanContainer) talismanContainer.classList.remove('hover-bright');
      primaryHighlightElRef.current = null;
    }
    if (mirrorHighlightElRef.current) {
      mirrorHighlightElRef.current.classList.remove('hover-bright');
      const mirrorTalismanContainer = mirrorHighlightElRef.current.closest('[data-talisman-index]') as HTMLElement | null;
      if (mirrorTalismanContainer) mirrorTalismanContainer.classList.remove('hover-bright');
      mirrorHighlightElRef.current = null;
    }
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

  // no-op: removed local talisman renderer in favor of shared renderers

  if (!item) {
    return <div className={className}>{children}</div>;
  }

  // Use detailed item data if available, otherwise use the provided item
  // Merge detailed item data with original item to preserve talismans
  const displayItem = detailedItem ? { ...item, ...detailedItem } : item;
  // Resolve opposite side item (for mirror tooltip)
  const otherItemBase = (() => {
    if (!side || !slot) return null;
    const otherSide = side === 'A' ? 'B' : 'A';
    const otherLo = loadoutService.getLoadoutForSide(otherSide);
    if (!otherLo) return null;
    const data = otherLo.items[slot as EquipSlot];
    const oi = typeof talismanIndex === 'number' ? (data?.talismans?.[talismanIndex] || null) : (data?.item || null);
    return oi;
  })();
  const otherDisplayItem = otherDetailedItem && otherItemBase && otherDetailedItem.id === otherItemBase.id
    ? { ...otherItemBase, ...otherDetailedItem }
    : otherItemBase;
  const otherEligible = isItemEligible(otherDisplayItem);
  const itemEligible = isItemEligible(displayItem);

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        data-anchor-key={side && slot ? `${side}:${slot}${typeof talismanIndex === 'number' ? `:t${talismanIndex}` : ''}` : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-2 max-w-xs pointer-events-none ${!itemEligible ? 'opacity-75' : ''}`}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {displayItem && renderTooltipContent(displayItem, itemEligible, getEquippedSetItemsCountForLoadout, getEffectiveLoadout())}
        </div>
      )}

      {/* Mirror tooltip over opposite side slot/talisman */}
      {isVisible && mirrorVisible && otherDisplayItem && (
        <div
          ref={mirrorTooltipRef}
          className={`fixed z-40 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-2 max-w-xs pointer-events-none ${!otherEligible ? 'opacity-75' : ''}`}
          style={{ left: mirrorPosition.x, top: mirrorPosition.y }}
        >
          {renderTooltipContent(otherDisplayItem, otherEligible, (setName: string) => {
            const otherLoCtx = side ? loadoutService.getLoadoutForSide(side === 'A' ? 'B' : 'A') : null;
            return getEquippedSetItemsCountForSpecificLoadout(setName, otherLoCtx);
          }, side ? loadoutService.getLoadoutForSide(side === 'A' ? 'B' : 'A') : null)}
        </div>
      )}
    </>
  );
}
