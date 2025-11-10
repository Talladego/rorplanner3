import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { updateUrlIfAuto } from './urlSync';
import { computeStatsForLoadout as computeStatsForLoadoutExternal, getStatContributionsForLoadout as getStatContributionsForLoadoutExternal } from './stats';

export interface StatsContext {
  isBulk: boolean;
}

export function getStatsSummary(ctx: StatsContext) {
  loadoutStoreAdapter.calculateStats();
  const stats = loadoutStoreAdapter.getStatsSummary();
  loadoutEventEmitter.emit({ type: 'STATS_UPDATED', payload: { stats }, timestamp: Date.now() });
  updateUrlIfAuto(ctx.isBulk);
  return stats;
}

export function computeStatsForLoadout(loadoutId: string, opts?: { includeRenown?: boolean }) {
  return computeStatsForLoadoutExternal(loadoutId, opts);
}

export function getStatContributionsForLoadout(
  loadoutId: string,
  statKey: keyof import('../../types').StatsSummary | string,
  opts?: { includeRenown?: boolean }
) {
  // Preserve flexibility: stats layer accepts string keys as well as typed StatsSummary keys
  return getStatContributionsForLoadoutExternal(loadoutId, statKey as keyof import('../../types').StatsSummary | string, opts);
}
