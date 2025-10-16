
import type { Stat } from '../../types';

// Allowed stat filters (service-enforced)
export const ALLOWED_FILTER_STATS: Stat[] = [
  // Base Stats
  'STRENGTH', 'BALLISTIC_SKILL', 'INTELLIGENCE', 'TOUGHNESS', 'WEAPON_SKILL', 'INITIATIVE', 'WILLPOWER', 'WOUNDS',
  // Defense
  'ARMOR', 'SPIRIT_RESISTANCE', 'ELEMENTAL_RESISTANCE', 'CORPOREAL_RESISTANCE', 'BLOCK', 'PARRY', 'EVADE', 'DISRUPT',
  'CRITICAL_DAMAGE_TAKEN_REDUCTION', 'ARMOR_PENETRATION_REDUCTION', 'CRITICAL_HIT_RATE_REDUCTION', 'FORTITUDE',
  // Combat
  'ARMOR_PENETRATION', 'CRITICAL_DAMAGE', 'CRITICAL_HIT_RATE', 'MELEE_POWER', 'MELEE_CRIT_RATE', 'RANGED_POWER', 'RANGED_CRIT_RATE',
  'AUTO_ATTACK_SPEED', 'AUTO_ATTACK_DAMAGE', 'BLOCK_STRIKETHROUGH', 'PARRY_STRIKETHROUGH', 'EVADE_STRIKETHROUGH',
  // Magic
  'MAGIC_POWER', 'MAGIC_CRIT_RATE', 'HEALING_POWER', 'HEAL_CRIT_RATE', 'DISRUPT_STRIKETHROUGH',
  // Other
  'RANGE', 'RADIUS', 'ACTION_POINT_REGEN', 'HEALTH_REGEN', 'MORALE_REGEN', 'GOLD_LOOTED', 'XP_RECEIVED', 'RENOWN_RECEIVED', 'INFLUENCE_RECEIVED', 'HATE_CAUSED', 'HATE_RECEIVED',
] as unknown as Stat[];

export function sanitizeHasStats(hasStats?: Stat[]): Stat[] | undefined {
  if (!hasStats || hasStats.length === 0) return undefined;
  const filtered = hasStats.filter(s => (ALLOWED_FILTER_STATS as unknown as string[]).includes(s as unknown as string));
  return filtered.length ? (filtered as Stat[]) : undefined;
}

export function getAllowedFilterStats(): Stat[] {
  return ALLOWED_FILTER_STATS as unknown as Stat[];
}
