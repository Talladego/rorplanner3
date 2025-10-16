import { urlService } from './urlService';

/**
 * Update the URL to reflect the current loadout if auto-update is enabled
 * and we are not in the middle of character-loading flow.
 */
export function updateUrlIfAuto(isCharacterLoading: boolean) {
  if (!isCharacterLoading && urlService.isAutoUpdateEnabled()) {
    urlService.updateUrlForCurrentLoadout();
  }
}
