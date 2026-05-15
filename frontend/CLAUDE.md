# CLAUDE.md — FoOdyssey Frontend

> AI coding guide for Claude Code, GitHub Copilot, Cursor, and other coding agents working in **this repo** (the FoOdyssey frontend). Read this and `AGENTS.md` before writing any code. For visual / design questions, also read `DESIGN_LANGUAGE.md`.

---

## What this repo is

The **Next.js 14 (App Router) frontend** for FoOdyssey — a food-discovery web app that helps users in Vietnam find restaurants by location, budget, dining concept, purpose, and amenities. Results are ranked by a backend-computed `match_score` and surfaced on an interactive Leaflet map. A Gemini-powered chatbox ("Odysseus AI") accepts natural-language queries.

This frontend is one half of a Modular Monolith. The backend (FastAPI / Python) lives in a sibling `backend/` repo and exposes a REST API on `http://localhost:8000`. **Do not implement business logic here that belongs to the backend** — the frontend renders, the backend ranks.

**Current milestone:** MVP Phase 3–5 — Discovery core, map view, AI chatbox.

---

## Stack

| Concern       | Choice                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Framework     | Next.js 14+ (App Router, RSC where possible)                             |
| Language      | TypeScript (no `any`)                                                    |
| Styling       | Tailwind CSS v4 + CSS variables in `src/app/globals.css`                 |
| Fonts         | Playfair Display (headings) + Inter (body) via Google Fonts import       |
| State         | Zustand (`src/store/*`)                                                  |
| Animation     | `motion/react` (Framer Motion)                                           |
| Icons         | `lucide-react`                                                           |
| Map           | Leaflet (loaded dynamically, client-only)                                |
| Forms         | Hand-rolled controlled inputs (react-hook-form installed, not wired)     |
| HTTP          | Thin wrappers in `src/lib/api/*` over `fetch`                            |
| Component kit | shadcn/ui under `src/components/ui/` (use these instead of hand-rolling) |

---

## Repository Layout

```
frontend/
├── public/                           # food-marker SVGs, favicons
├── src/
│   ├── app/                          # App Router pages
│   │   ├── layout.tsx                # Root layout; loads fonts, Providers
│   │   ├── providers.tsx             # AuthContext + LanguageContext wrappers
│   │   ├── page.tsx                  # /     → HomePage
│   │   ├── _components/HomePage.tsx
│   │   ├── explore/
│   │   │   ├── page.tsx              # /explore → ExplorePage
│   │   │   └── _components/ExplorePage.tsx
│   │   ├── map/page.tsx              # /map → MapView
│   │   └── globals.css               # Tailwind + design tokens + Leaflet polish
│   ├── components/
│   │   ├── auth/                     # AuthContext, Login/Register/UserMenu
│   │   ├── common/                   # SettingsDropdown, etc.
│   │   ├── feedback/                 # CompletionDialog
│   │   ├── map/                      # MapView (chrome) + MapComponent (Leaflet)
│   │   ├── providers/                # LanguageContext (vi / en)
│   │   ├── restaurant/components/    # RestaurantDetail, OdysseusAI
│   │   └── ui/                       # shadcn/ui primitives — USE THESE
│   ├── hooks/                        # useUserLocation, useMobile, etc.
│   ├── lib/
│   │   ├── api/                      # client, filters, geo, search wrappers
│   │   └── types.ts                  # shared types (Tag, GeoJSONFeature, ...)
│   └── store/                        # Zustand stores (see below)
├── DESIGN_LANGUAGE.md                # Visual system survey
├── UI_SUGGESTIONS.md                 # Prioritized UI improvements
├── AGENTS.md                         # Agent task boundaries (read this too)
└── CLAUDE.md                         # ← this file
```

---

## The three flows that matter most

### 1. Discovery search flow

```
User toggles filter / types query
        ↓
useFilterStore action (toggleConcept, setRadius, ...)
        ↓
MapView reads store + calls searchRestaurants() in src/lib/api/search.ts
        ↓
Response → useSearchStore.setSearchResults()
        ↓
getMapMarkers() → useMapStore.setMapMarkers()
        ↓
MapComponent re-renders pins; result panel re-renders cards
```

**Never** call `fetch()` from a component. Every network call goes through a wrapper in `src/lib/api/*`.

### 2. Map interactions

`src/components/map/MapView.tsx` owns the **chrome** (floating filter drawer, top-left Home+Refresh cluster, bottom-left location+AI cluster, zoom controls, callouts). `MapComponent.tsx` owns the **Leaflet instance** and is loaded with `dynamic(..., { ssr: false })` to dodge `window is not defined` during SSR.

- Markers are GeoJSON features; the custom pin uses `public/food-marker.svg` (warm gradient teardrop).
- "Set location" mode lets the user drop a pin instead of using GPS — managed by `manualLocation` state in `MapView`.
- Zoom and pan are imperative via `mapLeafletRef.current`.

### 3. Odysseus AI

`src/components/restaurant/components/OdysseusAI.tsx` is a side-panel chat surface that calls `POST /ai/chatbox` and renders streamed Gemini responses as restaurant suggestions, which then become map markers (`odysseusMarkers` in `MapView`).

---

## State: the four Zustand stores

Global state lives **exclusively** in `src/store/`. Never use `useState` for state that crosses component boundaries.

| Store            | Owns                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `useFilterStore` | `selectedConcepts/Purposes/Amenities/BudgetRanges`, `radius`, `numberOfPlaces`, toggle actions |
| `useSearchStore` | `searchResults`, `setSearchResults`, `clearSearchResults`                                      |
| `useMapStore`    | `mapMarkers`, `selectedMarkerId`, `clearMapState`                                              |
| `useUIStore`     | `theme` (light/dark), `setTheme`                                                               |
| `useAuthStore`   | (via `AuthContext`) `user`, `isAuthenticated`, `login/logout`                                  |

When clearing one screen's state to enter another, clear all relevant stores in order (see `app/page.tsx`'s `handleStartJourney`). Stale data leaking between screens is the #1 bug source.

---

## API contract with the backend

Base URL is read from `process.env.NEXT_PUBLIC_API_BASE_URL`. Endpoints used in the MVP:

| Method | Path                           | Wrapper                                                   |
| ------ | ------------------------------ | --------------------------------------------------------- |
| POST   | `/search`                      | `searchRestaurants(...)` in `lib/api/search.ts`           |
| GET    | `/restaurants/{id}`            | `getRestaurant(id)` in `lib/api/restaurants.ts`           |
| GET    | `/filters/options`             | `getFiltersOptions()` in `lib/api/filters.ts`             |
| POST   | `/map-markers`                 | `getMapMarkers(...)` in `lib/api/geo.ts`                  |
| GET    | `/restaurants/search/fulltext` | `searchRestaurantsFulltext(query)` in `lib/api/search.ts` |
| POST   | `/ai/chatbox`                  | (inside `OdysseusAI.tsx`)                                 |

**Mock-data toggle:** `lib/api/client.ts` exposes `getUseMockData()` / `setUseMockData(true)`. The map filter drawer surfaces it as a small "🟢 Mock" badge. When you add a new endpoint wrapper, mirror its mock branch so the toggle still works offline.

### Request / response shapes

All API response types live in `src/lib/types.ts`. Do **not** redefine them in components. If you add a new field, add it to the type first.

Key types: `Tag`, `GeoJSONFeature`, `RestaurantDetail`, `RestaurantSuggestion`, `UserLocation`, `SearchResponse`.

---

## Conventions

### Styling

- **Use Tailwind utility classes.** Inline `style={{}}` is acceptable only for dynamic values (gradients, computed positions) — see `DESIGN_LANGUAGE.md` for the canonical gradient strings.
- **Headings** automatically get Playfair Display via `@layer base` in `globals.css`. Don't repeat `style={{ fontFamily: 'Playfair Display, serif' }}` on every `<h2>`.
- **Dark mode** is first-class. Every surface gets both light and dark variants. Test both.
- **Colors:** prefer the design tokens (`bg-primary`, `text-primary`, ...) defined via CSS variables. Hardcoded `#FF4B2B`-style hex is a smell — fix when you touch the file.

### Components

- **Use shadcn/ui primitives** in `src/components/ui/` (`Button`, `Dialog`, `Input`, `Select`, `Slider`, `Sheet`, ...). They are installed and styled. Hand-rolling another button is a regression.
- **Modals** that already exist (LoginModal, RegisterModal, RestaurantDetail) are hand-rolled with Framer Motion + portal. New modals should use `Dialog` from shadcn/ui instead.
- **Lazy-load heavy widgets** with `next/dynamic({ ssr: false })` — anything touching `window`, Leaflet, or large libraries.

### Motion

- Use `motion/react` (Framer Motion).
- Common patterns: `whileHover={{ scale: 1.02, y: -2 }}`, `whileInView` with stagger via `transition={{ delay: i * 0.05 }}`, springy modal opens with `type: 'spring', damping: 25`.
- Don't add new animation libraries.

### Internationalization

- All user-facing strings go through `t('key')` from `LanguageContext`.
- Supported languages: Vietnamese (default) + English.
- When you add a string, add the `vi` and `en` translations in the same PR. Hardcoded Vietnamese strings (like the literal `t('Để sau')` bug in `MapView`) are not acceptable.

### TypeScript

- **No `any`.** Define a type in `src/lib/types.ts` if one is missing.
- API response types are the source of truth; component props derive from them, not the other way around.

---

## Commands

### Dev (without Docker)

```bash
npm install
npm run dev          # → http://localhost:3000
```

### With Docker (recommended for full-stack)

```bash
# From the monorepo root:
docker-compose up --build
# Frontend → :3000, Backend → :8000, Swagger → :8000/docs
```

### Lint, type-check, build

```bash
npm run lint
npm run typecheck       # tsc --noEmit
npm run build
```

### Tests

The frontend doesn't have a test runner wired yet. When you add one, use **Vitest + Testing Library** to match the project's lean preferences. Co-locate tests as `Component.test.tsx`.

---

## Environment

`.env.local` (gitignored) — never commit. Only `.env.example` is committed.

Required keys for the frontend:

```
NEXT_PUBLIC_API_BASE_URL          # e.g. http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY   # only used for the Distance Matrix in route ETA
NEXT_PUBLIC_USE_MOCK_DATA         # 'true' for offline / FE-only development
```

All `NEXT_PUBLIC_*` vars are inlined at build time and visible in the browser. **Never** put a secret (Gemini key, JWT secret, SMTP password) behind `NEXT_PUBLIC_*` — those belong to the backend only.

---

## What NOT to do

- **Don't** call `fetch()` directly from a component. Use a `lib/api/*` wrapper.
- **Don't** use `useState` for state that's read by another component — promote it to a Zustand store.
- **Don't** introduce a second map library, charts library, or animation library.
- **Don't** hand-roll a primitive that exists in `src/components/ui/` — use it.
- **Don't** put secrets behind `NEXT_PUBLIC_*`.
- **Don't** implement `match_score` or filter ranking on the client. The backend computes it; we render `match_score` and `matched_tags` from the response.
- **Don't** redefine an API response type inside a component file — extend `src/lib/types.ts`.
- **Don't** add Vietnamese (or any) hardcoded copy. Everything goes through `t()`.
- **Don't** scrollIntoView, ever — it breaks the embedded preview shell. Use `Element.scrollTo` or imperative scroll on a known ref.

---

## Where to learn more

- **Visual system + tokens**: `DESIGN_LANGUAGE.md`
- **UI improvement backlog**: `UI_SUGGESTIONS.md`
- **Agent task boundaries**: `AGENTS.md`
- **Backend contract (read-only reference)**: the monorepo's root `CLAUDE.md`
- **Live API docs**: `http://localhost:8000/docs` (Swagger) when backend is up
