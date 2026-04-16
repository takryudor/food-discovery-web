<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — FoOdyssey

> Context file for AI coding agents (Claude Code, GitHub Copilot, Cursor, etc.).
> Defines module ownership, task boundaries, cross-module communication rules,
> and what each agent is allowed to generate autonomously.

---

## Project in One Paragraph

FoOdyssey is a **Modular Monolith** web app that helps users in Vietnam discover restaurants.
The backend (FastAPI / Python) exposes a ranked list of restaurants based on location, budget,
and preference filters. Each result carries a `match_score` computed by a transparent linear
formula. A Gemini-powered chatbox accepts natural-language queries. The frontend is Next.js 14+
with Zustand state management.

**Current milestone:** MVP Phase 3–5 — Discovery core, map view, and AI chatbox.

---

## Module Map

| Module      | Facade file           | Owned services                                                                      | Current status              |
| ----------- | --------------------- | ----------------------------------------------------------------------------------- | --------------------------- |
| `discovery` | `discovery_facade.py` | `search_service`, `filter_engine`, `ranking_service`, `sort_handler`, `chat_parser` | 🔨 Active                   |
| `geo`       | `geo_facade.py`       | `nav_calculator`, `map_service`                                                     | 🔨 Active                   |
| `ai`        | `ai_facade.py`        | `gemini_service`, `details_service`                                                 | 🔨 Active                   |
| `auth`      | `auth_facade.py`      | `user_service`, `token_service`, `email_service`                                    | 🔜 Next sprint              |
| `profile`   | `profile_facade.py`   | `profile_service`, `saved_service`, `weight_updater`_, `ranker`_                    | 🔜 Next sprint              |
| `ratings`   | `ratings_facade.py`   | `rating_service`                                                                    | 🔜 Next sprint              |
| `feedback`  | `feedback_facade.py`  | `chatbot_loop`                                                                      | 🔜 Next sprint              |
| `vision`    | `vision_facade.py`    | `ocr_extractor`, `snapshot_service`                                                 | ⏳ EXTEND — do not generate |

\* `weight_updater` and `ranker` are `[EXTEND]` services inside the `profile` module. Generate stub/placeholder only.

---

## Agent Task Boundaries

### What agents MAY do autonomously

- Generate or complete code inside a **single module's** four layers (routes → facade → services → models/schemas) as long as it does not require touching another module's internals.
- Suggest or write unit tests in `tests/unit/` for any service file.
- Add a new Alembic migration file (one per PR, in `alembic/versions/`).
- Scaffold Pydantic schemas or SQLAlchemy models following existing patterns.
- Generate Next.js page/component code in `frontend/src/`.
- Generate `docker-compose` changes or update `requirements.txt`.

### What agents MUST ask the developer before doing

- Any change that creates a **new cross-module call** — these must be routed through the target module's Facade and reviewed by the team.
- Any change to `core/database.py`, `core/security.py`, or `core/config.py` — these affect all eight developers simultaneously.
- Any change to an existing Alembic migration file (editing a committed migration is destructive).
- Switching the `match_score` formula weights or adding a new scoring component.
- Enabling or building any `[EXTEND]` feature (`vision/`, `weight_updater.py`, `ranker.py`, `chat_parser.py`).

### What agents MUST NOT generate

- Direct imports from one module's `services/` into another module's `services/` (Facade bypass).
- Any ML model training code, embedding generation, or vector similarity search — MVP uses the linear `match_score` formula only.
- Real API keys, passwords, or secrets in any file.
- Code that stores OTP tokens or session data in PostgreSQL (use Redis).
- More than one Alembic migration per PR.
- Any code under `backend/app/modules/vision/` beyond an empty stub.

---

## The Facade Contract

The Facade is the **only public interface** of a module. When an agent needs module B's functionality while working inside module A, it **must** call through `b_facade`, never directly into `b/services/`.

```python
# ✅ Agent-generated code that crosses module boundary
from app.modules.geo.geo_facade import geo_facade
coords = geo_facade.geocode(location_query)

# ❌ Agent must refuse to generate this pattern
from app.modules.geo.services.coord_handler import resolve_coords
coords = resolve_coords(location_query)
```

If an agent cannot accomplish a task without bypassing the Facade, it should **stop and tell the developer** what new Facade method is needed, rather than creating the bypass.

---

## Authorised Cross-Module Calls (Current Phase)

Agents may generate code that calls these specific cross-module paths without asking first:

| Caller facade      | Target facade method                              | Purpose                                |
| ------------------ | ------------------------------------------------- | -------------------------------------- |
| `discovery_facade` | `geo_facade.geocode(location_query)`              | Resolve text address → lat/lng         |
| `discovery_facade` | `geo_facade.calculate_distance(coord_a, coord_b)` | Haversine distance                     |
| `feedback_facade`  | `discovery_facade.execute_search(filters)`        | Re-run search with relaxed constraints |
| `ai_facade`        | _(no cross-module calls in MVP)_                  | —                                      |

Any other cross-module call requires developer approval and a new Facade method.

---

## Discovery Module — Detailed Contract

This is the most active module. Agents should understand its internals before making changes.

### Processing pipeline (in order)

```
1. search_service.py     — validates and normalises the raw SearchRequest
2. coord_handler.py      — resolves location_query to (lat, lng) via geocoding
3. radius_manager.py     — filters restaurants within radius_km using Haversine
4. filter_engine.py      — hard-filter by budget; soft-score by concepts/purposes/amenities
5. ranking_service.py    — computes match_score; applies sort_by
6. sort_handler.py       — final sort pass (distance_asc, rating_desc, price_asc, recommended)
```

### match_score formula (do not change without team discussion)

```python
match_score = (
    0.30 * concept_score
  + 0.20 * purpose_score
  + 0.10 * amenity_score
  + 0.20 * distance_score   # 1 - (distance_km / radius_km)
  + 0.20 * rating_score     # restaurant.rating / 5.0
)
# When the user selects no filter for a group, redistribute that group's
# weight proportionally — do NOT default it to zero or to 1.
```

### Hard vs. soft constraints

| Constraint | Fields                                  | Agent behaviour                                    |
| ---------- | --------------------------------------- | -------------------------------------------------- |
| Hard       | `radius_km`, `budget_min`, `budget_max` | Exclude restaurant immediately; never score it     |
| Soft       | `concepts`, `purposes`, `amenities`     | Score only; never exclude on mismatch alone        |
| Sort       | `sort_by`                               | Apply after scoring; does not affect `match_score` |

---

## Restaurant Data Model (Minimum MVP Schema)

```python
# backend/app/modules/discovery/models.py
class Restaurant(Base):
    id         : int        # primary key
    name       : str
    address    : str
    district   : str        # supports area-based filtering
    lat        : float
    lng        : float
    avg_price  : int        # VND; used for budget hard constraint
    rating     : float      # 0.0–5.0; contributes to rating_score
    concepts   : list[str]  # ARRAY / JSONB column
    purposes   : list[str]
    amenities  : list[str]
    food_tags  : list[str]
```

Agents must not rename or remove these columns. New columns require a migration file.

---

## Frontend Agent Guidelines

- **State:** All global state lives in `src/store/`. Never add `useState` for data shared between components.
- **API calls:** All `fetch()` calls go in `src/services/`. Components call service functions, never raw `fetch`.
- **Map:** Use the existing `MapView` component (`components/map/`). Do not introduce a second map library.
- **Search flow:** `FilterPanel` → Zustand action → `useRestaurants` hook → `restaurantService.search()` → API → Zustand store update → `RestaurantList` re-renders.
- **TypeScript:** All API response types must be defined in `src/types/`. Do not use `any`.

---

## Environment & Secrets

Agents must never generate, guess, or hard-code values for:

```
DATABASE_URL        JWT_SECRET_KEY      GEMINI_API_KEY
REDIS_URL           GOOGLE_MAPS_API_KEY SMTP_PASSWORD
```

Always reference these via `settings` (backend, from `core/config.py`) or `process.env.NEXT_PUBLIC_*` (frontend). If a new secret is required, add it to `.env.example` only — never to `.env`.

---

## Test Generation Guidelines

When writing tests, agents should follow these patterns:

```
tests/unit/test_filter_engine.py      — test budget hard-filter edge cases
tests/unit/test_ranking_service.py    — test match_score computation with known inputs
tests/unit/test_radius_manager.py     — test Haversine distance + radius boundary
tests/unit/test_weight_updater.py     — [EXTEND] stub only, minimal tests
tests/integration/test_search_flow.py — POST /search end-to-end with seeded DB
tests/integration/test_auth_flow.py   — register → login → JWT round-trip
```

Unit tests must be **self-contained** (no real DB, no real API calls). Use `pytest` fixtures and `unittest.mock` or `pytest-mock` for external dependencies.

---

## Commit & PR Conventions

Agents that suggest commit messages or PR descriptions should follow:

```
feat(discovery): add budget hard-filter in filter_engine
fix(ranking): correct distance_score normalisation when radius=0
test(geo): add unit test for Haversine edge cases
chore(alembic): add migration 004_add_food_tags_column
```

Format: `type(module): short imperative description`

One Alembic migration per PR, maximum.

---

## Phase Gate — Do Not Cross

The following symbols in the codebase mean "not now":

| Tag            | Meaning                   | Agent action                                           |
| -------------- | ------------------------- | ------------------------------------------------------ |
| `[EXTEND]`     | Post-MVP feature          | Generate empty stub or `raise NotImplementedError`     |
| `[PRODUCTION]` | Auth-protected, Phase 6–7 | OK to scaffold schema/model; do not wire to routes yet |
| `# TODO:`      | Known gap left by team    | Leave as-is unless task explicitly targets it          |

When in doubt about scope, output a comment explaining what would be needed and stop — do not hallucinate an implementation of a deferred feature.
