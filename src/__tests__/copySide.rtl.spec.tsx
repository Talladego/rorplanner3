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

// Staging repro (character Talladegun, Load on A, then Copy from A):
// these slots stayed filled on A and empty on B. Every other equipped slot copied.
const DROPPED_ON_STAGING: Array<{ slot: EquipSlot; name: string; itemSlot: EquipSlot }> = [
  { slot: EquipSlot.BACK, name: 'Sovereign Gearpack of the Gadgetmaster', itemSlot: EquipSlot.BACK },
  { slot: EquipSlot.JEWELLERY1, name: 'Silver Topaz Annulus', itemSlot: EquipSlot.JEWELLERY1 },
  { slot: EquipSlot.JEWELLERY2, name: 'Gold Topaz Annulus', itemSlot: EquipSlot.JEWELLERY1 },
  { slot: EquipSlot.BELT, name: 'Triumphant Tool Belt', itemSlot: EquipSlot.BELT },
  { slot: EquipSlot.JEWELLERY3, name: 'Triumphant Gearwrench', itemSlot: EquipSlot.JEWELLERY1 },
  { slot: EquipSlot.JEWELLERY4, name: 'Sovereign Gearwrench of the Gadgetmaster', itemSlot: EquipSlot.JEWELLERY1 },
];

const COPIED_ON_STAGING: Array<{ slot: EquipSlot; name: string; itemSlot: EquipSlot }> = [
  { slot: EquipSlot.HELM, name: 'Sovereign Hardhat of the Gadgetmaster', itemSlot: EquipSlot.HELM },
  { slot: EquipSlot.MAIN_HAND, name: 'Bloodlord Spanner', itemSlot: EquipSlot.MAIN_HAND },
  { slot: EquipSlot.SHOULDER, name: 'Sovereign Sparkplate of the Gadgetmaster', itemSlot: EquipSlot.SHOULDER },
  { slot: EquipSlot.OFF_HAND, name: "Gareksson's Brutabashin' Ring", itemSlot: EquipSlot.EITHER_HAND },
  { slot: EquipSlot.RANGED_WEAPON, name: 'Fortress Handgun', itemSlot: EquipSlot.RANGED_WEAPON },
  { slot: EquipSlot.BODY, name: 'Triumphant Bulwark', itemSlot: EquipSlot.BODY },
  { slot: EquipSlot.GLOVES, name: 'Sovereign Work Gloves of the Gadgetmaster', itemSlot: EquipSlot.GLOVES },
  { slot: EquipSlot.BOOTS, name: 'Triumphant Steeltoes', itemSlot: EquipSlot.BOOTS },
  { slot: EquipSlot.POCKET1, name: "Bit o' Bitterstone Ore", itemSlot: EquipSlot.POCKET1 },
  { slot: EquipSlot.POCKET2, name: 'Refreshing Pocket Keg', itemSlot: EquipSlot.POCKET2 },
];

const TALLADEGUN_GEAR = [...DROPPED_ON_STAGING, ...COPIED_ON_STAGING];

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

  for (const gear of TALLADEGUN_GEAR) {
    const item = makeItem({
      id: `item-${gear.slot}`,
      name: gear.name,
      slot: gear.itemSlot,
      careerRestriction: [Career.ENGINEER],
      iconUrl: '/icons/slots/back.png',
      talismanSlots: 1,
      uniqueEquipped: gear.slot.startsWith('JEWELLERY'),
    });
    useLoadoutStore.getState().setItemForLoadout(aId, gear.slot, item);
    const talisman = makeItem({
      id: `tal-${gear.slot}`,
      name: `Talisman ${gear.slot}`,
      slot: EquipSlot.NONE,
      careerRestriction: [],
      iconUrl: '/icons/slots/jewellery.png',
      talismanSlots: 0,
    });
    useLoadoutStore.getState().setTalismanForLoadout(aId, gear.slot, 0, talisman);
  }
  return aId;
}

function slotOnSide(side: 'A' | 'B', slot: EquipSlot): HTMLElement {
  const node = document.querySelector(`[data-side="${side}"][data-slot="${slot}"]`);
  if (!node) throw new Error(`missing ${side} ${slot}`);
  return node as HTMLElement;
}

describe('Copy from A', () => {
  beforeEach(() => {
    resetStore();
  });

  it('copies Talladegun back, belt, and jewels that staging left empty on B', async () => {
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
      expect(b?.items[EquipSlot.BACK]?.item?.name).toBe('Sovereign Gearpack of the Gadgetmaster');
      expect(b?.items[EquipSlot.JEWELLERY4]?.item?.name).toBe('Sovereign Gearwrench of the Gadgetmaster');
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

    for (const gear of TALLADEGUN_GEAR) {
      expect(b.items[gear.slot]?.item?.name, gear.slot).toBe(gear.name);
      expect(b.items[gear.slot]?.item?.id, gear.slot).toBe(a.items[gear.slot]?.item?.id);
      expect(b.items[gear.slot]?.talismans?.[0]?.id, `${gear.slot} talisman`).toBe(`tal-${gear.slot}`);
      expect(a.items[gear.slot]?.item?.name, `${gear.slot} still on A`).toBe(gear.name);
      expect(slotOnSide('B', gear.slot).textContent).toContain(gear.name);
      expect(slotOnSide('A', gear.slot).textContent).toContain(gear.name);
    }

    for (const gear of DROPPED_ON_STAGING) {
      expect(screen.getAllByText(gear.name).length).toBeGreaterThanOrEqual(2);
    }
  });
});
