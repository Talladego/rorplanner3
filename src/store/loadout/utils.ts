import type { StatsSummary } from '../../types';
import { STAT_TO_SUMMARY_KEY } from '../../constants/statMaps';

export const mapStatToKey = (stat: string): keyof StatsSummary | null => {
  return (STAT_TO_SUMMARY_KEY as Record<string, keyof StatsSummary>)[stat] || null;
};
