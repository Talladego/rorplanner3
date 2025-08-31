import { useLoadoutStats } from '../hooks/useLoadoutStats';
import { useLoadoutData } from '../hooks/useLoadoutData';
import { formatCamelCaseToTitle } from '../utils/formatters';

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
  const equippedItemsCount = Object.values(currentLoadout.items).filter(slot => slot.item !== null).length;

  // Group stats by category
  const coreStats = [
    { key: 'strength', value: stats.strength },
    { key: 'agility', value: stats.agility },
    { key: 'willpower', value: stats.willpower },
    { key: 'toughness', value: stats.toughness },
    { key: 'wounds', value: stats.wounds },
    { key: 'initiative', value: stats.initiative },
    { key: 'intelligence', value: stats.intelligence },
  ];

  const combatStats = [
    { key: 'weaponSkill', value: stats.weaponSkill },
    { key: 'ballisticSkill', value: stats.ballisticSkill },
    { key: 'armor', value: stats.armor },
    { key: 'block', value: stats.block },
    { key: 'parry', value: stats.parry },
    { key: 'evade', value: stats.evade },
    { key: 'disrupt', value: stats.disrupt },
  ];

  const damageStats = [
    { key: 'outgoingDamage', value: stats.outgoingDamage },
    { key: 'outgoingDamagePercent', value: stats.outgoingDamagePercent, isPercentage: true },
    { key: 'incomingDamage', value: stats.incomingDamage },
    { key: 'incomingDamagePercent', value: stats.incomingDamagePercent, isPercentage: true },
    { key: 'criticalDamage', value: stats.criticalDamage },
  ];

  const resistanceStats = [
    { key: 'spiritResistance', value: stats.spiritResistance },
    { key: 'elementalResistance', value: stats.elementalResistance },
    { key: 'corporealResistance', value: stats.corporealResistance },
  ];

  const utilityStats = [
    { key: 'velocity', value: stats.velocity },
    { key: 'actionPointRegen', value: stats.actionPointRegen },
    { key: 'moraleRegen', value: stats.moraleRegen },
    { key: 'cooldown', value: stats.cooldown },
    { key: 'range', value: stats.range },
    { key: 'autoAttackSpeed', value: stats.autoAttackSpeed },
  ];

  const renderStatGroup = (title: string, statGroup: { key: string; value: number; isPercentage?: boolean }[], showIfEmpty: boolean = false) => {
    const nonZeroStats = statGroup.filter(stat => stat.value !== 0);
    if (!showIfEmpty && nonZeroStats.length === 0) return null;

    return (
      <div>
        <h3 className="stats-section-title">{title}</h3>
        <div className="space-y-1">
          {nonZeroStats.length > 0 ? (
            nonZeroStats.map(stat => (
              <div key={stat.key} className="stats-row">
                <span className="text-sm">{formatCamelCaseToTitle(stat.key)}:</span>
                <span className="stats-label font-medium">
                  {formatStatValue(stat.value, stat.isPercentage)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted italic">No {title.toLowerCase()} bonuses</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="panel-container">
      <h2 className="panel-heading">Stats Summary</h2>

      {/* Loadout Info */}
      <div className="stats-loadout-info">
        <div className="text-sm text-muted">
          {equippedItemsCount} item{equippedItemsCount !== 1 ? 's' : ''} equipped
        </div>
      </div>

      {/* Core Stats - Always show */}
      <div className="stats-section">
        {renderStatGroup('Core Stats', coreStats, true)}
      </div>

      {/* Combat Stats */}
      <div className="stats-section">
        {renderStatGroup('Combat', combatStats)}
      </div>

      {/* Damage Stats */}
      <div className="stats-section">
        {renderStatGroup('Damage', damageStats)}
      </div>

      {/* Resistance Stats */}
      <div className="stats-section">
        {renderStatGroup('Resistance', resistanceStats)}
      </div>

      {/* Utility Stats */}
      <div className="stats-section">
        {renderStatGroup('Utility', utilityStats)}
      </div>

      {/* Show message if no stats */}
      {Object.values(stats).every(value => value === 0) && (
        <div className="stats-empty-message">
          Equip items to see stat bonuses
        </div>
      )}
    </div>
  );
}
