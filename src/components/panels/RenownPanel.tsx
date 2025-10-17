import { memo, useMemo } from 'react';
import { loadoutService } from '../../services/loadout/loadoutService';
import { RENOWN_ABILITIES, DEFAULT_COST_TOTALS } from '../../services/loadout/renownConfig';
import { useLoadoutById } from '../../hooks/useLoadoutById';
import { ItemRarity } from '../../types';
import { getRarityColor } from '../../utils/rarityColors';

const ABILITIES = RENOWN_ABILITIES;

const LEVEL_TOTALS = [0, 4, 16, 38, 72, 120];
const roman = ['', 'I', 'II', 'III', 'IV', 'V']; // map: 0->'', 1->I, 2->II, 3->III, 4->IV, 5->V

function LevelSelect({ value, onChange, maxLevel, statName, percent, totalsOverride, visibleMaxLevel = 5 }: { value: number; onChange: (v: number) => void; maxLevel: number; statName: string; percent?: boolean; totalsOverride?: number[]; visibleMaxLevel?: number }) {
  return (
    <select
      className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={(e) => onChange(Number(e.currentTarget.value))}
    >
      {Array.from({ length: visibleMaxLevel + 1 }, (_, i) => i).map((lvl) => {
        const table = totalsOverride && totalsOverride.length ? totalsOverride : LEVEL_TOTALS;
        const total = table[Math.max(0, Math.min(5, lvl))];
        // Drop roman numerals in dropdown; keep concise value text
        const label = lvl === 0 ? 'None' : `+${total}${percent ? '%' : ''} ${statName}`;
        return (
          <option key={lvl} value={lvl} disabled={lvl > maxLevel}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export default memo(function RenownPanel({ loadoutId }: { loadoutId: string | null }) {
  const { loadout } = useLoadoutById(loadoutId);
  const ra = loadout?.renownAbilities || {};
  const rr = loadout?.renownRank || 0;
  const spent = useMemo(() => {
    const ra = loadout?.renownAbilities || {} as NonNullable<typeof loadout>['renownAbilities'];
    let sum = 0;
    ABILITIES.forEach((ab) => {
      const lvl = Math.max(0, Math.min(5, Math.trunc((ra as any)?.[ab.key] || 0)));
      const table = ab.costTotals && ab.costTotals.length ? ab.costTotals : DEFAULT_COST_TOTALS;
      sum += table[Math.max(0, Math.min(table.length - 1, lvl))] || 0;
    });
    return sum;
  }, [loadout]);
  const cap = Math.min(rr || 0, 80);
  const remaining = Math.max(0, cap - spent);

  return (
    <div className="lg:col-span-2 panel-container relative">
      <div className="text-[11px] text-muted mb-1">Renown points: {spent}/{cap} (Remaining: {remaining})</div>
      <div className="grid grid-cols-1 gap-0.5">
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
          <div key={ab.key} className="flex items-center justify-between gap-1 p-0.5 rounded bg-gray-800/60">
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
            <LevelSelect
              value={currentLevel}
              maxLevel={maxLevel}
              statName={ab.stat}
              percent={!!ab.percent}
              totalsOverride={ab.customTotals}
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
  );
});
