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
}

export default function StatRow({
  statKey,
  displayA,
  displayB,
  isPercentRow,
  needsUnitNormalization,
  contributionsA,
  contributionsB,
}: StatRowProps) {
  const label = formatSummaryStatKey(statKey);

  return (
    <div className="stats-row rounded px-1 -mx-1 hover:bg-gray-800/60 hover:ring-1 hover:ring-gray-700 transition-colors">
      <span className="text-xs">{label}:</span>
      <span className="stats-label font-medium text-xs">
        <div className="grid grid-cols-[5rem_5rem] gap-3 justify-end">
          {/* A side */}
          <HoverTooltip
            placement="right"
            className="cursor-help w-full text-right"
            content={
              <div className="max-w-[26rem] whitespace-nowrap overflow-x-auto">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatSummaryStatKey(statKey)} — A Contribution</div>
                <ul className="space-y-0.5">
                  {contributionsA.length === 0 ? (
                    <li className="text-[11px] text-gray-400">No contributors</li>
                  ) : (
                    contributionsA.map((c, idx) => (
                      <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                        <span>
                          <span style={{ color: c.color || undefined }}>{c.name}</span>
                          {c.count > 1 && <span className="ml-1 text-gray-400">(x{c.count})</span>}
                        </span>
                        <span className="text-gray-200">{formatStatValue(needsUnitNormalization && !c.percentage ? normalizeStatDisplayValue(statKey, c.totalValue) : c.totalValue, isPercentRow || c.percentage, 1)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            }
          >
            <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${displayA > displayB ? 'font-bold text-green-300' : 'text-green-400'}`}>
              {formatStatValue(needsUnitNormalization ? normalizeStatDisplayValue(statKey, displayA) : displayA, isPercentRow, 1)}
            </span>
          </HoverTooltip>

          {/* B side */}
          <HoverTooltip
            placement="right"
            className="cursor-help w-full text-right"
            content={
              <div className="max-w-[26rem] whitespace-nowrap overflow-x-auto">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatSummaryStatKey(statKey)} — B Contribution</div>
                <ul className="space-y-0.5">
                  {contributionsB.length === 0 ? (
                    <li className="text-[11px] text-gray-400">No contributors</li>
                  ) : (
                    contributionsB.map((c, idx) => (
                      <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                        <span>
                          <span style={{ color: c.color || undefined }}>{c.name}</span>
                          {c.count > 1 && <span className="ml-1 text-gray-400">(x{c.count})</span>}
                        </span>
                        <span className="text-gray-200">{formatStatValue(needsUnitNormalization && !c.percentage ? normalizeStatDisplayValue(statKey, c.totalValue) : c.totalValue, isPercentRow || c.percentage, 1)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            }
          >
            <span className={`text-right inline-block w-20 whitespace-nowrap tabular-nums ${displayB > displayA ? 'font-bold text-red-300' : 'text-red-400'}`}>
              {formatStatValue(needsUnitNormalization ? normalizeStatDisplayValue(statKey, displayB) : displayB, isPercentRow, 1)}
            </span>
          </HoverTooltip>
        </div>
      </span>
    </div>
  );
}
