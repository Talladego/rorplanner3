import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Item, Loadout, EquipSlot } from '../../types';
import { formatItemTypeName, formatSlotName } from '../../utils/formatters';
import { loadoutService } from '../../services/loadout/loadoutService';
import { useScale } from '../layout/ScaleContext';
import ItemNameText from './ItemNameText';
import RequirementsBlock from './RequirementsBlock';
import StatLines from './StatLines';
import AbilitiesBuffsBlock from './AbilitiesBuffsBlock';
import TalismanSlotsBlock from './TalismanSlotsBlock';
import SetBonusesBlock from './SetBonusesBlock';

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
  const uiScale = useScale();
  // Use a fixed width so item tooltips are consistently sized
  const TOOLTIP_WIDTH = 320;
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

  // Presentational blocks moved to separate components

  const renderTooltipContent = (targetItem: Item, eligible: boolean, equippedCountGetter: (setName: string) => number, lo: Loadout | null) => (
    <>
      {/* 1. Item Name */}
  <div className="mb-1"><ItemNameText item={targetItem} /></div>

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
      <div className="mb-2"><StatLines item={targetItem} eligible={eligible} /></div>

      {/* 4.5. Item Abilities and Buffs */}
      <AbilitiesBuffsBlock item={targetItem} eligible={eligible} />

      {/* 5. Item Talismans */}
      {!isTalismanTooltip && (
        <TalismanSlotsBlock item={targetItem} eligible={eligible} loadout={lo} isItemEligibleForLoadout={isItemEligibleForLoadout} />
      )}

      {/* 6. Item Set and Set Bonuses */}
      <SetBonusesBlock item={targetItem} eligible={eligible} getEquippedCount={equippedCountGetter} />

      {/* 7. Requirements */}
  <div><RequirementsBlock item={targetItem} eligible={eligible} /></div>
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
  // Use fixed tooltip size for initial positioning (matches rendered width)
  const estimatedTooltipWidth = TOOLTIP_WIDTH;
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

  // Reflow tooltip positions on scroll/resize while visible to keep anchors accurate under transforms
  useEffect(() => {
    if (!isVisible) return;
    const updatePositions = () => {
      try {
        if (triggerRef.current && tooltipRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const tipRect = tooltipRef.current.getBoundingClientRect();
          const m = 10;
          let x = rect.right + m;
          let y = rect.top;
          if (x + tipRect.width > window.innerWidth) x = rect.left - tipRect.width - m;
          if (y + tipRect.height > window.innerHeight) y = window.innerHeight - tipRect.height - m;
          if (x < m) x = m;
          if (y < m) y = m;
          setPosition({ x, y });
        }
        if (mirrorVisible && mirrorTooltipRef.current && side && slot) {
          const otherSide = side === 'A' ? 'B' : 'A';
          const otherAnchorKey = `${otherSide}:${slot}${typeof talismanIndex === 'number' ? `:t${talismanIndex}` : ''}`;
          const targetEl = document.querySelector(`[data-anchor-key="${otherAnchorKey}"]`) as HTMLElement | null;
          if (targetEl) {
            const tRect = targetEl.getBoundingClientRect();
            const mtRect = mirrorTooltipRef.current.getBoundingClientRect();
            const m2 = 10;
            let mx = tRect.right + m2;
            let my = tRect.top;
            if (mx + mtRect.width > window.innerWidth) mx = tRect.left - mtRect.width - m2;
            if (my + mtRect.height > window.innerHeight) my = window.innerHeight - mtRect.height - m2;
            if (mx < m2) mx = m2;
            if (my < m2) my = m2;
            setMirrorPosition({ x: mx, y: my });
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    updatePositions();
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isVisible, mirrorVisible, side, slot, talismanIndex]);

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
    const oi = typeof talismanIndex === 'number'
      ? (data?.talismans?.[talismanIndex] || null)
      // For main item mirror tooltip, attach the slotted talismans so they render
      : (data?.item ? ({ ...data.item, talismans: data?.talismans }) : null);
    return oi;
  })();
  const otherDisplayItem = otherDetailedItem && otherItemBase && otherDetailedItem.id === otherItemBase.id
    ? { ...otherItemBase, ...otherDetailedItem }
    : otherItemBase;
  const otherLoadoutCtx = side ? loadoutService.getLoadoutForSide(side === 'A' ? 'B' : 'A') : null;
  const otherEligible = isItemEligibleForLoadout(otherLoadoutCtx, otherDisplayItem);
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

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-[11000] bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-2 pointer-events-none ${!itemEligible ? 'grayscale' : ''}`}
          style={{ left: position.x, top: position.y, width: TOOLTIP_WIDTH, maxWidth: TOOLTIP_WIDTH, transform: `scale(${uiScale})`, transformOrigin: 'top left' }}
        >
          {displayItem && renderTooltipContent(displayItem, itemEligible, getEquippedSetItemsCountForLoadout, getEffectiveLoadout())}
        </div>,
        document.body
      )}

      {/* Mirror tooltip over opposite side slot/talisman */}
      {isVisible && mirrorVisible && otherDisplayItem && createPortal(
        <div
          ref={mirrorTooltipRef}
          className={`fixed z-[10990] bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-2 pointer-events-none ${!otherEligible ? 'grayscale' : ''}`}
          style={{ left: mirrorPosition.x, top: mirrorPosition.y, width: TOOLTIP_WIDTH, maxWidth: TOOLTIP_WIDTH, transform: `scale(${uiScale})`, transformOrigin: 'top left' }}
        >
          {renderTooltipContent(otherDisplayItem, otherEligible, (setName: string) => {
            const otherLoCtx = side ? loadoutService.getLoadoutForSide(side === 'A' ? 'B' : 'A') : null;
            return getEquippedSetItemsCountForSpecificLoadout(setName, otherLoCtx);
          }, side ? loadoutService.getLoadoutForSide(side === 'A' ? 'B' : 'A') : null)}
        </div>,
        document.body
      )}
    </>
  );
}
