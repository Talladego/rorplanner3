# RorPlanner

A modern, high‑performance planner for Warhammer Online: Return of Reckoning character equipment, talismans, renown abilities, and side‑by‑side stat comparison. Built with React 19, TypeScript 5, Vite 7, Tailwind CSS 4, Apollo Client 4, and GraphQL code generation.

## Features

- ⚔️ Equipment & talisman planning for all careers (eligibility + unique‑equipped enforcement)
- ⭐ Renown planner with caps, per‑ability levels (0–5), packed share encoding
- 🔁 Dual A/B compare with per‑side career mapping and provisional character import (no name flicker)
- 📊 Real‑time stat aggregation (items, sets, talismans, renown, derived; multiplicative combinations for damage/healing modifiers)
- 🪄 Collapsible stat sections and Offense subsections (Melee / Ranged / Magic) with chevron toggles
- 🔍 Interactive equipment selector with pagination, filters, and LRU item details cache
- 🧪 Typed GraphQL DocumentNodes via codegen – no manual `gql` strings in runtime code
- 🚀 Lazy‑loaded heavy panels (StatsComparePanel, RenownPanel, EquipmentSelector, Summary modal)
- 🧩 Manual vendor chunking for faster initial load (react‑vendor, apollo, graphql, zustand, tooltip)
- � Tailwind layered UI (Tier 0–3 design system) with dark palette
- �️ Race‑safe sequential character imports (slower prior import cannot override a faster later one)
- 🧭 Optional URL auto‑sync and navigation handling (disabled by default; feature‑flagged)

## Tech Stack

- React 19 + TypeScript 5
- Vite 7 (custom manualChunks)
- Tailwind CSS 4
- Zustand 5 + service façade + event emitter
- Apollo Client 4 + GraphQL 16 + Codegen (typed‑document‑node)
- Vitest 2 (unit tests & regression guards)
- ESLint 9 + TypeScript ESLint + React Hooks plugin

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1) Clone and install

```bash
git clone <repository-url>
cd rorplanner3
npm install
```

2) Generate typed GraphQL documents (needed after adding/modifying `.graphql` files)

```bash
npm run codegen
```

3) Start the dev server

```bash
npm run dev -- --host
```

Open http://localhost:3001

Notes:
- HashRouter is used; state lives after `#/?`.
- URL auto‑update and back/forward parsing are disabled by default. You can enable them via `urlService.setAutoUpdateEnabled(true)` and `urlService.setNavigationHandlingEnabled(true)`.

### Build for Production

```bash
npm run build
```

## Project Layout (key paths)

```
graphql/                # Source GraphQL operation documents (.graphql)
src/generated/          # Auto-generated TS + typed DocumentNodes (via codegen)
src/components/         # UI (panels, selectors, stats, summary modal, toolbar, tooltip blocks)
src/constants/          # Career base stats, icons, weapon rules, stat maps, UI constants
src/services/loadout/   # Domain façade + integration + events + URL + stats
src/store/loadout/      # Zustand store, actions, selectors, adapter (pure state layer)
src/utils/              # Derived stats, formatting, comparison helpers
src/types/              # Core application & event types
vite.config.ts          # Build + chunk strategy
codegen.ts              # GraphQL codegen configuration
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start Vite dev server (port 3001) |
| `build` | Production build (code‑split + optimized chunks) |
| `preview` | Preview the production build locally |
| `lint` / `lint:fix` | ESLint analysis / auto‑fix |
| `typecheck` | TypeScript project check (no emit) |
| `check` | Combined lint + typecheck gate |
| `test` / `test:watch` | Run Vitest suite |
| `codegen` | Regenerate typed GraphQL docs from `graphql/**/*.graphql` |
| `generate:base-stats` | Rebuild career base stats generated file |
| `probe:*` | One‑off debug scripts for item/talisman investigation |

### Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run check && npm test
```

## Deploying to Cloudflare Pages

Cloudflare Pages is a fast, free static hosting platform with a global CDN. This project is preconfigured for it:
- Vite base: `/` (see `vite.config.ts`)
- Build command: `npm run build`
- Output directory: `dist`

Setup:

1. Push your repository to GitHub.
2. Cloudflare Dashboard → Pages → Create a project → Connect to GitHub → select this repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Save and deploy.

Custom domain: Add your domain in Pages → Custom domains and follow DNS prompts. SSL is automatic.

## Architecture

### Layer Overview

| Layer | Location | Responsibilities | Forbidden |
|-------|----------|------------------|-----------|
| Presentation | `src/components`, `src/hooks` | Render UI, call façade, subscribe to typed events | Direct store/event emitter imports |
| Service Façade | `src/services/loadout/*` | Business rules (eligibility, unique‑equipped, set bonuses, stat aggregation), GraphQL fetching, URL encode/decode, events | React imports |
| Store (Data) | `src/store/loadout/*` | Pure state container & sync mutations | Network, URL, business orchestration |
| Generated GraphQL | `graphql/**/*.graphql` → `src/generated/graphql.ts` | Strongly typed operations & documents | Manual `gql` strings elsewhere |
| Types | `src/types/*` | Shared enums/interfaces + event contracts | Business logic |

### Notable Behaviors

- Provisional loadout created immediately on character import to avoid name flicker; final details populate in place.
- Race‑safe character import: stale completion will not hijack current side mapping.
- Unique‑equipped enforcement blocks duplicates across slots in the same loadout.
- Stat rows compute effective multiplicative percentages for outgoing/incoming damage and outgoing healing.
- Collapsible sections & subsections (Offense) with Chevron icons; spacing consistent with section headers.

### Key Modules

- `loadoutService.ts` – façade & orchestration
- `urlService.ts` – hash param parsing, compact encoding, packed renown abilities
- `stats.ts` – aggregate + contribution breakdown
- `api.ts` / `cache.ts` – item/talisman fetch + LRU + in‑flight dedupe
- `mutations.ts` – thin mutation wrappers separating event emission from per‑loadout updates
- `loadoutEventEmitter.ts` – minimal pub/sub bus
- `loadoutStoreAdapter.ts` – decouples façade from Zustand implementation
- `statMaps.ts` – enum→summary key mapping
- `generated/graphql.ts` – typed DocumentNodes
 - `equipmentValidation.ts` – centralized item & talisman eligibility (level, renown, race, duplicates, slot rules) + validation guards
 - `loadoutMutations.ts` – per‑loadout setters (career, level, renown rank, name, character status) kept pure; façade emits events
 - `characterImport.ts` – sequential, race‑safe character import flow (provisional loadout creation, stale import protection)
 - `statsFacade.ts` – higher‑level stat recomputation + event emission + bulk apply handling (wraps lower‑level `stats.ts` aggregation)

### Event‑driven Flow

1. Component calls façade (e.g. `loadoutService.updateItem(slot, item)`).
2. Façade validates and mutates store via adapter, emits domain events.
3. Subscribers update (e.g., `StatsComparePanel` recomputes on `STATS_UPDATED`).

### Performance & Bundling

- Manual vendor chunking in `vite.config.ts` groups react‑vendor, apollo, graphql, zustand, tooltip, plus a generic vendor chunk.
- Generated GraphQL documents isolated into a `generated` chunk.
- Heavy UI panels lazy‑loaded to shrink initial `index` bundle (~130 kB at time of writing).
- LRU caching + in‑flight dedupe reduce duplicate item/talisman fetches.

### URL Share Format (Hash Params)

| Param | Meaning |
|-------|---------|
| `a.*` / `b.*` | Side A/B loadout encoded values |
| `a.c` / `b.c` | Career (base‑36 index) |
| `a.l` / `b.l` | Level |
| `a.r` / `b.r` | Renown Rank |
| `a.ra` / `b.ra` | Packed renown abilities (3 bits/ability) |
| `a.i.<slot>` | Item id equipped in slot (slot monikers like `mh`, `bd`, `j3`) |
| `a.t.<slot>.<n>` | Talisman id in slot position n |
| `s` | Stats bitmask: bit0=Career stats, bit1=Renown stats, bit2=Derived stats |

Trophy slots are omitted from encoding.

## Contributing

1. Create a branch.
2. If you add/modify GraphQL operations, run `npm run codegen`.
3. Implement changes (put orchestration/validation in `src/services/loadout/`; keep store mutations pure).
4. Add/adjust tests for new logic or regressions (Vitest).
5. Run `npm run check && npm test`.
6. Ensure README and comments reflect any architectural changes.

Boundary guardrails:

- Components never import the raw store or event emitter—only the façade (`loadoutService`).
- Store is pure (no network, URL, or React imports).
- Service may orchestrate, fetch, compute, and emit, but must not import React.
- GraphQL queries live only in `graphql/` (codegen produces `src/generated/graphql.ts`).

## License

MIT

## Tablet Roadmap (Future Work / Not Implemented)

Target: optional tablet‑friendly mode for iPad/Android tablets; desktop remains the primary target.

- Viewport/breakpoints: tablet at ~1024–1280px; consider `ScaleToFit` on tablet widths.
- Layout: tabs for dual compare (A|B); single‑column equipment grid with sticky header; collapsible sections in stats.
- Touch: min 44px touch targets; replace hover‑only tooltips with tap/expand blocks.
- Overlays: selector as full‑screen sheet; ensure portals avoid scroll‑jank.
- Performance: defer icon preloads on cellular; lazy‑load heavy panels; memoize rows.
- QA: iPad Safari/Chrome and Android Chrome across orientations.

This roadmap documents potential enhancements only; no implementation is currently planned.
