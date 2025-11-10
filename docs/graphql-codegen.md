# GraphQL Codegen

This document describes how GraphQL code generation is set up in this repo and how to use the generated artifacts.

## Goals
- Strongly typed query/mutation results & variables.
- Eliminate ad-hoc `any` casts in service layer.
- Centralize documents and fragment reuse.
- Provide future path for persisted queries / operation registry.

## Tooling Choice
Use `@graphql-codegen/cli` with plugins:
- `typescript`
- `typescript-operations`
- `typed-document-node` (to get strongly-typed `DocumentNode` for Apollo Client)
- `typescript-react-apollo` (hooks generation enabled; `withHooks: true`)

## Directory Layout
```
graphql/                             # Source .graphql files (one per operation)
  loadout/
    getCharacters.graphql
    getCharacter.graphql
    getPocketItems.graphql
    getTalismans.graphql
    getItem.graphql
codegen.ts                           # Codegen config (TS for flexibility)
src/generated/graphql.ts             # Generated types + typed documents
```

## Steps
1. Install deps (already added):
   - `@graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typed-document-node`
2. Documents live in `graphql/**/*.graphql` (see layout above). Add new operations there.
3. `codegen.ts`:
```ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/lib/schema.graphql',
  documents: 'graphql/**/*.graphql',
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        immutableTypes: true,
        enumsAsTypes: true,
      },
    },
  },
};
export default config;
```
4. Script: `codegen` is available in `package.json`.
5. Run `npm run codegen`; verify `src/generated/graphql.ts` is produced.
6. Consumers should import typed documents and types (and optional hooks) from `src/generated/graphql.ts`:
```ts
import { GetCharactersDocument, type GetCharactersQuery } from '@/generated/graphql';
const { data } = await client.query({ query: GetCharactersDocument, variables: { name } });
const characters = (data as GetCharactersQuery).characters;
```
Or use generated hooks in components:
```ts
import { useGetCharactersQuery } from '@/generated/graphql';
const { data, loading } = useGetCharactersQuery({ variables: { name } });
```
7. Legacy `src/services/loadout/queries.ts` is deprecated and emptied; don’t import from it.

## Incremental Adoption
- Phase 1: Generate types; keep runtime logic unchanged. (done)
- Phase 2: Replace variable/result shapes in API helpers. (done)
- Phase 3: Remove duplicate local types that mirror schema. (N/A for now)
- Phase 4: Optionally enable hook generation (`@graphql-codegen/typescript-react-apollo`) and move repetitive queries to hooks. (optional)
  (hooks now enabled; adopt gradually where ergonomic)

## CI Integration
- Add `npm run codegen` to pre-build or a separate CI step; fail if git diff shows outdated generated file.
- Optionally add a Husky pre-commit hook to verify generated file is up to date.
- ESLint excludes `@typescript-eslint/no-explicit-any` for `src/generated/**` to avoid noise in generated output.
- Hooks are pure wrappers; prefer service layer for multi-step domain logic or caching, use hooks for direct UI consumption.

## Future Enhancements
- Add fragments for common item fields.
- Persist queries (Apollo operation registry) to reduce payload size.
- Generate JSON schema for validation of incoming GraphQL responses (runtime safety in strict mode).

## Risks & Mitigations
- Large generated file churn: mitigate with fragment reuse.
- Build perf: Codegen runs once; keep it out of hot reload cycle.
- Type widening due to schema changes: rely on strict TS config & PR review.

## Rollback Plan
If issues occur, revert to previous commit; changes are additive and confined to generated artifacts and service imports.

---
Prepared: Codegen can be added when ready; current codebase continues to function unchanged until scripts invoked.
