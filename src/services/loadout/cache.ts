// Lightweight in-memory LRU cache for list queries to speed up first open,
// page changes, and repeat identical opens within the session.
type ListKey = string;
// Minimal GraphQL connection shape we care about
type PageInfo = {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};
type ConnectionNode = {
  iconUrl?: string | null;
  // Allow extra fields without typing everything
  [key: string]: unknown;
};
export type ListConnection = {
  nodes?: ConnectionNode[];
  edges?: Array<{ cursor: string; node: ConnectionNode }>;
  pageInfo?: PageInfo;
  totalCount?: number;
} | null;

// Adapter: normalize a generated ItemsConnection (readonly arrays, maybe-null values)
// into our cache ListConnection shape with mutable arrays and defined pageInfo keys
// Use a structural type to avoid importing generated types here
type ItemsEdgeLike = { cursor: string; node: ConnectionNode };
type ItemsConnectionLike = {
  edges?: readonly ItemsEdgeLike[] | null;
  nodes?: readonly ConnectionNode[] | null;
  pageInfo?: {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  } | null;
  totalCount?: number | null;
} | null | undefined;

export function adaptItemsConnection(conn: ItemsConnectionLike): ListConnection {
  if (!conn) return { nodes: [], edges: [], pageInfo: {}, totalCount: 0 };
  const edges = Array.isArray(conn.edges) ? conn.edges.map((e) => ({ cursor: e.cursor, node: e.node })) : [];
  let nodes = Array.isArray(conn.nodes) ? [...conn.nodes] : [];
  // If nodes missing but edges present, derive nodes from edges for convenience
  if ((nodes == null || nodes.length === 0) && edges.length > 0) {
    nodes = edges.map((e) => e.node);
  }
  const pageInfo = conn.pageInfo ? {
    hasNextPage: !!conn.pageInfo.hasNextPage,
    hasPreviousPage: !!conn.pageInfo.hasPreviousPage,
    startCursor: conn.pageInfo.startCursor ?? null,
    endCursor: conn.pageInfo.endCursor ?? null,
  } : {};
  const totalCount = typeof conn.totalCount === 'number' ? conn.totalCount : 0;
  return { edges, nodes, pageInfo, totalCount };
}
type ListValue = ListConnection; // alias for cache value
const LIST_CACHE_LIMIT = 100; // keep recent combos/pages
const listCache = new Map<ListKey, ListValue>();

interface ListKeyVars {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  hasStats?: unknown;
  usableByCareer?: unknown;
  where?: unknown;
}

export function makeListKey(prefix: 'items' | 'talismans', vars: Record<string, unknown>): ListKey {
  const { first, after, last, before, hasStats, usableByCareer, where } = vars as ListKeyVars;
  return `${prefix}|f:${first ?? ''}|a:${after ?? ''}|l:${last ?? ''}|b:${before ?? ''}|s:${JSON.stringify(hasStats ?? [])}|c:${String(usableByCareer ?? '')}|w:${JSON.stringify(where ?? {})}`;
}

export function getFromListCache(key: ListKey): ListValue | undefined {
  const hit = listCache.get(key);
  if (hit !== undefined) {
    listCache.delete(key);
    listCache.set(key, hit);
  }
  return hit;
}

export function setInListCache(key: ListKey, value: ListValue): void {
  listCache.set(key, value);
  if (listCache.size > LIST_CACHE_LIMIT) {
    const firstKey = listCache.keys().next().value as string | undefined;
    if (firstKey) listCache.delete(firstKey);
  }
}

// Best-effort: warm browser cache for icon URLs present in a result set
export function warmIconCacheFromConnection(connection: { nodes?: ConnectionNode[] } | null | undefined) {
  try {
    const nodes: ConnectionNode[] = (connection?.nodes ?? []) as ConnectionNode[];
    nodes.forEach((n: ConnectionNode) => {
      const url = n.iconUrl;
      if (typeof url === 'string' && url.startsWith('http')) {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = url;
      }
    });
  } catch {
    // ignore
  }
}
