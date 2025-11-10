// React 17+ JSX runtime; no default import required
import HoverTooltip from '../tooltip/HoverTooltip';
import { formatStatValue, normalizeStatDisplayValue, formatSummaryStatKey } from '../../utils/formatters';

export type Contribution = {
  name: string;
  count: number;
  totalValue: number;
  percentage: boolean;
  color?: string;
};

export interface StatRowProps {
  statKey: string;
  displayA: number;
  displayB: number;
  isPercentRow: boolean;
  needsUnitNormalization: boolean;
  contributionsA: Contribution[];
  contributionsB: Contribution[];
  /** If true, force one decimal place even for integer values (e.g., derived/calculated stats). */
  forceOneDecimal?: boolean;
  /** Global derived stats toggle informing percent formatting behavior. */
  includeDerivedStats?: boolean;
}

export default function StatRow({
  statKey,
  displayA,
  displayB,
  isPercentRow,
  needsUnitNormalization,
  contributionsA,
  contributionsB,
  forceOneDecimal,
  includeDerivedStats,
}: StatRowProps) {
  const label = formatSummaryStatKey(statKey);
  // Helpers for normalization and visibility
  const normalizeValue = (c: Contribution) =>
    needsUnitNormalization && !c.percentage
      ? normalizeStatDisplayValue(statKey, c.totalValue)
      : c.totalValue;
  const isNonZero = (c: Contribution) => {
    const n = Number(normalizeValue(c));
    return Number.isFinite(n) && n !== 0;
  };

  // Filter out zero-value contributions
  const filteredA = (contributionsA || []).filter(isNonZero);
  const filteredB = (contributionsB || []).filter(isNonZero);

  // Determine if this row has any derived contributions (visible ones only)
  const hasDerivedContrib = (filteredA.some(c => c.name.includes('(Derived)')) || filteredB.some(c => c.name.includes('(Derived)')));

  // Only force decimals for percent rows when derived stats are enabled AND this row is actually affected by derived sources.
  // Derived rows themselves pass forceOneDecimal which takes precedence.
  const decimalsForced = !!forceOneDecimal || (!!includeDerivedStats && !!isPercentRow && hasDerivedContrib);

  const formatDisplay = (value: number, asPercent: boolean) => {
    const isFiniteNum = Number.isFinite(value);
    const fixed = isFiniteNum ? (Math.round((value as number) * 10) / 10).toFixed(1) : String(value);
    if (decimalsForced) {
      if (asPercent) return `${(value as number) > 0 ? '+' : ''}${fixed}%`;
      return (value as number) > 0 ? `+${fixed}` : fixed;
    }
    return formatStatValue(value, asPercent, 1);
  };

  // Use the same normalization logic as display for consistent sorting
  const sortValue = (c: Contribution) => {
    const raw = normalizeValue(c);
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  };

  const sortedA = [...filteredA].sort((a, b) => sortValue(b) - sortValue(a));
  const sortedB = [...filteredB].sort((a, b) => sortValue(b) - sortValue(a));

  return (
    <div className="stats-row rounded px-1 -mx-1 hover:bg-gray-800/60 hover:ring-1 hover:ring-gray-700 transition-colors">
      <span className="text-xs">{label}:</span>
      <span className="stats-label font-medium text-xs">
        <div className="grid grid-cols-[5rem_5rem] gap-3 justify-end">
          {/* A side */}
          <HoverTooltip
            placement="right"
            className="cursor-help w-full text-right"
            fixedWidth={320}
            content={
              <div className="max-w-[26rem] whitespace-normal break-words overflow-x-hidden">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatSummaryStatKey(statKey)} — A Contribution</div>
                <ul className="space-y-0.5">
                  {sortedA.length === 0 ? (
                    <li className="text-[11px] text-gray-400">No contributors</li>
                  ) : (
                    sortedA.map((c, idx) => (
                      <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                        <span>
                          <span style={{ color: c.color || undefined }}>{c.name}</span>
                          {c.count > 1 && <span className="ml-1 text-gray-400">(x{c.count})</span>}
                        </span>
                        <span className="text-gray-200">{formatDisplay(needsUnitNormalization && !c.percentage ? normalizeStatDisplayValue(statKey, c.totalValue) : c.totalValue, isPercentRow || c.percentage)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            }
          >
            <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${displayA > displayB ? 'font-bold text-green-300' : 'text-green-400'}`}>
              {formatDisplay(needsUnitNormalization ? normalizeStatDisplayValue(statKey, displayA) : displayA, isPercentRow)}
            </span>
          </HoverTooltip>

          {/* B side */}
          <HoverTooltip
            placement="right"
            className="cursor-help w-full text-right"
            fixedWidth={320}
            content={
              <div className="max-w-[26rem] whitespace-normal break-words overflow-x-hidden">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatSummaryStatKey(statKey)} — B Contribution</div>
                <ul className="space-y-0.5">
                  {sortedB.length === 0 ? (
                    <li className="text-[11px] text-gray-400">No contributors</li>
                  ) : (
                    sortedB.map((c, idx) => (
                      <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                        <span>
                          <span style={{ color: c.color || undefined }}>{c.name}</span>
                          {c.count > 1 && <span className="ml-1 text-gray-400">(x{c.count})</span>}
                        </span>
                        <span className="text-gray-200">{formatDisplay(needsUnitNormalization && !c.percentage ? normalizeStatDisplayValue(statKey, c.totalValue) : c.totalValue, isPercentRow || c.percentage)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            }
          >
            <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${displayB > displayA ? 'font-bold text-red-300' : 'text-red-400'}`}>
              {formatDisplay(needsUnitNormalization ? normalizeStatDisplayValue(statKey, displayB) : displayB, isPercentRow)}
            </span>
          </HoverTooltip>
        </div>
      </span>
    </div>
  );
}
