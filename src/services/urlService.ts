import { Career, Loadout, LoadoutItem } from '../types';

class UrlService {
  // URL handling unplugged; navigate callback disabled
  // Keeping API shape but not storing any callback

  // Set the navigation callback (to be called from React components)
  setNavigateCallback(_callback: (path: string, options?: { replace?: boolean }) => void) {
    // No-op while URL handling is unplugged
    void _callback;
    return;
  }

  // Get URL search parameters (works with HashRouter)
  getSearchParams(): URLSearchParams {
    return new URLSearchParams();
  }

  // Get a specific URL parameter
  getParam(key: string): string | null {
    return this.getSearchParams().get(key);
  }

  // Update the URL with new search parameters
  updateUrl(_params: Record<string, string | null>, _options: { replace?: boolean } = {}) {
    // No-op while URL handling is unplugged
    void _params;
    void _options;
    return;
  }

  // Encode loadout data into URL parameters
  encodeLoadoutToUrl(loadout: Loadout): Record<string, string> {
    const params: Record<string, string> = {};

    // Encode basic fields
    if (loadout.career) {
      params.career = loadout.career;
    }
    params.level = loadout.level.toString();
    params.renownRank = loadout.renownRank.toString();

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
    // No-op while URL handling is unplugged
    void _loadout;
    return;
  }

  // Update URL with dual-mode compare data for sides A and B
  updateUrlWithCompare(_aLoadout: Loadout | null, _bLoadout: Loadout | null, _activeSide: 'A' | 'B'): void {
    // No-op while URL handling is unplugged
    void _aLoadout;
    void _bLoadout;
    void _activeSide;
    return;
  }

  // Handle character loading from URL
  async handleCharacterFromUrl(_characterName: string): Promise<void> {
    // Disabled
    void _characterName;
    return;
  }

  // Handle loadout loading from URL parameters
  async handleLoadoutFromUrlParams(): Promise<void> {
    // Disabled
    return;
  }

  // Handle dual compare state from URL
  async handleCompareFromUrl(): Promise<void> {
    // Disabled
    return;
  }

  // Update URL when character is loaded manually
  updateUrlForCharacter(characterName: string): void {
    this.updateUrl({ loadCharacter: characterName }, { replace: true });
  }

  // Update URL when loadout is modified (replaces the old updateUrlForLoadout)
  updateUrlForCurrentLoadout(): void {
    // Disabled
    return;
  }

  // Clear character parameter from URL
  clearCharacterFromUrl(): void {
    // Disabled
    return;
  }

  // Clear all loadout parameters from URL
  clearLoadoutFromUrl(): void {
    // Disabled
    return;
  }
}

export const urlService = new UrlService();