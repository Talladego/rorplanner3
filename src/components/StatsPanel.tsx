import { useLoadoutStats } from '../hooks/useLoadoutStats';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { formatCamelCase } from '../utils/formatters';
import { loadoutService } from '../services/loadoutService';
import HoverTooltip from './HoverTooltip';

function formatStatValue(value: number, isPercentage: boolean = false): string {
  if (isPercentage) {
    return `${value > 0 ? '+' : ''}${value}%`;
  }
  return value > 0 ? `+${value}` : value.toString();
}

export default function StatsPanel() {
  const { stats } = useLoadoutStats();
  const { currentLoadout } = useLoadoutData();

  if (!stats || !currentLoadout) {
    return (
      <div className="panel-container">
        <h2 className="panel-heading">Stats Summary</h2>
        <div className="text-muted">No loadout selected</div>
      </div>
    );
  }

  // Count equipped items
  // Removed loadout info count per request
  const isAllZero = Object.values(stats).every(value => value === 0);

  // Group stats by category
  const baseStats = [
    { key: 'strength', value: stats.strength },
    { key: 'agility', value: stats.agility },
    { key: 'ballisticSkill', value: stats.ballisticSkill },
    { key: 'intelligence', value: stats.intelligence },
    { key: 'toughness', value: stats.toughness },
    { key: 'weaponSkill', value: stats.weaponSkill },
    { key: 'initiative', value: stats.initiative },
    { key: 'willpower', value: stats.willpower },
    { key: 'wounds', value: stats.wounds },
  ];

  const defenseStats = [
    { key: 'armor', value: stats.armor },
    { key: 'spiritResistance', value: stats.spiritResistance },
    { key: 'corporealResistance', value: stats.corporealResistance },
    { key: 'elementalResistance', value: stats.elementalResistance },
    { key: 'block', value: stats.block, isPercentage: true },
    { key: 'parry', value: stats.parry, isPercentage: true },
    { key: 'disrupt', value: stats.disrupt, isPercentage: true },
    { key: 'evade', value: stats.evade, isPercentage: true },
    { key: 'armorPenetrationReduction', value: stats.armorPenetrationReduction },
    { key: 'criticalHitRateReduction', value: stats.criticalHitRateReduction },
  ];

  const combatStats = [
    { key: 'outgoingDamage', value: stats.outgoingDamage },
    { key: 'criticalDamage', value: stats.criticalDamage },
    { key: 'incomingDamage', value: stats.incomingDamage }, // Armor Penetration
    { key: 'meleePower', value: stats.meleePower },
    { key: 'rangedPower', value: stats.rangedPower },
    { key: 'armorPenetration', value: stats.armorPenetration },
    { key: 'meleeCritRate', value: stats.meleeCritRate, isPercentage: true },
    { key: 'rangedCritRate', value: stats.rangedCritRate, isPercentage: true },
    { key: 'blockStrikethrough', value: stats.blockStrikethrough },
    { key: 'parryStrikethrough', value: stats.parryStrikethrough },
    { key: 'evadeStrikethrough', value: stats.evadeStrikethrough },
  ];

  const magicStats: { key: string; value: number; isPercentage?: boolean }[] = [
    { key: 'magicPower', value: stats.magicPower },
    { key: 'magicCritRate', value: stats.magicCritRate, isPercentage: true },
    { key: 'healingPower', value: stats.healingPower },
    { key: 'healCritRate', value: stats.healCritRate, isPercentage: true },
    { key: 'outgoingHealPercent', value: stats.outgoingHealPercent, isPercentage: true },
    { key: 'incomingHealPercent', value: stats.incomingHealPercent, isPercentage: true },
    { key: 'disruptStrikethrough', value: stats.disruptStrikethrough },
  ];

  const otherStats = [
    { key: 'velocity', value: stats.velocity },
    { key: 'actionPointRegen', value: stats.actionPointRegen },
    { key: 'moraleRegen', value: stats.moraleRegen },
    { key: 'cooldown', value: stats.cooldown },
    { key: 'range', value: stats.range },
    { key: 'autoAttackSpeed', value: stats.autoAttackSpeed },
    { key: 'outgoingDamagePercent', value: stats.outgoingDamagePercent, isPercentage: true },
    { key: 'incomingDamagePercent', value: stats.incomingDamagePercent, isPercentage: true },
    { key: 'buildTime', value: stats.buildTime },
    { key: 'healthRegen', value: stats.healthRegen },
    { key: 'maxActionPoints', value: stats.maxActionPoints },
    { key: 'fortitude', value: stats.fortitude },
    { key: 'mastery1Bonus', value: stats.mastery1Bonus },
    { key: 'mastery2Bonus', value: stats.mastery2Bonus },
    { key: 'mastery3Bonus', value: stats.mastery3Bonus },
  ];

  const renderStatGroup = (title: string, statGroup: { key: string; value: number; isPercentage?: boolean }[], showIfEmpty: boolean = false) => {
    const nonZeroStats = statGroup.filter(stat => stat.value !== 0);
    if (!showIfEmpty && nonZeroStats.length === 0) return null;

    return (
      <div>
        <h3 className="stats-section-title">{title}</h3>
        <div className="space-y-0.5">
          {nonZeroStats.length > 0 ? (
            nonZeroStats.map(stat => {
              const contributions = loadoutService.getStatContributions(stat.key);
              const isPercentRow = !!stat.isPercentage || contributions.some(c => c.percentage);
              return (
                <HoverTooltip
                  key={stat.key}
                  placement="left"
                  className="cursor-help"
                  content={
                    <div className="max-w-[26rem] whitespace-nowrap overflow-x-auto">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">{formatCamelCase(stat.key)}</div>
                      <ul className="space-y-0.5">
                        {contributions.length === 0 && (
                          <li className="text-[11px] text-gray-400">No contributors</li>
                        )}
                        {contributions.map((c, idx) => (
                          <li key={idx} className="text-[11px] flex items-center justify-between gap-3">
                            <span>
                              <span style={{ color: c.color || undefined }}>{c.name}</span>
                              {c.count > 1 && (
                                <span className="ml-1 text-gray-400">(x{c.count})</span>
                              )}
                            </span>
                            <span className="text-gray-200">{formatStatValue(c.totalValue, isPercentRow || c.percentage)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                >
                  <div className="stats-row rounded px-1 -mx-1 hover:bg-gray-800/60 hover:ring-1 hover:ring-gray-700 transition-colors">
                    <span className="text-xs">{formatCamelCase(stat.key)}:</span>
                    <span className="stats-label font-medium text-xs">
                      {formatStatValue(stat.value, isPercentRow)}
                    </span>
                  </div>
                </HoverTooltip>
              );
            })
          ) : (
            title === 'Base Stats' ? null : (
              <div className="text-xs text-muted italic">No {title.toLowerCase()} bonuses</div>
            )
          )}
        </div>
      </div>
    );
  };

  // If loadout has no bonuses at all, only show the empty state text
  if (isAllZero) {
    return (
      <div className="panel-container">
        <h2 className="panel-heading">Stats Summary</h2>
        <div className="stats-empty-message">Equip items to see stat bonuses</div>
      </div>
    );
  }

  return (
    <div className="panel-container">
      <h2 className="panel-heading">Stats Summary</h2>

      {/* Base Stats - Always show */}
      <div className="stats-section">
        {renderStatGroup('Base Stats', baseStats, true)}
      </div>

      {/* Defense Stats */}
      <div className="stats-section">
        {renderStatGroup('Defense', defenseStats)}
      </div>

      {/* Combat Stats */}
      <div className="stats-section">
        {renderStatGroup('Combat', combatStats)}
      </div>

      {/* Magic Stats */}
      <div className="stats-section">
        {renderStatGroup('Magic', magicStats)}
      </div>

      {/* Other Stats */}
      <div className="stats-section">
        {renderStatGroup('Other', otherStats)}
      </div>
    </div>
  );
}
