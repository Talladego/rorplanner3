import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutEventEmitter } from '../services/loadout/loadoutEventEmitter';
import { EquipSlot, Career } from '../types';
import { makeItem } from './factories';

describe('loadoutService emits expected events', () => {
  afterEach(() => {
    (loadoutEventEmitter as any).removeAllListeners();
  });

  it('emits ITEM_UPDATED with payload when updating an item for a loadout', async () => {
    // Arrange a loadout and set compatible career
    const id = loadoutService.createLoadout('Evt Test', 40, 80);
    loadoutService.setCareerForLoadout(id, Career.SLAYER);
    const helm = makeItem({ id: 'helm-1', slot: EquipSlot.HELM, careerRestriction: [Career.SLAYER] });

    const events: any[] = [];
    const unsub = loadoutEventEmitter.subscribe('ITEM_UPDATED', (e) => events.push(e));

    // Act
    await loadoutService.updateItemForLoadout(id, EquipSlot.HELM, helm);

    // Assert
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('ITEM_UPDATED');
    expect(events[0].payload.slot).toBe(EquipSlot.HELM);
    expect(events[0].payload.item.id).toBe('helm-1');

    unsub();
  });
});
