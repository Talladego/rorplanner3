# RorPlanner

A modern React application for planning character equipment loadouts in Warhammer Online: Return of Reckoning, built with Vite, TypeScript, and Tailwind CSS.

## Features

- ⚔️ Equipment planning for all character classes
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
- **GraphQL**: Apollo Client
- **Routing**: React Router

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
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/                 # React components
│   ├── ApolloProviderWrapper.tsx  # Apollo provider (imported from @apollo/client/react)
│   ├── DualToolbar.tsx            # Per-side selection and controls (A/B)
│   ├── DualEquipmentLayout.tsx    # Dual compare layout (A | Stats | B)
│   ├── EquipmentPanel.tsx         # Equipment slots display per side
│   ├── EquipmentSelector.tsx      # Item selection modal with filters
│   └── StatsComparePanel.tsx      # Compare totals and contribution tooltips
├── services/                  # Service layer (domain + integration + events)
│   ├── loadoutService.ts         # Main façade (business rules, GraphQL, URL, events)
│   ├── loadoutEventEmitter.ts    # Typed pub/sub
│   └── urlService.ts             # URL encode/decode for dual compare
├── store/                     # Data layer (Zustand state) + adapter
│   ├── loadoutStore.ts           # Zustand store
│   └── loadoutStoreAdapter.ts    # Thin adapter used by Service
├── lib/                       # Apollo Client configuration
│   └── apollo-client.ts
├── constants/                 # Local constants (e.g., base stats)
├── hooks/                     # Presentation hooks (subscribe via service)
├── types/                     # TypeScript type definitions and events
└── App.tsx                    # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Verify build locally: `npm run build`
6. Submit a pull request

Please keep the Architecture rules in mind:
- Components only call the Service and subscribe via the Service.
- Service applies business rules, talks to the store through the adapter, and emits typed events.
- Store manages state and pure calculations—no service imports or side-effects.

## License

This project is licensed under the MIT License.

## Deploying to Cloudflare Pages

Cloudflare Pages is a fast, free static hosting platform with a global CDN. This project is preconfigured for it:

- Vite base: `/` (see `vite.config.ts`)
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback: `public/_redirects` contains `/* /index.html 200`

Setup steps:

1. Push your repository to GitHub.
2. In Cloudflare Dashboard → Pages → Create a project → Connect to GitHub → select this repo.
3. Framework preset: None (or Vite)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Save and deploy.

Custom domain: Add your domain in Pages → Custom domains and follow DNS prompts. SSL is automatic.

## Architecture

This project follows a simple, enforceable layered architecture with event-driven communication:

- Presentation (React components and hooks)
	- Location: `src/components`, `src/hooks`
	- Responsibilities: Render UI, handle user interactions, subscribe to domain events, and call Service methods.
	- Must not import the store or event emitter directly. Use `loadoutService` as the façade.

- Service (Domain orchestration, integration, events)
	- Location: `src/services`
	- Responsibilities: Orchestrate domain operations, apply business rules (eligibility, unique-equipped, set bonuses, stat calc), fetch data via GraphQL, encode/decode URL state, and emit typed events.
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
- `src/store/loadoutStore.ts`: Zustand store with state and pure calculations.
- `src/store/loadoutStoreAdapter.ts`: Adapter that the Service uses to read/write store state.
- `src/services/urlService.ts`: URL encode/decode for dual-compare state.
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
	- `EquipmentSelector` → `loadoutService.getItemWithDetails(id)` → Apollo GraphQL.
	- `loadoutService.updateItem(slot, item)` → `loadoutStoreAdapter.setItem(...)` → emit `ITEM_UPDATED` → recompute → emit `STATS_UPDATED`.
	- `StatsComparePanel` listens via Service subscription to update its view.

### Contributor checklist to preserve boundaries

- When adding a feature:
	- Put domain logic in the Service.
	- Keep the Store focused on state shape and pure calculations only.
	- Subscribe to changes via Service; never from components to the store directly.
	- Emit/handle typed events defined in `src/types/events.ts`.
