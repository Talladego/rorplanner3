import { EquipSlot } from '../types/index';

// Local, versioned static assets (fetched via scripts/fetchIcons.ts)
// Served by Vite from /public/icons/slots/*.png
export const DEFAULT_SLOT_ICONS: Record<EquipSlot, string> = {
  [EquipSlot.HELM]: '/icons/slots/helm.png',
  [EquipSlot.SHOULDER]: '/icons/slots/shoulder.png',
  [EquipSlot.BACK]: '/icons/slots/back.png',
  [EquipSlot.BODY]: '/icons/slots/body.png',
  [EquipSlot.GLOVES]: '/icons/slots/gloves.png',
  [EquipSlot.BELT]: '/icons/slots/belt.png',
  [EquipSlot.BOOTS]: '/icons/slots/boots.png',
  [EquipSlot.MAIN_HAND]: '/icons/slots/main-hand.png',
  [EquipSlot.OFF_HAND]: '/icons/slots/off-hand.png',
  [EquipSlot.RANGED_WEAPON]: '/icons/slots/ranged-weapon.png',
  [EquipSlot.JEWELLERY1]: '/icons/slots/jewellery.png',
  [EquipSlot.JEWELLERY2]: '/icons/slots/jewellery.png',
  [EquipSlot.JEWELLERY3]: '/icons/slots/jewellery.png',
  [EquipSlot.JEWELLERY4]: '/icons/slots/jewellery.png',
  [EquipSlot.EVENT]: '/icons/slots/event.png',
  [EquipSlot.POCKET1]: '/icons/slots/pocket.png',
  [EquipSlot.POCKET2]: '/icons/slots/pocket.png',
  // Additional slots that might not have specific icons
  [EquipSlot.NONE]: '/icons/slots/none.png',
  [EquipSlot.EITHER_HAND]: '/icons/slots/either-hand.png',
  [EquipSlot.STANDARD]: '/icons/slots/standard.png',
  [EquipSlot.TROPHY1]: '/icons/slots/trophy.png',
  [EquipSlot.TROPHY2]: '/icons/slots/trophy.png',
  [EquipSlot.TROPHY3]: '/icons/slots/trophy.png',
  [EquipSlot.TROPHY4]: '/icons/slots/trophy.png',
  [EquipSlot.TROPHY5]: '/icons/slots/trophy.png',
};
