import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EquipmentPanel from '../components/panels/EquipmentPanel';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats, createInitialLoadout } from '../store/loadout/state';
import { Career, EquipSlot, ItemRarity, ItemType } from '../types';

vi.mock('../components/tooltip/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/tooltip/HoverTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/selector/EquipmentSelector', () => ({
  default: () => null,
}));

function resetStore() {
  useLoadoutStore.setState({
    loadouts: [],
    currentLoadoutId: null,
    activeSide: 'A',
    sideLoadoutIds: { A: null, B: null },
    sideCareerLoadoutIds: { A: {}, B: {} },
    statsSummary: initialStats,
  } as never);
}

describe('EquipmentPanel invalid overlay', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows invalid marker when equipped item fails getItemEligibility', async () => {
    const loadout = createInitialLoadout('lo-a', 'Side A', 10, 10);
    loadout.career = Career.IRON_BREAKER;
    // High level req vs loadout level 10 → ineligible
    loadout.items[EquipSlot.HELM] = {
      item: {
        id: 'helm-high',
        name: 'Too High Helm',
        description: '',
        type: ItemType.MEDIUM_ARMOR,
        slot: EquipSlot.HELM,
        rarity: ItemRarity.COMMON,
        armor: 10,
        dps: 0,
        speed: 0,
        levelRequirement: 40,
        renownRankRequirement: 0,
        itemLevel: 40,
        uniqueEquipped: false,
        stats: [],
        careerRestriction: [],
        raceRestriction: [],
        iconUrl: 'https://example.com/helm.png',
        talismanSlots: 0,
        itemSet: null,
        abilities: [],
        buffs: [],
      },
      talismans: [],
    };

    useLoadoutStore.setState({
      loadouts: [loadout],
      currentLoadoutId: loadout.id,
      sideLoadoutIds: { A: loadout.id, B: null },
    } as never);

    render(
      <EquipmentPanel
        selectedCareer={Career.IRON_BREAKER}
        loadoutId={loadout.id}
        iconOnly
        hideHeading
        side="A"
      />
    );

    await waitFor(() => {
      expect(screen.getByTitle('Invalid item for current rules or requirements')).toBeInTheDocument();
    });
    const icon = document.querySelector('.equipment-icon.invalid');
    expect(icon).toBeTruthy();
  });
});
