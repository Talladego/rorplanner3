# Dev Probe Scripts (temporary)

This folder holds throwaway developer scripts for probing the GraphQL API and exploring data models while working on the app.

Requirements:
- Node.js 18+
- `npx tsx` for running TypeScript without a build step (already used in package.json)

Environment:
- Uses the same production GraphQL endpoint as the app: https://production-api.waremu.com/graphql/

## Example: List JEWELLERY3-compatible talismans

Run:

```
npm run probe:jewellery3-talismans
```

This will print a sample of talismans (type ENHANCEMENT) that can be socketed into JEWELLERY3-equivalent slots, ordered by rarity and item level.

## Create new probes

- Copy an existing script, or create a new `scripts/probe-*.ts` file.
- Use the `gqlRequest` helper from `scripts/gqlClient.ts`.
- Keep scripts focused and ephemeral; these are not part of the production app.
