import { urlService } from './urlService';

export function updateUrlIfAuto(isCharacterLoading: boolean) {
	if (!isCharacterLoading && urlService.isAutoUpdateEnabled()) {
		urlService.updateUrlForCurrentLoadout();
	}
}

