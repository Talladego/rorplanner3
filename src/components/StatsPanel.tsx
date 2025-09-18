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
  const baseStats = [
    { key: 'strength', value: stats.strength },
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
  ];

  const combatStats = [
    { key: 'outgoingDamage', value: stats.outgoingDamage },
    { key: 'criticalDamage', value: stats.criticalDamage },
    { key: 'incomingDamage', value: stats.incomingDamage }, // Armor Penetration
  ];

  const magicStats: { key: string; value: number; isPercentage?: boolean }[] = [
    // Magic stats not currently available in the data
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

      {/* Show message if no stats */}
      {Object.values(stats).every(value => value === 0) && (
        <div className="stats-empty-message">
          Equip items to see stat bonuses
        </div>
      )}
    </div>
  );
}
