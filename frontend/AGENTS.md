<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version (Next.js 14+ App Router with React Server Components) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — FoOdyssey Frontend

> Context file for AI coding agents (Claude Code, GitHub Copilot, Cursor, etc.) working in **this repo** (the FoOdyssey frontend).
> Defines task boundaries, file ownership, and what each agent is allowed to generate autonomously.
> Read `CLAUDE.md` first for tech-stack and architecture context.

---

## Project in One Paragraph

FoOdyssey is a food-discovery web app for Vietnam. This repo is the **Next.js 14 frontend** that consumes a FastAPI backend on `http://localhost:8000`. It renders three primary surfaces — Home, Explore, and Map — driven by Zustand stores and styled with Tailwind + a warm orange/red design language (see `DESIGN_LANGUAGE.md`). The map (Leaflet) is the product's centerpiece; everything else feeds traffic into it.

**Current milestone:** MVP Phase 3–5 — Discovery core, map view, AI chatbox.

---

## Surface Map

| Surface           | Entry file                                                 | Owns                                                            | Status      |
| ----------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | ----------- |
| Home              | `src/app/page.tsx` → `_components/HomePage.tsx`            | Hero, top restaurants carousel, reviews marquee, footer         | 🔨 Active   |
| Explore           | `src/app/explore/page.tsx` → `_components/ExplorePage.tsx` | Article grid, latest-news scroller, popular cards, detail modal | 🔨 Active   |
| Map               | `src/app/map/page.tsx` → `components/map/MapView.tsx`      | Filter drawer, search, markers, AI panel, location-pick mode    | 🔨 Active   |
| Restaurant detail | `components/restaurant/components/RestaurantDetail.tsx`    | Detail modal, "I'll eat here" CTA, CompletionDialog handoff     | 🔨 Active   |
| Odysseus AI       | `components/restaurant/components/OdysseusAI.tsx`          | Chatbox UI, suggestion list, "show on map" handoff              | 🔨 Active   |
| Auth modals       | `components/auth/{LoginModal,RegisterModal,UserMenu}.tsx`  | Form UI only; no JWT logic yet                                  | 🔜 Sprint 6 |
| Profile page      | _not yet scaffolded_                                       | Saved restaurants, prefs (`[PRODUCTION]`)                       | 🔜 Sprint 6 |
| Ratings           | _not yet scaffolded_                                       | Star input on detail, history list                              | 🔜 Sprint 7 |
| Vision (OCR)      | _not yet scaffolded_                                       | Snapshot → restaurant identify (`[EXTEND]`)                     | ⏳ EXTEND   |

---

## File Ownership

Every file in the repo falls into one of these slots. **An agent must not** generate a new file that straddles slots.

| Slot                   | Path                                        | What lives here                                                                         |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Route**              | `src/app/*/page.tsx`                        | Thin wrapper; reads URL, hooks stores, renders one screen component. No business logic. |
| **Screen component**   | `src/app/*/(_components\|components)/*.tsx` | Composes feature components for the route. Owns route-specific layout.                  |
| **Feature component**  | `src/components/<feature>/*.tsx`            | Reusable across routes (e.g. `MapView`, `RestaurantDetail`).                            |
| **UI primitive**       | `src/components/ui/*.tsx`                   | shadcn/ui — `Button`, `Dialog`, etc. **Don't edit; use as-is.**                         |
| **Provider / context** | `src/components/providers/*.tsx`            | `LanguageContext`, `AuthContext`. App-wide context only.                                |
| **Store**              | `src/store/*.ts`                            | Zustand. Pure state + actions. No fetch calls inside.                                   |
| **API wrapper**        | `src/lib/api/*.ts`                          | `fetch` + mock branch. One file per backend resource.                                   |
| **Hook**               | `src/hooks/*.ts`                            | Reusable side-effect hooks (`useUserLocation`, `useMobile`).                            |
| **Types**              | `src/lib/types.ts`                          | Shared TS types. Single source of truth for API shapes.                                 |
| **Public asset**       | `public/*`                                  | Static SVGs (markers), favicons.                                                        |

If a piece of code doesn't fit cleanly, **stop and ask the developer** what slot it belongs in.

---

## Agent Task Boundaries

### What agents MAY do autonomously

- Scaffold a new **screen** (route + screen component) following the existing pattern (`page.tsx` → `_components/<Name>Page.tsx`).
- Add a **feature component** under `src/components/<feature>/` with co-located smaller components.
- Add or extend a **Zustand store** for new client state.
- Add a new **API wrapper** in `src/lib/api/` for a documented backend endpoint, including its mock branch.
- Add a new **type** to `src/lib/types.ts` matching a documented backend schema.
- Add `t()` keys to `LanguageContext.tsx` (both `vi` and `en` in the same PR).
- Replace a hand-rolled UI primitive with the equivalent `src/components/ui/*` shadcn primitive.
- Wire up animations with `motion/react` following the existing motion vocabulary (see `DESIGN_LANGUAGE.md` §9).
- Migrate hardcoded gradients / fonts to the canonical tokens.

### What agents MUST ask the developer before doing

- Introducing a **new dependency** (npm package). State the package, version, and why an existing dep can't do the job.
- Adding a **new API endpoint** call that doesn't have a backend counterpart yet — coordinate with the backend agent / developer first.
- Changing a **store's shape** in a way that breaks consumers. Either add a new field non-breakingly or migrate consumers in the same PR.
- Renaming or moving a **public component prop**. These are stable contracts.
- Changing anything in `src/app/layout.tsx`, `src/app/providers.tsx`, or `src/app/globals.css` — these affect every screen.
- Editing files under `src/components/ui/` (shadcn primitives). Treat them as vendored.
- Enabling or building any `[EXTEND]` feature (Vision/OCR, AI preference weighting, snapshot recognition).

### What agents MUST NOT generate

- **`fetch()` inside a component.** Always go through a `src/lib/api/*` wrapper.
- **`useState` for state that crosses component boundaries** — promote to a Zustand store.
- **`any` types**, or `// @ts-ignore`. Add to `src/lib/types.ts` instead.
- **Hardcoded Vietnamese (or English) strings.** Everything routes through `t()`.
- **Secrets behind `NEXT_PUBLIC_*`.** Any secret stays on the backend.
- **A second map library** alongside Leaflet, a second animation library alongside Framer Motion, or a second icon library alongside lucide-react.
- **Client-side `match_score` recomputation.** Backend ranks, frontend renders.
- **Direct DOM access via `scrollIntoView`** — it breaks the embedded preview shell. Use imperative `scrollTo` on a known ref.
- **Hand-rolled re-implementations** of `Button`, `Dialog`, `Input`, `Select`, `Slider`, `Sheet`, `DropdownMenu`, or `Tabs` — these exist in `src/components/ui/`.

---

## The Component → Store → API Contract

The mental model for this frontend mirrors the backend's facade pattern: every layer talks **only** to its immediate neighbour.

```
<Component>                          ← renders + dispatches events
    ↓ reads / calls actions
<useXyzStore>                        ← state + reducers (Zustand)
    ↓ uses
src/lib/api/<resource>.ts            ← fetch wrapper + mock branch
    ↓ HTTP
Backend (FastAPI on :8000)
```

- Components **never** call `fetch` directly.
- Stores **never** import from another store's internals — they may import the same API wrappers, or expose actions that another store's caller can chain.
- API wrappers **never** import React or stores — they are pure functions.

If you need to break this rule, **stop and ask the developer** what new abstraction is needed instead of inlining the bypass.

---

## Authorised API Calls (Current Phase)

Agents may generate code that calls these endpoints without asking:

| Wrapper                                       | Endpoint                           | Purpose                              |
| --------------------------------------------- | ---------------------------------- | ------------------------------------ |
| `searchRestaurants(filters)`                  | `POST /search`                     | Primary discovery — filters + match  |
| `searchRestaurantsFulltext(query)`            | `GET /restaurants/search/fulltext` | Autocomplete suggestions             |
| `getRestaurant(id)`                           | `GET /restaurants/{id}`            | Restaurant detail                    |
| `getFiltersOptions()`                         | `GET /filters/options`             | Tags for filter chips                |
| `getMapMarkers({ restaurant_ids, lat, lng })` | `POST /map-markers`                | GeoJSON markers for the map          |
| _(inline in `OdysseusAI.tsx`)_                | `POST /ai/chatbox`                 | Gemini chat → restaurant suggestions |

Any new endpoint call requires both (a) the backend endpoint existing in the contract and (b) developer review.

---

## Design Language — Quick Reference

Full survey: `DESIGN_LANGUAGE.md`. The minimum every agent must know:

- **Fonts:** Playfair Display for headings, Inter for body. Loaded via `globals.css` Google Fonts import.
- **Brand gradients:** primary CTA `linear-gradient(90deg, #f97316, #dc2626)`; accent / marketing `linear-gradient(90deg, #FF4B2B, #FF8122)`.
- **Radii:** chips `rounded-full`, inputs/cards `rounded-2xl`–`rounded-3xl`, hero/modal `rounded-[32px]`.
- **Shadows:** warm-tinted (`0 8px 24px rgba(255,143,67,0.4)` for CTA at rest). Never plain black.
- **Dark mode:** every surface must have a paired `.dark` variant. Test both.
- **Iconography:** `lucide-react` only.
- **Motion:** `motion/react`. Standard hover lift `whileHover={{ scale: 1.02, y: -2 }}`; modal opens spring-damped.

---

## Environment & Secrets

Frontend env vars (in `.env.local`, never committed):

```
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_USE_MOCK_DATA
```

**`NEXT_PUBLIC_*` is inlined at build time and visible in the browser.** Never use it for a real secret. Secrets stay on the backend, behind authenticated routes.

If a new env var is needed, add it to `.env.example` only.

---

## Test Generation Guidelines

The frontend doesn't have a test runner wired yet. When tests get added:

- Use **Vitest + Testing Library** unless the developer says otherwise.
- Co-locate tests as `Component.test.tsx`.
- Mock API wrappers (`src/lib/api/*`); never hit the real backend in unit tests.
- Suggested first targets: `useFilterStore` (weight redistribution edge cases), `MapView` filter→search wiring, `OdysseusAI` reply parsing.

---

## Commit & PR Conventions

```
feat(map): add "lock map" toggle to filter drawer
fix(home): restore Vietnamese translation for "Để sau" empty state
chore(deps): bump motion to 11.4.0
refactor(ui): replace hand-rolled login modal with shadcn Dialog
docs(design): document the four-color filter chip system
```

Format: `type(surface): short imperative description`.

Surfaces: `home`, `explore`, `map`, `auth`, `detail`, `ai`, `ui`, `store`, `api`, `deps`, `docs`.

Keep PRs small. One surface per PR is the target.

---

## Phase Gate — Do Not Cross

| Tag            | Meaning                   | Agent action                                                |
| -------------- | ------------------------- | ----------------------------------------------------------- |
| `[EXTEND]`     | Post-MVP feature          | Generate empty stub or `throw new Error('Not implemented')` |
| `[PRODUCTION]` | Auth-protected, Phase 6–7 | OK to scaffold UI; don't wire to real auth routes yet       |
| `// TODO:`     | Known gap left by team    | Leave as-is unless the task explicitly targets it           |

When in doubt about scope, output a comment explaining what would be needed and stop — do not hallucinate an implementation of a deferred feature.

---

## Companion docs

- `CLAUDE.md` — the AI coding guide. Read first.
- `DESIGN_LANGUAGE.md` — design system survey. Read before any visual change.
- `UI_SUGGESTIONS.md` — prioritized UI improvements backlog.
- Monorepo root `CLAUDE.md` (in the backend repo) — backend contract, facade rules, `match_score` formula. Reference only; don't implement backend logic here.
