/*
  Minimal GraphQL client for dev probes (no Apollo). Uses fetch against the production API.
*/

const ENDPOINT = 'https://production-api.waremu.com/graphql/';

export async function gqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}
