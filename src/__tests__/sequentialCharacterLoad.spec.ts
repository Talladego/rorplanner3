import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadoutService } from '../services/loadout/loadoutService';
import { loadoutStoreAdapter } from '../store/loadout/loadoutStoreAdapter';
import { GetCharactersDocument, GetCharacterDocument } from '../generated/graphql';

// Mock Apollo client queries to simulate character loads with different delays
vi.mock('../lib/apollo-client', () => {
  return {
    default: {
      query: vi.fn(async ({ query, variables }) => {
        if (query === GetCharactersDocument) {
          // Return a single matching character edge
          return {
            data: {
              characters: {
                edges: [
                  { node: { id: `char-${variables.name.toLowerCase()}`, name: variables.name } },
                ],
              },
            },
          };
        }
        if (query === GetCharacterDocument) {
          const id = variables.id as string;
          // Simulate variable network latency based on id suffix
          const delay = id.includes('alpha') ? 50 : 10; // alpha slower than beta
          await new Promise(r => setTimeout(r, delay));
          return {
            data: {
              character: {
                id,
                name: id.includes('alpha') ? 'Alpha' : 'Beta',
                level: 40,
                renownRank: 80,
                career: 'SLAYER',
                items: [],
              },
            },
          };
        }
        throw new Error('Unexpected query document');
      }),
    },
  };
});

describe('loadoutService sequential character load', () => {
  beforeEach(() => {
    // Reset store between tests
    loadoutStoreAdapter.resetCurrentLoadout();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ensures slower first import does not override side mapping or final character name of faster second import', async () => {
    // Kick off first (slower) character import
  const p1 = loadoutService.loadFromNamedCharacter('Alpha');
    // Shortly after, start second (faster) import
  const p2 = loadoutService.loadFromNamedCharacter('Beta');
  await Promise.allSettled([p1, p2]);

  // Current side loadout should correspond to Beta (faster import) and not be overwritten by Alpha's later completion
    const activeSide = loadoutService.getActiveSide();
    const assignedId = loadoutService.getSideLoadoutId(activeSide);
    const loadouts = loadoutService.getAllLoadouts();
    const assignedLoadout = loadouts.find(l => l.id === assignedId);
    expect(assignedLoadout?.characterName).toBe('Beta');
    expect(assignedLoadout?.isFromCharacter).toBe(true);
    // Alpha provisional should not have replaced final Beta mapping
    const alphaLoadout = loadouts.find(l => l.characterName === 'Alpha');
    if (alphaLoadout) {
      expect(alphaLoadout.id).not.toBe(assignedId);
    }
  });
});
