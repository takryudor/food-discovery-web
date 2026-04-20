@AGENTS.md

# CLAUDE.md — FoOdyssey

> AI coding guide for Claude Code and GitHub Copilot.
> Read this before writing any code in this repository.

---

## Project Overview

**FoOdyssey** is a food discovery web app for Vietnam. Users search for restaurants by location, budget, dining concept, purpose, and amenities. Results are ranked by a weighted `match_score`. An AI chatbox (Gemini) supports natural-language queries.

- **Architecture:** Modular Monolith (single process, clearly separated internal modules)
- **Backend:** Python 3.11+ / FastAPI
- **Frontend:** Next.js 14+ (App Router) / TypeScript / Tailwind CSS / Zustand
- **DB:** PostgreSQL 16+ via SQLAlchemy ORM + Alembic
- **Cache / OTP:** Redis 7+
- **AI:** Google Gemini API
- **Maps:** Google Maps Distance Matrix API + Leaflet/Mapbox

---

## Current Phase: MVP (Phase 3–5)

The team is actively building the **Discovery core**. Focus only on what is marked **MVP** or **PRODUCTION** in the roadmap. Do **not** implement `[EXTEND]`-tagged features unless explicitly asked.

| Phase                | Status    | Scope                                        |
| -------------------- | --------- | -------------------------------------------- |
| 1 — Foundation       | ✅ Done   | docker-compose, core/, Alembic base          |
| 2 — Data Layer       | ✅ Done   | Restaurant model, seed data                  |
| **3 — MVP Search**   | 🔨 Active | `discovery` module, `POST /search`           |
| **4 — Map & Detail** | 🔨 Active | map markers, restaurant detail, autocomplete |
| **5 — AI Chatbox**   | 🔨 Active | Gemini integration, `POST /ai/chatbox`       |
| 6 — Auth & Profile   | 🔜 Next   | `/auth/*`, profile module                    |
| 7 — Ratings & Geo    | 🔜 Next   | ratings, ETA routing                         |
| 8 — Extend           | ⏳ Later  | AI preferences, OCR, 2FA                     |

---

## Repository Layout

```
foodyssey/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── router.py            # Aggregates all module routers
│   │   ├── core/                # Shared infrastructure (DB, JWT, config)
│   │   ├── api/v1/              # Layer 1: Route handlers only
│   │   └── modules/             # Layer 2–4: Business logic
│   │       ├── discovery/       # ← PRIMARY focus right now
│   │       ├── auth/
│   │       ├── profile/
│   │       ├── ratings/
│   │       ├── geo/
│   │       ├── ai/
│   │       ├── vision/          # [EXTEND] — do not touch yet
│   │       └── feedback/
│   └── tests/
│       ├── unit/
│       └── integration/
└── frontend/
    └── src/
        ├── app/                 # Next.js App Router pages
        ├── components/          # Shared UI components
        ├── store/               # Zustand state
        ├── services/            # API call wrappers
        └── hooks/               # Custom React hooks
```

---

## The Four-Layer Architecture

Every backend module **must** follow this exact layer order:

```
api/v1/<module>_routes.py       ← Receives HTTP request, validates via schema, calls facade
    ↓
modules/<module>/<module>_facade.py   ← Orchestrates; ONLY entry point for other modules
    ↓
modules/<module>/services/*.py  ← All business logic lives here
    ↓
modules/<module>/models.py + schemas.py   ← SQLAlchemy models + Pydantic schemas
```

### The Facade Rule — Most Important Convention

```python
# ✅ CORRECT — call another module only through its Facade
from app.modules.geo.geo_facade import geo_facade
result = geo_facade.geocode("Quận 1, TP.HCM")

# ❌ WRONG — never import directly into another module's service
from app.modules.geo.services.coord_handler import get_coordinates
```

**Never bypass the Facade layer.** If module A needs data from module B, it calls `b_facade.<method>()`. This is the team's primary rule for avoiding merge conflicts and import cycles.

### Cross-Module Dependency Map

```
discovery_facade  →  geo_facade.geocode()
discovery_facade  →  profile_facade.rerank_with_preferences()   [PRODUCTION]
discovery_facade  →  ai_facade.parse_chat_to_filters()           [EXTEND]
ratings_facade    →  profile_facade.update_weights()             [EXTEND]
feedback_facade   →  discovery_facade.execute_search()
auth_facade       →  profile_facade.create_default_preferences()
```

---

## Core Business Logic

### match_score Formula

```python
match_score = (
    0.30 * concept_score    # fraction of selected concepts matched
  + 0.20 * purpose_score    # fraction of selected purposes matched
  + 0.10 * amenity_score    # fraction of selected amenities matched
  + 0.20 * distance_score   # = 1 - (distance_km / radius_km)
  + 0.20 * rating_score     # = restaurant.rating / 5.0
)
# All component scores are normalised to [0, 1].
# If the user selects no filters for a group, its weight is redistributed
# proportionally across the other groups — do NOT hardcode weights.
```

### Filter Classification

| Type             | Fields                              | Behaviour                                      |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| Hard constraints | `radius_km`, `budget_min/max`       | Discard restaurant immediately if unmet        |
| Soft constraints | `concepts`, `purposes`, `amenities` | Contribute to `match_score`; never hard-reject |
| Sort criteria    | `sort_by` enum                      | Applied last, after scoring                    |

### Valid `sort_by` values

`recommended` (default) · `rating_desc` · `distance_asc` · `price_asc`

### Standard Input Schema

| Field            | Type      | Required | Notes                         |
| ---------------- | --------- | -------- | ----------------------------- |
| `location_query` | string    | ✅       | e.g. `"Quận 1, TP.HCM"`       |
| `radius_km`      | int       | ✅       | Must be 3, 5, or 10           |
| `budget_min`     | int       | ✅       | VND; must be < `budget_max`   |
| `budget_max`     | int       | ✅       | VND                           |
| `concepts`       | list[str] | ❌       | e.g. `["Cafe", "Nhà hàng"]`   |
| `purposes`       | list[str] | ❌       | e.g. `["Hẹn hò", "Gia đình"]` |
| `amenities`      | list[str] | ❌       | e.g. `["Wifi", "Máy lạnh"]`   |
| `sort_by`        | str       | ❌       | Defaults to `recommended`     |

### Standard Output Fields

`id` · `name` · `address` · `distance_km` · `avg_price` · `rating` · `match_score` · `matched_tags`

---

## Commands

### Run (Docker — recommended)

```bash
# Production / demo
docker-compose up --build

# Development with hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### Database

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.scripts.seed_restaurants
```

### Run without Docker

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

### Tests

```bash
docker-compose exec backend pytest               # all tests
docker-compose exec backend pytest tests/unit/   # unit only
docker-compose exec backend pytest tests/integration/
```

---

## Coding Conventions

### Backend (Python / FastAPI)

- Route handlers do **exactly three things**: receive JSON → validate via Pydantic schema → call facade. No logic in routes.
- All cross-module Pydantic types must be defined in each module's own `schemas.py`. Never share model classes across modules directly.
- Use Redis for all caching and all OTP tokens. Never store time-limited sensitive data in PostgreSQL.
- Every DB model must inherit from `Base` in `core/database.py`.
- Each PR introduces **at most one** Alembic migration file.
- Commit order within a module: `models.py` → `schemas.py` → `services/` → `facade.py` → `routes.py`.

### Frontend (Next.js / TypeScript)

- State management via **Zustand** only; do not use `useState` for global/shared state.
- API calls live in `src/services/`; components never call `fetch()` directly.
- Use **Tailwind CSS** utility classes; avoid inline styles.
- Map rendering: Leaflet/Mapbox via the `MapView` component in `components/map/`.

### Environment

- Never commit `.env`. Only `.env.example` is committed.
- Required keys: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `SMTP_*`.

---

## API Reference (MVP Endpoints)

Base URL: `http://localhost:8000`

| Method | Path                           | Purpose                                           |
| ------ | ------------------------------ | ------------------------------------------------- |
| POST   | `/search`                      | Main discovery endpoint — filters + `match_score` |
| GET    | `/restaurants/{id}`            | Restaurant detail                                 |
| GET    | `/filters/options`             | Concepts / purposes / amenities list              |
| POST   | `/map-markers`                 | GeoJSON markers for map view                      |
| GET    | `/restaurants/search/fulltext` | Autocomplete                                      |
| POST   | `/ai/chatbox`                  | Gemini chat → restaurant list                     |

Full spec: **Swagger UI** at `/docs` or **Redoc** at `/redoc`.

---

## What NOT to Do

- Do **not** implement anything tagged `[EXTEND]` (OCR, AI preference weights, 2FA, snapshot recognition) during the current MVP phase.
- Do **not** import a service from module A directly into a service in module B.
- Do **not** use machine learning models for `match_score` — the linear weighted formula above is intentional and sufficient for MVP.
- Do **not** store OTP or session tokens in PostgreSQL; use Redis with TTL.
- Do **not** commit `.env` with real API keys.
