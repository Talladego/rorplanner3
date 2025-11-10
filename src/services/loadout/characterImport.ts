/* eslint-disable @typescript-eslint/no-explicit-any */
import client from '../../lib/apollo-client';
import { loadoutEventEmitter } from './loadoutEventEmitter';
import { updateUrlIfAuto } from './urlSync';
import { loadoutStoreAdapter } from '../../store/loadout/loadoutStoreAdapter';
import { GetCharactersDocument, GetCharacterDocument, type GetCharactersQuery, type GetCharacterQuery } from '../../generated/graphql';
import { EquipSlot } from '../../types';
import type { Career, Item, LoadoutItem, LoadoutSide } from '../../types';

export interface CharacterImportContext {
  // Side + loadout lifecycle
  getActiveSide(): LoadoutSide;
  ensureSideLoadout(side: LoadoutSide): string;
  createLoadout(name: string, level?: number, renownRank?: number, isFromCharacter?: boolean, characterName?: string): string;
  assignSideLoadout(side: LoadoutSide, loadoutId: string | null): void;
  switchLoadout(id: string): Promise<void> | void;

  // Per-loadout setters
  setLevelForLoadout(loadoutId: string, level: number): void;
  setRenownForLoadout(loadoutId: string, renownRank: number): void;
  setLoadoutNameForLoadout(loadoutId: string, name: string): void;
  setCareerForLoadout(loadoutId: string, career: Career | null): void;
  resetRenownAbilitiesForLoadout(loadoutId: string): void;

  // Item/talisman mutations
  updateItemForLoadout(loadoutId: string, slot: EquipSlot, item: Item | null): Promise<void> | void;
  updateItem(slot: EquipSlot, item: Item | null): Promise<void> | void;
  updateTalismanForLoadout(loadoutId: string, slot: EquipSlot, index: number, talisman: Item | null): Promise<void> | void;
  updateTalisman(slot: EquipSlot, index: number, talisman: Item | null): Promise<void> | void;

  // Bulk apply guard
  beginBulkApply(): void;
  endBulkApply(): void;
}

/**
 * Load data from a character name and import into a provisional loadout.
 * Kept as a pure function with a small facade context to avoid tight coupling.
 */
export async function loadFromNamedCharacter(ctx: CharacterImportContext, characterName: string) {
  const { data } = await client.query({ query: GetCharactersDocument, variables: { name: characterName } });
  const characters = (data as GetCharactersQuery).characters?.edges?.map(e => e.node) || [];
  if (characters.length === 0) throw new Error(`Character "${characterName}" not found. Please check the spelling and try again.`);
  const character = characters[0];

  const side = ctx.getActiveSide();
  ctx.ensureSideLoadout(side);

  // Create a provisional loadout immediately so UI reflects the new character name while details load
  const provisionalId = ctx.createLoadout(`Imported from ${character.name}`, 40, 80, true, character.name);
  ctx.assignSideLoadout(side, provisionalId);
  await ctx.switchLoadout(provisionalId);

  // Import into the provisional loadout without re-assigning side/current mapping
  await importFromCharacter(ctx, character.id, side, { preCreatedLoadoutId: provisionalId });

  // Emit event that character was loaded
  loadoutEventEmitter.emit({
    type: 'CHARACTER_LOADED',
    payload: { characterName, characterId: character.id },
    timestamp: Date.now(),
  });

  return character.id;
}

/**
 * Import character data by id into either a provided provisional loadout or a newly created one.
 * Applies items and talismans while guarding against races when multiple imports occur in quick succession.
 */
export async function importFromCharacter(
  ctx: CharacterImportContext,
  characterId: string,
  side?: LoadoutSide,
  opts?: { preCreatedLoadoutId?: string },
): Promise<string> {
  ctx.beginBulkApply();
  try {
    const targetSide = side ?? ctx.getActiveSide();
    const { data } = await client.query({ query: GetCharacterDocument, variables: { id: characterId } });
    const character = (data as GetCharacterQuery).character;
    if (!character) throw new Error('Character not found');

    // Transform character data into loadout format
    const items: Record<EquipSlot, LoadoutItem> = (Object.values as unknown as <T>(o: T) => Array<T[keyof T]>)(EquipSlot).reduce((acc, slot) => {
      acc[slot as EquipSlot] = { item: null, talismans: [] } as LoadoutItem;
      return acc;
    }, {} as Record<EquipSlot, LoadoutItem>);

    if (character.items && Array.isArray(character.items)) {
      character.items.forEach(({ equipSlot, item, talismans }: any) => {
        if (typeof equipSlot === 'string' && equipSlot.startsWith('TROPHY')) return;
        if (item) {
          items[equipSlot as EquipSlot] = {
            item: {
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              slot: item.slot,
              rarity: item.rarity,
              armor: item.armor,
              dps: item.dps,
              speed: item.speed,
              levelRequirement: item.levelRequirement,
              renownRankRequirement: item.renownRankRequirement,
              itemLevel: item.itemLevel,
              uniqueEquipped: item.uniqueEquipped,
              stats: item.stats ? item.stats.map((s: any) => ({ stat: s.stat, value: s.value, percentage: s.percentage })) : [],
              careerRestriction: item.careerRestriction,
              raceRestriction: item.raceRestriction,
              iconUrl: item.iconUrl,
              talismanSlots: item.talismanSlots,
              itemSet: item.itemSet,
              abilities: item.abilities,
              buffs: item.buffs,
            },
            talismans: talismans && Array.isArray(talismans) ? talismans.map((t: any) => t ? {
              id: t.id,
              name: t.name,
              description: t.description,
              type: t.type,
              slot: t.slot,
              rarity: t.rarity,
              armor: t.armor,
              dps: t.dps,
              speed: t.speed,
              levelRequirement: t.levelRequirement,
              renownRankRequirement: t.renownRankRequirement,
              itemLevel: t.itemLevel,
              uniqueEquipped: t.uniqueEquipped,
              stats: t.stats ? t.stats.map((s: any) => ({ stat: s.stat, value: s.value, percentage: s.percentage })) : [],
              careerRestriction: t.careerRestriction,
              raceRestriction: t.raceRestriction,
              iconUrl: t.iconUrl,
              talismanSlots: t.talismanSlots,
              itemSet: t.itemSet,
              abilities: t.abilities || [],
              buffs: t.buffs || [],
            } : null) : [],
          } as LoadoutItem;
        }
      });
    }

    // Use provided provisional loadout if available; otherwise create and assign/switch
    let loadoutId = opts?.preCreatedLoadoutId;
    if (!loadoutId) {
      loadoutId = ctx.createLoadout(`Imported from ${character.name}`, character.level, character.renownRank, true, character.name);
      ctx.assignSideLoadout(targetSide, loadoutId);
      await ctx.switchLoadout(loadoutId);
    } else {
      // Update the provisional with actual level/renown and name now that we have details
      ctx.setLevelForLoadout(loadoutId, character.level);
      ctx.setRenownForLoadout(loadoutId, character.renownRank);
      try {
        const lo = loadoutStoreAdapter.getLoadouts().find(l => l.id === loadoutId);
        const targetName = `Imported from ${character.name}`;
        if (!lo || lo.name !== targetName) {
          ctx.setLoadoutNameForLoadout(loadoutId, targetName);
        }
      } catch {
        // non-fatal
      }
    }

    // Set career directly on the target loadout (avoid race where current loadout switches mid-import)
    ctx.setCareerForLoadout(loadoutId, character.career as Career);

    // Clear any existing renown allocation explicitly for imported characters
    ctx.resetRenownAbilitiesForLoadout(loadoutId);

    // Set items (skip trophy slots). Skip incompatible slots instead of aborting entire import.
    const skipped: Array<{ slot: string; itemId?: string; reason: string }> = [];
    const useExplicitLoadoutMutations = !!opts?.preCreatedLoadoutId;
    for (const [slot, loadoutItem] of Object.entries(items)) {
      if (slot.startsWith('TROPHY')) continue;
      try {
        if ((loadoutItem as LoadoutItem).item) {
          if (useExplicitLoadoutMutations) {
            await ctx.updateItemForLoadout(loadoutId!, slot as EquipSlot, (loadoutItem as LoadoutItem).item!);
          } else {
            await ctx.updateItem(slot as EquipSlot, (loadoutItem as LoadoutItem).item!);
          }
        }
        if ((loadoutItem as LoadoutItem).item && (loadoutItem as LoadoutItem).talismans && Array.isArray((loadoutItem as LoadoutItem).talismans)) {
          for (let index = 0; index < (loadoutItem as LoadoutItem).talismans.length; index++) {
            const talisman = (loadoutItem as LoadoutItem).talismans[index];
            if (talisman) {
              if (useExplicitLoadoutMutations) {
                await ctx.updateTalismanForLoadout(loadoutId!, slot as EquipSlot, index, talisman);
              } else {
                await ctx.updateTalisman(slot as EquipSlot, index, talisman);
              }
            }
          }
        }
      } catch (e: unknown) {
        const reason = (e && (e as Error).message) ? (e as Error).message : 'Unknown error';
        skipped.push({ slot, itemId: (loadoutItem as LoadoutItem).item?.id, reason });
        // Continue importing remaining slots
        console.warn(`[characterImport] Skipping slot ${slot} item ${(loadoutItem as LoadoutItem).item?.id ?? 'n/a'}: ${reason}`);
      }
    }
    if (skipped.length > 0) {
      console.info('[characterImport] Completed with skipped slots:', skipped);
    }

    // Mark as loaded from character and ensure side mapping (guard for stale import completion)
    loadoutStoreAdapter.updateLoadoutCharacterStatus(loadoutId, true, character.name);
    const currentlyAssigned = loadoutStoreAdapter.getSideLoadoutId(targetSide);
    if (currentlyAssigned === loadoutId) {
      loadoutStoreAdapter.setSideCareerLoadoutId(targetSide, character.career as Career, loadoutId);
    } else {
      console.info('[characterImport] Skipping side-career mapping update for stale import', { targetSide, loadoutId, currentlyAssigned });
    }

    return loadoutId;
  } finally {
    ctx.endBulkApply();
    // End import guard and update URL once
    updateUrlIfAuto(false);
  }
}
