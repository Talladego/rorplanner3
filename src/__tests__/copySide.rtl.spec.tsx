import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadoutService } from '../services/loadout/loadoutService';
import { useLoadoutStore } from '../store/loadout/loadoutStore';
import { initialStats } from '../store/loadout/state';
import { Career, EquipSlot } from '../types';
import { makeItem } from './factories';
import DualEquipmentLayout from '../components/panels/DualEquipmentLayout';
import DualToolbar from '../components/toolbar/DualToolbar';

vi.mock('../components/tooltip/Tooltip', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../components/tooltip/HoverTooltip', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../components/selector/EquipmentSelector', () => ({
  default: () => null,
}));
vi.mock('../components/stats/StatsComparePanel', () => ({
  default: () => <div>stats</div>,
}));
vi.mock('../components/panels/RenownPanel', () => ({
  default: () => <div>renown</div>,
}));

const COPIED_SLOTS: EquipSlot[] = [
  EquipSlot.HELM,
  EquipSlot.SHOULDER,
  EquipSlot.BACK,
  EquipSlot.BODY,
  EquipSlot.GLOVES,
  EquipSlot.BELT,
  EquipSlot.BOOTS,
  EquipSlot.MAIN_HAND,
  EquipSlot.OFF_HAND,
  EquipSlot.RANGED_WEAPON,
  EquipSlot.JEWELLERY1,
  EquipSlot.JEWELLERY2,
  EquipSlot.JEWELLERY3,
  EquipSlot.JEWELLERY4,
  EquipSlot.POCKET1,
  EquipSlot.POCKET2,
];

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

function equipFullSideA(): string {
  loadoutService.ensureSideLoadout('A');
  loadoutService.ensureSideLoadout('B');
  const aId = loadoutService.getSideLoadoutId('A')!;
  loadoutService.setCareerForLoadout(aId, Career.ENGINEER);
  loadoutService.setLevelForLoadout(aId, 40);
  loadoutService.setRenownForLoadout(aId, 81);
  loadoutService.setRenownAbilityLevelForLoadout(aId, 'might', 2);
  loadoutService.setCharacterStatusForLoadout(aId, true, 'Talladegun');

  for (const slot of COPIED_SLOTS) {
    const itemSlot = slot === EquipSlot.JEWELLERY2 || slot === EquipSlot.JEWELLERY3 || slot === EquipSlot.JEWELLERY4
      ? EquipSlot.JEWELLERY1
      : slot === EquipSlot.OFF_HAND
        ? EquipSlot.EITHER_HAND
        : slot;
    const item = makeItem({
      id: `item-${slot}`,
      name: `Item ${slot}`,
      slot: itemSlot,
      careerRestriction: [Career.ENGINEER],
      iconUrl: '/icons/slots/back.png',
      talismanSlots: 1,
      uniqueEquipped: slot.startsWith('JEWELLERY'),
    });
    useLoadoutStore.getState().setItemForLoadout(aId, slot, item);
    const talisman = makeItem({
      id: `tal-${slot}`,
      name: `Talisman ${slot}`,
      slot: EquipSlot.NONE,
      careerRestriction: [],
      iconUrl: '/icons/slots/jewellery.png',
      talismanSlots: 0,
    });
    useLoadoutStore.getState().setTalismanForLoadout(aId, slot, 0, talisman);
  }
  return aId;
}

describe('Copy from A', () => {
  beforeEach(() => {
    resetStore();
  });

  it('copies cloak, belt, jewels, and talismans onto Loadout B', async () => {
    equipFullSideA();
    render(
      <>
        <DualToolbar />
        <DualEquipmentLayout />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy from A' }));

    await waitFor(() => {
      const b = loadoutService.getLoadoutForSide('B');
      expect(b?.items[EquipSlot.BELT]?.item?.id).toBe('item-BELT');
      expect(b?.items[EquipSlot.JEWELLERY4]?.item?.id).toBe('item-JEWELLERY4');
    });

    const a = loadoutService.getLoadoutForSide('A')!;
    const b = loadoutService.getLoadoutForSide('B')!;
    expect(b.id).not.toBe(a.id);
    expect(b.career).toBe(Career.ENGINEER);
    expect(b.level).toBe(40);
    expect(b.renownRank).toBe(81);
    expect(b.characterName).toBe('Talladegun');
    expect(b.renownAbilities?.might).toBe(2);
    expect(b.name).not.toBe(a.name);

    for (const slot of COPIED_SLOTS) {
      expect(b.items[slot]?.item?.id, slot).toBe(a.items[slot]?.item?.id);
      expect(b.items[slot]?.talismans?.[0]?.id, `${slot} talisman`).toBe(`tal-${slot}`);
      expect(a.items[slot]?.item?.id, `${slot} still on A`).toBe(`item-${slot}`);
    }

    expect(screen.getAllByText('Item BACK').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Item BELT').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Item JEWELLERY1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Item JEWELLERY4').length).toBeGreaterThanOrEqual(2);
  });
});
