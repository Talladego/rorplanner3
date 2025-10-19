# RorPlanner

A modern React application for planning character equipment and renown loadouts in Warhammer Online: Return of Reckoning, built with Vite, TypeScript, and Tailwind CSS.

## Features

- ⚔️ Equipment planning for all character classes
- ⭐ Renown planner with icons, tooltips, capped levels, and point budget
- 🔁 Dual A/B loadout compare with side assignment
- 🎨 Dark/Light theme support
- 🔍 Interactive equipment selection
- 📊 Real-time stat calculations (items, talismans, set bonuses, renown, derived)
- 🎯 Responsive design
- 🚀 Fast development with Vite

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rorplanner3
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev -- --host
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

Notes:
- The app uses a hash router. Deep-link parameters appear after the `#`.
- URL auto-update and navigation parsing are feature-flagged and off by default (see `urlService` in `App.tsx`).

### Build for Production

```bash
npm run build
```

Project layout (key paths):

src/
├── components/                      # React UI (panels, selectors, stats, summary, toolbar, tooltip)
├── constants/                       # Local constants (base stats, icons, stat maps)
├── hooks/                           # Presentation hooks
├── lib/                             # Apollo Client configuration
├── providers/                       # ApolloProvider, ErrorBoundary, etc.
├── services/
│   └── loadout/                     # Service layer (domain façade + integration + events)
│       ├── loadoutService.ts        # Main façade (business rules, URL updates, events)
│       ├── loadoutEventEmitter.ts   # Typed pub/sub (internal)
│       ├── urlService.ts            # URL encode/decode for dual compare (includes renown)
│       ├── urlSync.ts               # Guarded URL auto-update helper
│       ├── queries.ts               # Centralized GraphQL documents
│       ├── mutations.ts             # Store mutations used by the façade
│       ├── api.ts                   # Data fetchers (items, talismans, details)
│       ├── cache.ts                 # Lightweight LRU/in-flight cache
│       ├── stats.ts                 # Compute totals + contribution breakdowns
│       ├── selectors.ts             # Service-level selectors
│       ├── filters.ts               # Allowed stat filters + sanitizers for queries
│       └── renownConfig.ts          # Renown ability metadata (labels, caps, icons, totals)
├── store/
│   └── loadout/                     # Zustand store and adapter
│       ├── state.ts                 # Initial state and factories
│       ├── actions.ts               # Mutators and calculations
│       ├── selectors.ts             # Pure selectors
│       ├── loadoutStore.ts          # Store composition
│       └── loadoutStoreAdapter.ts   # Thin adapter used by Service
├── types/                           # TypeScript types and events
└── App.tsx                          # Main application component

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- Dev probes (optional):
	- `npm run probe:jewellery3-talismans`
	- `npm run probe:item`
	- `npm run probe:item-buffs`
	- `npm run probe:ability`
	- `npm run probe:items-by-name`
	- `npm run probe:items-outgoing-damage`
	- `npm run probe:items-outgoing-damage-any`

## Contributing
## License

This project is licensed under the MIT License.
## Deploying to Cloudflare Pages

Cloudflare Pages is a fast, free static hosting platform with a global CDN. This project is preconfigured for it:
- Vite base: `/` (see `vite.config.ts`)
- Build command: `npm run build`
- Output directory: `dist`

Setup steps:

1. Push your repository to GitHub.
2. In Cloudflare Dashboard → Pages → Create a project → Connect to GitHub → select this repo.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Save and deploy.

Custom domain: Add your domain in Pages → Custom domains and follow DNS prompts. SSL is automatic.

## Architecture


- Presentation (React components and hooks)
	- Location: `src/components`, `src/hooks`
	- Responsibilities: Render UI, handle user interactions, subscribe to domain events, and call Service methods.
	- Must not import the store or event emitter directly. Use `loadoutService` as the façade.
- Service (Domain orchestration, integration, events)
	- Responsibilities: Orchestrate domain operations, apply business rules (eligibility, unique-equipped, set bonuses, stat calc), fetch data via GraphQL, encode/decode URL state, and emit typed events.
	- Location: `src/services/loadout/*`
	- Submodules:
		- `queries.ts`: All GraphQL documents.
		- `api.ts`: Fetchers (items, talismans, details) with caching and prefetch.
		- `stats.ts`: Compute totals and per-stat contribution breakdowns.
		- `events.ts`: Subscribe to single/all event types.
		- `urlService.ts`: URL encode/decode, including renown ability levels in share links.
		- `urlSync.ts`: Guarded URL auto-update helper.
		- `renownConfig.ts`: Renown metadata and caps used by UI and stats.
	- Talks to Data via `loadoutStoreAdapter` (no React imports here) and emits events using `loadoutEventEmitter`.

- Data (State and pure data transforms)
	- Location: `src/store/loadout`
	- Responsibilities: Hold and mutate state using Zustand; expose a thin adapter `loadoutStoreAdapter` to decouple the store from the Service/Presentation layers.
	- Must not import from Service. The adapter is called by the Service; components must not call the store directly.

- Types and Events
	- Location: `src/types` and `src/types/events.ts`
	- Responsibilities: Centralize TypeScript enums, interfaces, and the typed event contracts the Service emits.

### Event-driven flow

1) A component invokes a Service method (e.g., `loadoutService.updateItem(...)`).
2) The Service updates state via the adapter (`loadoutStoreAdapter.setItem(...)`) and emits domain events (e.g., `ITEM_UPDATED`, `STATS_UPDATED`).
3) Components subscribe via `loadoutService.subscribeToEvents` or `subscribeToAllEvents` and re-render accordingly.

This keeps UI reactive without coupling components to the store internals.

### Key files

- `src/services/loadout/loadoutService.ts`: Main façade for domain ops and event emissions.
- `src/services/loadout/loadoutEventEmitter.ts`: Minimal pub/sub used internally by the Service.
- `src/services/loadout/queries.ts`: Centralized GraphQL documents.
- `src/services/loadout/api.ts`: Data fetchers for items/talismans/item details.
- `src/services/loadout/cache.ts`: LRU list cache and icon pre-warm.
- `src/services/loadout/stats.ts`: Stats aggregation and contribution logic.
- `src/services/loadout/events.ts`: Event subscription helpers for components.
- `src/services/loadout/urlService.ts`: URL encode/decode for dual-compare, including renown; feature flags for auto-update and navigation parsing.
- `src/services/loadout/urlSync.ts`: Guarded URL auto-update helper.
- `src/services/loadout/renownConfig.ts`: Renown ability metadata used by UI and stats.
- `src/constants/statMaps.ts`: Mapping between GraphQL stat enums and summary keys.
- `src/store/loadout/loadoutStore.ts`: Zustand store composition.
- `src/store/loadout/loadoutStoreAdapter.ts`: Adapter the Service uses to read/write store state.
- `src/lib/apollo-client.ts`: Apollo client setup for GraphQL.

### UI tiering (design system)

- Tier 0: App background, black (`--background`)
- Tier 1: Panels with colored outer frame, dark panel background (`.panel-container` + `.panel-border-*`)
- Tier 2: Dashed inner containers with medium grey background (`.field-group`)
- Tier 3: Detail elements with solid borders and dark grey background (`.equipment-slot`, `.talisman-slot`, `.icon-frame`)

Conventions:
- Equipment selector modal is a Tier 1 panel with blue border containing a Tier 2 group; item rows are Tier 3.
- Equipment side panels (A/B) are Tier 1; inner content is a single Tier 2 container; slots and renown rows are Tier 3.
- Compare Stats panel: Tier 1 (blue) with a single Tier 2 container; no inner Tier 1.

### Boundary rules (do/don't)

- Components:
	- Do call `loadoutService` methods and subscribe with `loadoutService.subscribeToEvents`.
	- Don’t import `useLoadoutStore` or `loadoutEventEmitter` directly.

- Service:
	- Do call `loadoutStoreAdapter` for state reads/writes and emit typed events.
	- Don’t import React or hooks; don’t render UI.

- Store:
	- Do keep state and pure transformations (no network, no URL, no business orchestration).
	- Don’t import Service; no cyclic deps.

### Typical interaction example

- Selecting an item in the UI:
	- `EquipmentSelector` → `loadoutService.getItemWithDetails(id)` → `services/loadout/api.getItemWithDetailsApi` via the façade (LRU/in-flight dedupe wrapper).
	- `loadoutService.updateItem(slot, item)` → `loadoutStoreAdapter.setItem(...)` → emit `ITEM_UPDATED` → recompute → emit `STATS_UPDATED`.
	- `StatsComparePanel` listens via Service subscription helpers to update its view.

### Contributor checklist to preserve boundaries

## Housekeeping

- Prefer `src/services/loadout/queries.ts` as the single source for GraphQL documents. Avoid scattering `gql` outside this module unless strictly scoped to a local API call.

- URL feature flags (in `urlService`):
	- `setAutoUpdateEnabled(boolean)`: Enable/disable mutation of the URL in response to state changes.
	- `setNavigationHandlingEnabled(boolean)`: Enable/disable parsing the URL on navigation changes after initial load.
	- `setNavigateCallback(fn)`: Injected from React Router to perform updates.

- Share links include renown ability levels: `a.renown.<ability>=<level>` and `b.renown.<ability>=<level>`. These are applied when loading from the URL.

- When adding a feature:
	- Put domain logic in the Service (and its submodules).
	- Keep the Store focused on state shape and pure calculations only.
	- Subscribe to changes via Service; never from components to the store directly.
	- Emit/handle typed events defined in `src/types/events.ts`.

## Tablet roadmap (future work)

Target: optional tablet-friendly mode for iPad/Android tablets; desktop remains the primary target. No current commitment; captured here for future work.

- Viewport and breakpoints
	- Add tablet breakpoints around 1024–1280px. Consider enabling `ScaleToFit` only on tablet widths to avoid layout reflow.
	- Maintain 1440 desktop canvas; tablet uses single-column or stacked sections as needed.

- Layout adaptations
	- Dual compare (A/B): switch to tabs on tablet (A | B) instead of side-by-side panels.
	- Equipment grid: single column with sticky header; Tier 2 containers continue to flex-fill vertically.
	- Stats panel: collapsible sections to reduce scroll; keep the outer Tier 1 + inner Tier 2 contract.

- Touch ergonomics
	- Minimum touch target 44px; increase spacing for filters, pagination, and A/B toggles.
	- Replace hover-only tooltips with tap-hold or inline expandable info blocks using the existing `HoverTooltip` API with a touch trigger.

- Modals and overlays
	- Equipment selector becomes a full-screen sheet on tablet; avoid viewport overflow. Keep Tier 1 (blue) wrapper with a single Tier 2 content group.
	- Ensure portals for tooltips/menus use fixed positioning and avoid scroll-jank.

- Performance considerations
	- Defer preloading of large icon sets on cellular. Lazy-load heavy panels; memoize list rows (virtualization optional if needed).
	- Ensure GraphQL requests batch and cache effectively on slower networks.

- QA matrix
	- iPad (10/11/12.9) Safari/Chrome, Android tablets (Chrome). Verify orientation changes, fixed headers, and overlay stacking.

This roadmap is documentation-only; no code changes are included at this time.
