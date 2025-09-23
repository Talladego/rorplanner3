import { Career, Loadout, LoadoutItem, EquipSlot, LoadoutSide } from '../types';
import { loadoutStoreAdapter } from '../store/loadoutStoreAdapter';
import { loadoutService } from './loadoutService';

class UrlService {
  // Navigation callback provided by App via react-router's navigate
  private navigateCb: ((path: string, options?: { replace?: boolean }) => void) | null = null;
  // Suppress URL updates while applying state from URL
  private suppressUpdates = false;

  // Set the navigation callback (to be called from React components)
  setNavigateCallback(_callback: (path: string, options?: { replace?: boolean }) => void) {
    this.navigateCb = _callback;
  }

  // Get URL search parameters (works with HashRouter)
  getSearchParams(): URLSearchParams {
    // HashRouter puts the search after the '#'
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex >= 0) {
      const qs = hash.substring(qIndex + 1);
      return new URLSearchParams(qs);
    }
    // Fallback to standard search if present
    const search = window.location.search || '';
    return new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
  }

  // Get a specific URL parameter
  getParam(key: string): string | null {
    return this.getSearchParams().get(key);
  }

  // Update the URL with new search parameters
  updateUrl(_params: Record<string, string | null>, _options: { replace?: boolean } = {}) {
    if (this.suppressUpdates) return;
    const params = this.getSearchParams();
    // Merge
    Object.entries(_params).forEach(([k, v]) => {
      if (v === null || v === undefined) params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    const path = `?${qs}`;
    if (this.navigateCb) {
      this.navigateCb(path, _options);
    } else {
      // Fallback update for hash routing
      const base = window.location.href.split('#')[0];
      const newHash = `#/${qs ? `?${qs}` : ''}`;
      if (_options.replace) {
        window.history.replaceState(null, '', `${base}${newHash}`);
      } else {
        window.location.hash = `/${qs ? `?${qs}` : ''}`;
      }
    }
  }

  // Encode loadout data into URL parameters
  encodeLoadoutToUrl(loadout: Loadout): Record<string, string> {
    const params: Record<string, string> = {};

    // Encode basic fields
    if (loadout.career) {
      params.career = loadout.career;
    }
    if (loadout.level !== 40) {
      params.level = String(loadout.level);
    }
    if (loadout.renownRank !== 80) {
      params.renownRank = String(loadout.renownRank);
    }

    // Encode items
    Object.entries(loadout.items).forEach(([slot, slotData]: [string, LoadoutItem]) => {
      if (slotData?.item?.id) {
        params[`item.${slot}`] = slotData.item.id;
      }

      // Encode talismans for this slot
      if (slotData?.talismans) {
        slotData.talismans.forEach((talisman, index: number) => {
          if (talisman?.id) {
            params[`talisman.${slot}.${index}`] = talisman.id;
          }
        });
      }
    });

    return params;
  }

  // Encode loadout data with a side prefix (e.g., 'a' or 'b')
  encodeLoadoutToUrlWithPrefix(prefix: 'a' | 'b', loadout: Loadout): Record<string, string> {
    const base = this.encodeLoadoutToUrl(loadout);
    const prefixed: Record<string, string> = {};
    Object.entries(base).forEach(([k, v]) => {
      prefixed[`${prefix}.${k}`] = v;
    });
    return prefixed;
  }

  // Decode URL parameters into loadout data
  decodeLoadoutFromUrl(): {
    career: Career | null;
    level: number;
    renownRank: number;
    items: Record<string, {
      item: { id: string } | null;
      talismans: ({ id: string } | null)[];
    }>;
  } {
    const params = this.getSearchParams();
    const loadout = {
      career: null as Career | null,
      level: 40,
      renownRank: 80,
      items: {} as Record<string, {
        item: { id: string } | null;
        talismans: ({ id: string } | null)[];
      }>
    };

    // Decode basic fields
    const careerParam = params.get('career');
    if (careerParam) {
      loadout.career = careerParam as Career;
    }

    const levelParam = params.get('level');
    if (levelParam) {
      loadout.level = parseInt(levelParam, 10);
    }

    const renownParam = params.get('renownRank');
    if (renownParam) {
      loadout.renownRank = parseInt(renownParam, 10);
    }

    // Decode items and talismans
    for (const [key, value] of params.entries()) {
      if (key.startsWith('item.')) {
        const slot = key.substring(5); // Remove 'item.' prefix
        if (!loadout.items[slot]) {
          loadout.items[slot] = { item: null, talismans: [] };
        }
        loadout.items[slot].item = { id: value };
      } else if (key.startsWith('talisman.')) {
        const parts = key.split('.');
        if (parts.length === 3) {
          const slot = parts[1];
          const index = parseInt(parts[2], 10);
          if (!loadout.items[slot]) {
            loadout.items[slot] = { item: null, talismans: [] };
          }
          if (!loadout.items[slot].talismans[index]) {
            loadout.items[slot].talismans[index] = { id: value };
          } else {
            loadout.items[slot].talismans[index] = { id: value };
          }
        }
      }
    }

    return loadout;
  }

  // Decode prefixed loadout parameters (for compare sides)
  decodeLoadoutFromUrlWithPrefix(prefix: 'a' | 'b'): {
    career: Career | null;
    level: number;
    renownRank: number;
    items: Record<string, {
      item: { id: string } | null;
      talismans: ({ id: string } | null)[];
    }>;
  } | null {
    const params = this.getSearchParams();
    const hasAny = Array.from(params.keys()).some((k) => k.startsWith(`${prefix}.`));
    if (!hasAny) return null;

    const loadout = {
      career: null as Career | null,
      level: 40,
      renownRank: 80,
      items: {} as Record<string, { item: { id: string } | null; talismans: ({ id: string } | null)[] }>,
    };

    const careerParam = params.get(`${prefix}.career`);
    if (careerParam) loadout.career = careerParam as Career;
    const levelParam = params.get(`${prefix}.level`);
    if (levelParam) loadout.level = parseInt(levelParam, 10);
    const renownParam = params.get(`${prefix}.renownRank`);
    if (renownParam) loadout.renownRank = parseInt(renownParam, 10);

    for (const [key, value] of params.entries()) {
      if (key.startsWith(`${prefix}.item.`)) {
        const slot = key.substring(`${prefix}.item.`.length);
        if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
        loadout.items[slot].item = { id: value };
      } else if (key.startsWith(`${prefix}.talisman.`)) {
        const rest = key.substring(`${prefix}.talisman.`.length);
        const parts = rest.split('.');
        if (parts.length === 2) {
          const slot = parts[0];
          const index = parseInt(parts[1], 10);
          if (!loadout.items[slot]) loadout.items[slot] = { item: null, talismans: [] };
          loadout.items[slot].talismans[index] = { id: value };
        }
      }
    }

    return loadout;
  }

  // Update URL with current loadout data
  updateUrlWithLoadout(_loadout: Loadout): void {
    const params = this.encodeLoadoutToUrl(_loadout);
    this.updateUrl({ ...params, mode: null, activeSide: null });
  }

  // Update URL with dual-mode compare data for sides A and B
  updateUrlWithCompare(_aLoadout: Loadout | null, _bLoadout: Loadout | null, _activeSide: 'A' | 'B'): void {
    const params: Record<string, string | null> = {};
    if (_aLoadout) {
      Object.assign(params, this.encodeLoadoutToUrlWithPrefix('a', _aLoadout));
      if (_aLoadout.isFromCharacter && _aLoadout.characterName) params.loadCharacterA = _aLoadout.characterName;
    }
    if (_bLoadout) {
      Object.assign(params, this.encodeLoadoutToUrlWithPrefix('b', _bLoadout));
      if (_bLoadout.isFromCharacter && _bLoadout.characterName) params.loadCharacterB = _bLoadout.characterName;
    }
    this.updateUrl(params, { replace: true });
  }

  // Handle character loading from URL
  async handleCharacterFromUrl(_characterName: string): Promise<void> {
    if (!_characterName) return;
    // Delegate to service; URL updates during load suppressed
    this.suppressUpdates = true;
    try {
      await loadoutService.loadFromNamedCharacter(_characterName);
    } finally {
      this.suppressUpdates = false;
    }
  }

  // Handle loadout loading from URL parameters
  async handleLoadoutFromUrlParams(): Promise<void> {
    const decoded = this.decodeLoadoutFromUrl();
    if (!decoded) return;
    this.suppressUpdates = true;
    try {
      // Apply to active side (default 'A')
      const side: LoadoutSide = 'A';
      const id = await loadoutService.selectSideForEdit(side);
      const char = this.getParam('loadCharacter');
      // Core fields
      loadoutService.setLevelForLoadout(id, decoded.level);
      loadoutService.setRenownForLoadout(id, decoded.renownRank);
      loadoutService.setCareerForLoadout(id, decoded.career);
      if (char) {
        loadoutService.setCharacterStatusForLoadout(id, true, char);
      }
      // Items and talismans
      const itemPromises: Promise<void>[] = [];
      Object.entries(decoded.items).forEach(([slotKey, data]) => {
        const slot = slotKey as unknown as EquipSlot;
        if (data.item?.id) {
          itemPromises.push(
            (async () => {
              const item = await loadoutService.getItemWithDetails(data.item!.id);
              await loadoutService.updateItemForLoadout(id, slot, item);
            })()
          );
        }
        data.talismans.forEach((t, idx) => {
          if (t?.id) {
            itemPromises.push(
              (async () => {
                const tal = await loadoutService.getItemWithDetails(t.id);
                await loadoutService.updateTalismanForLoadout(id, slot, idx, tal);
              })()
            );
          }
        });
      });
      await Promise.all(itemPromises);
      // Ensure URL reflects single loadout form
      this.updateUrlWithLoadout(loadoutStoreAdapter.getLoadoutForSide(side)!);
    } finally {
      this.suppressUpdates = false;
    }
  }

  // Handle dual compare state from URL
  async handleCompareFromUrl(): Promise<void> {
    const params = this.getSearchParams();
    const a = this.decodeLoadoutFromUrlWithPrefix('a');
    const b = this.decodeLoadoutFromUrlWithPrefix('b');
    const keys = Array.from(params.keys());
    const hasSingle = !!(params.get('career') || params.get('level') || keys.some(k => k.startsWith('item.') || k.startsWith('talisman.')) || params.get('loadCharacter'));
    if (!a && !b && !hasSingle) return;
    // Backward-compat: accept activeSide from older links, default to 'A'
    const active = (params.get('activeSide') === 'b' ? 'B' : 'A') as LoadoutSide;
    this.suppressUpdates = true;
    try {
      // Fallback: treat legacy single-mode params as side A
      if (!a && !b && hasSingle) {
        const s = this.decodeLoadoutFromUrl();
        const aId = await loadoutService.selectSideForEdit('A');
        loadoutService.setLevelForLoadout(aId, s.level);
        loadoutService.setRenownForLoadout(aId, s.renownRank);
        loadoutService.setCareerForLoadout(aId, s.career);
        const char = params.get('loadCharacter');
        if (char) loadoutService.setCharacterStatusForLoadout(aId, true, char);
        const tasks: Promise<void>[] = [];
        Object.entries(s.items).forEach(([slotKey, data]) => {
          const slot = slotKey as unknown as EquipSlot;
          if (data.item?.id) {
            tasks.push((async () => {
              const item = await loadoutService.getItemWithDetails(data.item!.id);
              await loadoutService.updateItemForLoadout(aId, slot, item);
            })());
          }
          data.talismans.forEach((t, idx) => {
            if (t?.id) {
              tasks.push((async () => {
                const tal = await loadoutService.getItemWithDetails(t.id);
                await loadoutService.updateTalismanForLoadout(aId, slot, idx, tal);
              })());
            }
          });
        });
        await Promise.all(tasks);
        // Ensure a B loadout exists for compare mode
        loadoutService.ensureSideLoadout('B');
        const aLoadout = loadoutStoreAdapter.getLoadoutForSide('A');
        const bLoadout = loadoutStoreAdapter.getLoadoutForSide('B');
        this.updateUrlWithCompare(aLoadout, bLoadout, 'A');
        return;
      }
      // Apply A
      if (a) {
        const aId = await loadoutService.selectSideForEdit('A');
        loadoutService.setLevelForLoadout(aId, a.level);
        loadoutService.setRenownForLoadout(aId, a.renownRank);
        loadoutService.setCareerForLoadout(aId, a.career);
        const charA = params.get('loadCharacterA');
        if (charA) loadoutService.setCharacterStatusForLoadout(aId, true, charA);
        const tasks: Promise<void>[] = [];
        Object.entries(a.items).forEach(([slotKey, data]) => {
          const slot = slotKey as unknown as EquipSlot;
          if (data.item?.id) {
            tasks.push((async () => {
              const item = await loadoutService.getItemWithDetails(data.item!.id);
              await loadoutService.updateItemForLoadout(aId, slot, item);
            })());
          }
          data.talismans.forEach((t, idx) => {
            if (t?.id) {
              tasks.push((async () => {
                const tal = await loadoutService.getItemWithDetails(t.id);
                await loadoutService.updateTalismanForLoadout(aId, slot, idx, tal);
              })());
            }
          });
        });
        await Promise.all(tasks);
      }
      // Apply B
      if (b) {
        const bId = await loadoutService.selectSideForEdit('B');
        loadoutService.setLevelForLoadout(bId, b.level);
        loadoutService.setRenownForLoadout(bId, b.renownRank);
        loadoutService.setCareerForLoadout(bId, b.career);
        const charB = params.get('loadCharacterB');
        if (charB) loadoutService.setCharacterStatusForLoadout(bId, true, charB);
        const tasks: Promise<void>[] = [];
        Object.entries(b.items).forEach(([slotKey, data]) => {
          const slot = slotKey as unknown as EquipSlot;
          if (data.item?.id) {
            tasks.push((async () => {
              const item = await loadoutService.getItemWithDetails(data.item!.id);
              await loadoutService.updateItemForLoadout(bId, slot, item);
            })());
          }
          data.talismans.forEach((t, idx) => {
            if (t?.id) {
              tasks.push((async () => {
                const tal = await loadoutService.getItemWithDetails(t.id);
                await loadoutService.updateTalismanForLoadout(bId, slot, idx, tal);
              })());
            }
          });
        });
        await Promise.all(tasks);
      }
      // Set active side
      loadoutService.setActiveSide(active);
      // Normalize URL to reflect full compare state
      const aLoadout = loadoutStoreAdapter.getLoadoutForSide('A');
      const bLoadout = loadoutStoreAdapter.getLoadoutForSide('B');
      this.updateUrlWithCompare(aLoadout, bLoadout, active);
    } finally {
      this.suppressUpdates = false;
    }
  }

  // Update URL when character is loaded manually
  updateUrlForCharacter(characterName: string): void {
    this.updateUrl({ loadCharacter: characterName }, { replace: true });
  }

  // Update URL when loadout is modified (replaces the old updateUrlForLoadout)
  updateUrlForCurrentLoadout(): void {
    // Intentionally disabled: URL does not need to update live.
    return;
  }

  // Clear character parameter from URL
  clearCharacterFromUrl(): void {
    // Disabled
    return;
  }

  // Clear all loadout parameters from URL
  clearLoadoutFromUrl(): void {
    const params = this.getSearchParams();
    // Remove all known keys
    const keys = Array.from(params.keys());
    keys.forEach(k => params.delete(k));
    this.updateUrl(Object.fromEntries(params.entries()), { replace: true });
  }

  // Build a shareable URL for current compare state
  buildCompareShareUrl(a: Loadout | null, b: Loadout | null, _active: LoadoutSide): string {
    const base = window.location.href.split('#')[0];
    const params: Record<string, string | null> = {};
    if (a) {
      Object.assign(params, this.encodeLoadoutToUrlWithPrefix('a', a));
      if (a.isFromCharacter && a.characterName) params.loadCharacterA = a.characterName;
    }
    if (b) {
      Object.assign(params, this.encodeLoadoutToUrlWithPrefix('b', b));
      if (b.isFromCharacter && b.characterName) params.loadCharacterB = b.characterName;
    }
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v != null) as [string,string][]).toString();
    return `${base}#/?${qs}`;
  }
}

export const urlService = new UrlService();