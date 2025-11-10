import { urlService } from '../services/loadout/urlService';
import { updateUrlIfAuto } from '../services/loadout/urlSync';

describe('urlSync.updateUrlIfAuto', () => {
  it('calls updateUrlForCurrentLoadout only when not character-loading and auto-update enabled', () => {
    const origAuto = urlService.isAutoUpdateEnabled();
    const origFn = urlService.updateUrlForCurrentLoadout.bind(urlService);
  // Mock updateUrlForCurrentLoadout
  const calls: number[] = [];
  (urlService as any).updateUrlForCurrentLoadout = () => { calls.push(Date.now()); };

    try {
      urlService.setAutoUpdateEnabled(false);
      updateUrlIfAuto(false); // should not call
      expect(calls.length).toBe(0);

      urlService.setAutoUpdateEnabled(true);
      updateUrlIfAuto(true); // character loading true -> no call
      expect(calls.length).toBe(0);

      updateUrlIfAuto(false); // now should call exactly once
      expect(calls.length).toBe(1);
    } finally {
      urlService.setAutoUpdateEnabled(origAuto);
  // restore
  (urlService as any).updateUrlForCurrentLoadout = origFn;
    }
  });
});
