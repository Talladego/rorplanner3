import { memo, useMemo } from 'react';
import { loadoutService } from '../../services/loadout/loadoutService';
import { RENOWN_ABILITIES, DEFAULT_COST_TOTALS } from '../../services/loadout/renownConfig';
import { useLoadoutById } from '../../hooks/useLoadoutById';
import { ItemRarity } from '../../types';
import { getRarityColor } from '../../utils/rarityColors';
import HoverTooltip from '../tooltip/HoverTooltip';

const ABILITIES = RENOWN_ABILITIES;

const LEVEL_TOTALS = [0, 4, 16, 38, 72, 120];
const roman = ['', 'I', 'II', 'III', 'IV', 'V']; // map: 0->'', 1->I, 2->II, 3->III, 4->IV, 5->V

function LevelSelect({ value, onChange, maxLevel, statName, percent, totalsOverride, visibleMaxLevel = 5 }: { value: number; onChange: (v: number) => void; maxLevel: number; statName: string; percent?: boolean; totalsOverride?: number[]; visibleMaxLevel?: number }) {
  return (
    <select
      className="form-input form-input-text text-xs py-0.5 px-1 rounded w-28"
      value={value}
      onChange={(e) => onChange(Number(e.currentTarget.value))}
    >
      {Array.from({ length: visibleMaxLevel + 1 }, (_, i) => i).map((lvl) => {
        const table = totalsOverride && totalsOverride.length ? totalsOverride : LEVEL_TOTALS;
        const total = table[Math.max(0, Math.min(5, lvl))];
        // Drop roman numerals in dropdown; keep concise value text
        const sign = total > 0 ? '+' : '';
        const label = lvl === 0 ? 'None' : `${sign}${total}${percent ? '%' : ''} ${statName}`;
        return (
          <option key={lvl} value={lvl} disabled={lvl > maxLevel}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

// RenownPanel renders either:
// - embedded mode: just the content (Tier 2/3 owned by parent layout)
// - standalone: its own Tier 1 panel (not used in DualEquipmentLayout)
export default memo(function RenownPanel({ loadoutId, embedded = false }: { loadoutId: string | null; embedded?: boolean }) {
  const { loadout } = useLoadoutById(loadoutId);
  const ra = loadout?.renownAbilities || {};
  const cr = loadout?.level || 0; // Career Rank
  const spent = useMemo(() => {
    const ra = (loadout?.renownAbilities || {}) as NonNullable<typeof loadout>['renownAbilities'];
    let sum = 0;
    ABILITIES.forEach((ab) => {
      const lvl = Math.max(0, Math.min(5, Math.trunc((ra as Record<string, number>)[ab.key] || 0)));
      const table = ab.costTotals && ab.costTotals.length ? ab.costTotals : DEFAULT_COST_TOTALS;
      sum += table[Math.max(0, Math.min(table.length - 1, lvl))] || 0;
    });
    return sum;
  }, [loadout]);
  // Centralized rule: use service to determine renown spend cap
  const cap = loadoutService.getRenownSpendCap(loadoutId || undefined);
  const remaining = Math.max(0, cap - spent);

  const renderAbilityTooltip = (ab: (typeof ABILITIES)[number], level: number) => {
    const totals = (ab.customTotals && ab.customTotals.length ? ab.customTotals : LEVEL_TOTALS);
    const lvl = Math.max(0, Math.min(5, Math.trunc(level)));
    let total = totals[Math.max(0, Math.min(5, lvl))] ?? 0;
    // Regeneration should match compare stats panel: display as Hit Points Every 4 Seconds
    const isRegen = ab.key === 'regeneration';
    if (isRegen) total = total * 4;
    const unit = ab.percent ? '%' : '';
    const titleColor = (lvl: number) => {
      const rarityLevels: ItemRarity[] = [ItemRarity.UTILITY, ItemRarity.COMMON, ItemRarity.UNCOMMON, ItemRarity.RARE, ItemRarity.VERY_RARE, ItemRarity.MYTHIC];
      const rarity = rarityLevels[Math.max(0, Math.min(5, lvl))] || ItemRarity.UTILITY;
      return getRarityColor(rarity);
    };
    const lines: string[] = (() => {
      if (lvl === 0) {
        // Base line without numbers
        switch (ab.key) {
          case 'deftDefender': return ['Increases Dodge and Disrupt'];
          case 'hardyConcession': return ['Reduces Incoming Damage', 'Reduces Outgoing Damage', 'Reduces Outgoing Healing'];
          case 'futileStrikes': return ['Reduces chance to be critically hit'];
          case 'trivialBlows': return ['Reduces Critical Damage Taken'];
          default: {
            if (isRegen) return ['Increases Hit Points Every 4 Seconds'];
            return [`Increases ${ab.stat}`];
          }
        }
      }
      // Level-specific with numbers
      switch (ab.key) {
        case 'deftDefender':
          return [`Increases Dodge by ${Math.abs(total)}${unit}`, `Increases Disrupt by ${Math.abs(total)}${unit}`];
        case 'hardyConcession':
          return [`Reduces Incoming Damage by ${Math.abs(total)}${unit}`, `Reduces Outgoing Damage by ${Math.abs(total)}${unit}`, `Reduces Outgoing Healing by ${Math.abs(total)}${unit}`];
        case 'futileStrikes':
          return [`Reduces chance to be critically hit by ${Math.abs(total)}${unit}`];
        case 'trivialBlows':
          return [`Reduces Critical Damage Taken by ${Math.abs(total)}${unit}`];
        default:
          return [isRegen
            ? `Increases Hit Points Every 4 Seconds by ${Math.abs(total)}`
            : `Increases ${ab.stat} by ${Math.abs(total)}${unit}`
          ];
      }
    })();

    return (
      <div className="max-w-[360px]">
        <div className="text-xs font-semibold" style={{ color: titleColor(lvl) }}>
          {ab.label}{lvl > 0 ? ` ${roman[lvl]}` : ''}
        </div>
        <div className="mt-0.5 text-xs space-y-0.5">
          {lines.map((ln, idx) => (
            <div key={idx}>{ln}</div>
          ))}
        </div>
      </div>
    );
  };

  // Outer: Tier 1 only when not embedded; in embedded mode, parent supplies Tier 1/2
  return (
    <div className={embedded ? 'relative' : 'lg:col-span-2 panel-container relative'}>
      <div className="text-[11px] text-muted mb-1">
        Renown points: {spent}/{cap} (Remaining: {remaining})
        {cr > 0 && cr < 40 ? (
          <span className="ml-2 italic opacity-80">Capped by Career Rank {cr} until CR40</span>
        ) : null}
      </div>
  {/* Tier 3 container holds all ability rows */}
  <div className="equipment-slot">
        <div className="grid grid-cols-1 gap-1">
        {ABILITIES.map((ab) => {
          const currentLevel = (ra[ab.key as keyof typeof ra] as number) || 0;
          const costTable = (ab.costTotals && ab.costTotals.length ? ab.costTotals : DEFAULT_COST_TOTALS);
          const budget = costTable[currentLevel] + remaining;
          let maxLevel = 5;
          for (let l = 5; l >= 0; l--) {
            if (costTable[l] <= budget) { maxLevel = l; break; }
          }
          if (ab.capLevel != null) maxLevel = Math.min(maxLevel, ab.capLevel);
          const clamped = Math.max(0, Math.min(5, Math.trunc(currentLevel)));
          const tier = roman[clamped] || '';
          const name = clamped > 0 ? `${ab.label} ${tier}` : ab.label;
          const rarityLevels: ItemRarity[] = [ItemRarity.UTILITY, ItemRarity.COMMON, ItemRarity.UNCOMMON, ItemRarity.RARE, ItemRarity.VERY_RARE, ItemRarity.MYTHIC];
          const rarity = rarityLevels[clamped] || ItemRarity.UTILITY;
          const color = getRarityColor(rarity);
          return (
          <div
            key={ab.key}
            className="flex items-center justify-between gap-1 rounded px-1 -mx-1 hover:bg-gray-800/60 hover:ring-1 hover:ring-gray-700 transition-colors"
          >
            <HoverTooltip content={renderAbilityTooltip(ab, clamped)}>
              <div className="flex items-center gap-1 min-w-0">
                {/* Icon placeholder; will use ab.iconUrl when provided */}
                <div className="w-5 h-5 rounded-sm bg-gray-700/70 overflow-hidden flex items-center justify-center flex-none">
                  {ab.iconUrl ? (
                    <img src={ab.iconUrl} alt="" className="w-5 h-5 object-cover" draggable={false} />
                  ) : (
                    <div className="w-4 h-4 bg-gray-600 rounded-sm" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium leading-tight truncate" style={{ color }}>{name}</div>
                </div>
              </div>
            </HoverTooltip>
            <LevelSelect
              value={currentLevel}
              maxLevel={maxLevel}
              statName={ab.key === 'hardyConcession' ? 'Damage & Healing' : (ab.key === 'regeneration' ? 'Hit Points Every 4 Seconds' : ab.stat)}
              percent={!!ab.percent}
              totalsOverride={ab.key === 'regeneration' && ab.customTotals ? ab.customTotals.map(v => v * 4) : ab.customTotals}
              visibleMaxLevel={ab.capLevel ?? 5}
              onChange={(lvl) => {
                if (loadoutId) loadoutService.setRenownAbilityLevelForLoadout(loadoutId, ab.key, lvl);
                else loadoutService.setRenownAbilityLevel(ab.key, lvl);
              }}
            />
          </div>
        );})}
        </div>
      </div>
    </div>
  );
});
