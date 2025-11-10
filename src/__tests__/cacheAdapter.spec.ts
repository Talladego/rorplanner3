import { adaptItemsConnection } from '../services/loadout/cache';
import { Item } from '../types';

describe('adaptItemsConnection', () => {
  const makeNode = (id: string): Partial<Item> => ({ id, name: `Item ${id}`, slot: 'HELM', rarity: 'RARE' } as any);

  it('returns normalized structure when both edges and nodes present', () => {
    const conn: any = {
      pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: 'A', endCursor: 'B' },
      edges: [ { cursor: 'A', node: makeNode('1') }, { cursor: 'B', node: makeNode('2') } ],
      nodes: [ makeNode('1'), makeNode('2') ],
      totalCount: 2,
    };
  const out = adaptItemsConnection(conn)!;
  expect(out.pageInfo?.endCursor).toBe('B');
  expect(out.edges?.length).toBe(2);
  expect(out.nodes?.length).toBe(2);
  });

  it('derives nodes from edges when nodes missing', () => {
    const conn: any = {
      pageInfo: { hasNextPage: false, hasPreviousPage: true, startCursor: 'X', endCursor: 'Y' },
      edges: [ { cursor: 'X', node: makeNode('10') } ],
      totalCount: 1,
    };
  const out = adaptItemsConnection(conn)!;
  expect(out.nodes?.length).toBe(1);
  expect(out.nodes?.[0]?.id).toBe('10');
  });

  it('handles empty connection gracefully', () => {
    const conn: any = { pageInfo: {}, edges: [], nodes: [], totalCount: 0 };
    const out = adaptItemsConnection(conn)!;
    expect(out.nodes).toEqual([]);
    expect(out.pageInfo?.hasNextPage).toBeFalsy();
  });
});
