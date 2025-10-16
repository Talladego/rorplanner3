# RorPlanner

A modern React application for planning character equipment loadouts in Warhammer Online: Return of Reckoning, built with Vite, TypeScript, and Tailwind CSS.

## Features

- ⚔️ Equipment planning for all character classes
- 🔁 Dual A/B loadout compare with side assignment
- 🎨 Dark/Light theme support
- 🔍 Interactive equipment selection
- 📊 Real-time stat calculations
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
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

Notes:
- The app uses a hash router. Deep-link parameters appear after the `#`.
- URL auto-update and navigation parsing are feature-flagged and off by default (see `urlService` usage in `App.tsx`).

### Build for Production

```bash
npm run build

```
src/
├── services/                         # Service layer (domain façade + integration + events)
│   ├── loadoutService.ts             # Main façade (business rules, URL updates, events)
│   ├── loadoutEventEmitter.ts        # Typed pub/sub (internal)
│   ├── urlService.ts                 # URL encode/decode for dual compare
│   ├── urlSync.ts                    # Guarded URL auto-update helper
│   ├── queries.ts                    # Centralized GraphQL documents (single source; re-export shims removed)
│   └── loadout/
│       ├── cache.ts                  # Lightweight in-memory LRU for list queries + icon warmups
│       ├── stats.ts                  # Compute totals + stat contribution breakdowns
│       ├── events.ts                 # Event subscription helpers (single/all)
│       └── filters.ts                # Allowed stat filters + sanitizers for queries
│   ├── loadoutStore.ts               # Store façade composing state and actions
│   ├── loadoutStoreAdapter.ts        # Thin adapter used by Service
│   └── loadout/                      # Store internals (modularized)
│       ├── state.ts                  # Initial state and factories
│       ├── actions.ts                # Mutators and calculations
│       ├── selectors.ts              # Pure selectors for reads
│       └── utils.ts                  # Helpers (e.g., stat mapping)
├── lib/                              # Apollo Client configuration
│   └── apollo-client.ts
├── constants/                        # Local constants (e.g., base stats, maps)
│   ├── careerBaseStats.ts
│   ├── careerIcons.ts
│   └── slotIcons.ts
├── hooks/                            # Presentation hooks (subscribe via service)
│   ├── useLoadoutById.ts
├── types/                            # TypeScript type definitions and events
└── App.tsx                           # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run probe:jewellery3-talismans` - Optional: inspect talisman data (dev utility)

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
	- Submodules:
		- `services/queries.ts`: All GraphQL documents.
		- `services/loadout/api.ts`: Fetchers (items, talismans, details) with caching and prefetch.
		- `services/loadout/stats.ts`: Compute totals and per-stat contribution breakdowns.
		- `services/loadout/events.ts`: Subscribe to single/all event types.
		- `services/urlSync.ts`: Guarded URL auto-update helper used throughout the service.
	- Talks to Data via `loadoutStoreAdapter` (no React imports here) and emits events using `loadoutEventEmitter`.

- Data (State and pure data transforms)
	- Location: `src/store`
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

- `src/services/loadoutService.ts`: Main façade for all domain operations and event emissions.
- `src/services/loadoutEventEmitter.ts`: Minimal pub/sub used internally by the Service.
- `src/services/queries.ts`: Centralized GraphQL documents.
- `src/services/loadout/api.ts`: Data fetchers for items/talismans/item details.
- `src/services/loadout/cache.ts`: LRU list cache and icon pre-warm.
- `src/services/loadout/stats.ts`: Stats aggregation and contribution logic.
- `src/services/loadout/events.ts`: Event subscription helpers for components.
- `src/services/urlService.ts`: URL encode/decode for dual-compare state, feature flags for auto-update and navigation parsing.
- `src/services/urlSync.ts`: Guarded URL auto-update helper.
- `src/constants/statMaps.ts`: Mapping between GraphQL stat enums and summary keys.
- `src/store/loadoutStore.ts`: Zustand store with state and pure calculations.
- `src/store/loadoutStoreAdapter.ts`: Adapter that the Service uses to read/write store state.
- `src/lib/apollo-client.ts`: Apollo client setup for GraphQL.

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

- Removed unused re-export shims:
	- `src/services/url/urlService.ts`
	- `src/services/url/urlSync.ts`
	- `src/services/graphql/queries.ts`
	These were thin pass-throughs that caused duplicate paths and import ambiguity. All imports should reference the canonical files under `src/services` directly.

- Prefer `services/queries.ts` as the single source for GraphQL documents. Avoid scattering `gql` in other modules unless local to a tightly scoped API call (e.g., `getItemWithDetailsApi`).

- URL feature flags (in `urlService`):
	- `setAutoUpdateEnabled(boolean)`: Enable/disable mutation of the URL in response to state changes.
	- `setNavigationHandlingEnabled(boolean)`: Enable/disable parsing the URL on navigation changes after initial load.
	- `setNavigateCallback(fn)`: Injected from React Router to perform updates.


- When adding a feature:
	- Put domain logic in the Service (and its submodules).
	- Keep the Store focused on state shape and pure calculations only.
	- Subscribe to changes via Service; never from components to the store directly.
	- Emit/handle typed events defined in `src/types/events.ts`.
