import { memo } from 'react';
import { Item } from '../../types';
import { formatCareerName, formatRaceName } from '../../utils/formatters';

export interface RequirementsBlockProps {
  item: Item;
  eligible: boolean;
}

function RequirementsBlock({ item, eligible }: RequirementsBlockProps) {
  return (
    <div className={`text-xs space-y-1 ${eligible ? 'text-gray-200' : 'text-gray-500'}`}>
      <>
        {item.levelRequirement > 0 && (
          <div>Minimum Rank: {item.levelRequirement}</div>
        )}
        {item.renownRankRequirement > 0 && (
          <div>Requires {item.renownRankRequirement} Renown</div>
        )}
      </>
      {item.careerRestriction && item.careerRestriction.length > 0 && (
        <div>Career: {item.careerRestriction.map(career => formatCareerName(career)).join(', ')}</div>
      )}
      {item.raceRestriction && item.raceRestriction.length > 0 && (
        <div>Race: {item.raceRestriction.map(race => formatRaceName(race)).join(', ')}</div>
      )}
    </div>
  );
}

export default memo(RequirementsBlock);
