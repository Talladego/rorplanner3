import { loadoutEventEmitter } from './loadoutEventEmitter';
import { CharacterLoadedFromUrlEvent, LoadoutLoadedFromUrlEvent } from '../types/events';
import { Career, EquipSlot, Loadout, LoadoutItem } from '../types';

class UrlService {
  private navigateCallback: ((path: string, options?: { replace?: boolean }) => void) | null = null;

  // Set the navigation callback (to be called from React components)
  setNavigateCallback(callback: (path: string, options?: { replace?: boolean }) => void) {
    this.navigateCallback = callback;
  }

  // Get URL search parameters
  getSearchParams(): URLSearchParams {
    if (typeof window === 'undefined') {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }

  // Get a specific URL parameter
  getParam(key: string): string | null {
    return this.getSearchParams().get(key);
  }

  // Update the URL with new search parameters
  updateUrl(params: Record<string, string | null>, options: { replace?: boolean } = {}) {
    if (!this.navigateCallback) {
      console.warn('Navigate callback not set for UrlService');
      return;
    }

    const currentParams = this.getSearchParams();

    // Update parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    // Build new URL
    const searchString = currentParams.toString();
    const newPath = searchString ? `/?${searchString}` : '/';

    try {
      this.navigateCallback(newPath, options);
    } catch (error) {
      console.warn('Navigate callback failed, falling back to history API:', error);
      // Fallback to direct history manipulation
      if (typeof window !== 'undefined') {
        if (options.replace) {
          window.history.replaceState(null, '', newPath);
        } else {
          window.history.pushState(null, '', newPath);
        }
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

  // Update URL with current loadout data
  updateUrlWithLoadout(loadout: Loadout): void {
    // If this loadout is from a character, only keep the loadCharacter parameter
    if (loadout.isFromCharacter && loadout.characterName) {
      const params: Record<string, string | null> = {
        loadCharacter: loadout.characterName,
        // Clear all other loadout parameters
        career: null,
        level: null,
        renownRank: null,
      };
      // Clear item and talisman parameters
      const currentParams = this.getSearchParams();
      for (const key of currentParams.keys()) {
        if (key.startsWith('item.') || key.startsWith('talisman.')) {
          params[key] = null;
        }
      }
      this.updateUrl(params, { replace: true });
    } else {
      // For non-character loadouts, use parameterized URL
      const params = this.encodeLoadoutToUrl(loadout);
      // Clear existing loadout-related parameters first
      const clearParams: Record<string, null> = {};
      const currentParams = this.getSearchParams();
      for (const key of currentParams.keys()) {
        if (key === 'career' || key === 'level' || key === 'renownRank' ||
            key.startsWith('item.') || key.startsWith('talisman.') ||
            key === 'loadCharacter') {
          clearParams[key] = null;
        }
      }
      this.updateUrl({ ...clearParams, ...params }, { replace: true });
    }
  }

  // Handle character loading from URL
  async handleCharacterFromUrl(characterName: string): Promise<void> {
    try {
      // Import loadoutService dynamically to avoid circular dependencies
      const { loadoutService } = await import('./loadoutService');

      const characterId = await loadoutService.loadFromNamedCharacter(characterName);

      // Emit event that character was loaded from URL
      const event: CharacterLoadedFromUrlEvent = {
        type: 'CHARACTER_LOADED_FROM_URL',
        payload: {
          characterName,
          characterId,
        },
        timestamp: Date.now(),
      };

      loadoutEventEmitter.emit(event);

      console.log(`Successfully loaded character from URL: ${characterName} (${characterId})`);
    } catch (error) {
      console.error(`Failed to load character from URL "${characterName}":`, error);
      throw error;
    }
  }

  // Handle loadout loading from URL parameters
  async handleLoadoutFromUrlParams(): Promise<void> {
    try {
      // Import loadoutService dynamically to avoid circular dependencies
      const { loadoutService } = await import('./loadoutService');

      const loadoutData = this.decodeLoadoutFromUrl();

      // Reset current loadout to start fresh, or create one if none exists
      const currentLoadout = loadoutService.getCurrentLoadout();
      if (currentLoadout) {
        loadoutService.resetCurrentLoadout();
      } else {
        loadoutService.createLoadout('Loaded from URL', loadoutData.level, loadoutData.renownRank);
      }

      // Apply the loadout data to the current loadout
      if (loadoutData.career) {
        loadoutService.setCareer(loadoutData.career);
      }
      loadoutService.setLevel(loadoutData.level);
      loadoutService.setRenownRank(loadoutData.renownRank);

      // Apply items and talismans
      const itemPromises: Promise<void>[] = [];
      const talismanPromises: Promise<void>[] = [];

      Object.entries(loadoutData.items).forEach(([slot, slotData]) => {
        if (slotData?.item?.id) {
          // Load the complete item details and set it
          itemPromises.push(
            loadoutService.getItemWithDetails(slotData.item.id).then(item => {
              if (item) {
                return loadoutService.updateItem(slot as EquipSlot, item);
              }
            })
          );
        }

        if (slotData?.talismans) {
          slotData.talismans.forEach((talisman: { id: string } | null, index: number) => {
            if (talisman?.id) {
              talismanPromises.push(
                loadoutService.getItemWithDetails(talisman.id).then(completeTalisman => {
                  if (completeTalisman) {
                    return loadoutService.updateTalisman(slot as EquipSlot, index, completeTalisman);
                  }
                })
              );
            }
          });
        }
      });

      // Wait for all items and talismans to be loaded and set
      await Promise.all([...itemPromises, ...talismanPromises]);

      // Emit event that loadout was loaded from URL
      const event: LoadoutLoadedFromUrlEvent = {
        type: 'LOADOUT_LOADED_FROM_URL',
        payload: {
          loadoutId: 'url-params', // Placeholder ID for URL-loaded loadouts
        },
        timestamp: Date.now(),
      };

      loadoutEventEmitter.emit(event);

      console.log(`Successfully loaded loadout from URL parameters`);
    } catch (error) {
      console.error(`Failed to load loadout from URL parameters:`, error);
      throw error;
    }
  }

  // Update URL when character is loaded manually
  updateUrlForCharacter(characterName: string): void {
    this.updateUrl({ loadCharacter: characterName }, { replace: true });
  }

  // Update URL when loadout is modified (replaces the old updateUrlForLoadout)
  updateUrlForCurrentLoadout(): void {
    // Import loadoutService dynamically to avoid circular dependencies
    import('./loadoutService').then(({ loadoutService }) => {
      const currentLoadout = loadoutService.getCurrentLoadout();
      if (currentLoadout) {
        this.updateUrlWithLoadout(currentLoadout);
      }
    });
  }

  // Clear character parameter from URL
  clearCharacterFromUrl(): void {
    this.updateUrl({ loadCharacter: null }, { replace: true });
  }

  // Clear all loadout parameters from URL
  clearLoadoutFromUrl(): void {
    const clearParams: Record<string, null> = {};
    const currentParams = this.getSearchParams();
    for (const key of currentParams.keys()) {
      if (key === 'career' || key === 'level' || key === 'renownRank' ||
          key.startsWith('item.') || key.startsWith('talisman.')) {
        clearParams[key] = null;
      }
    }
    this.updateUrl(clearParams, { replace: true });
  }
}

export const urlService = new UrlService();