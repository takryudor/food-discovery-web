<div align="center">

# 🍜 FoOdyssey

**Food Discovery Web — Vietnam**

Nền tảng khám phá ẩm thực thông minh, giúp người dùng tìm quán ăn phù hợp theo vị trí, ngân sách, phong cách và mục đích chuyến đi.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)

</div>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Cấu trúc Repository](#cấu-trúc-repository)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & Chạy chương trình](#cài-đặt--chạy-chương-trình)
- [API Overview](#api-overview)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Lộ trình phát triển](#lộ-trình-phát-triển)
- [Quy tắc phát triển nhóm](#quy-tắc-phát-triển-nhóm)

---

## Giới thiệu

FoOdyssey là ứng dụng web khám phá ẩm thực dành cho người dùng tại Việt Nam. Người dùng có thể tìm kiếm nhà hàng / quán ăn / cafe theo vị trí hiện tại hoặc địa điểm bất kỳ, lọc theo ngân sách, loại hình, mục đích ghé thăm, và tiện ích. Kết quả được xếp hạng bằng công thức `match_score` có trọng số, và tích hợp chatbot AI (Gemini) để hỗ trợ tìm kiếm bằng ngôn ngữ tự nhiên.

Dự án sử dụng kiến trúc **Modular Monolith** — một repo duy nhất, tách biệt rõ ràng giữa backend (FastAPI) và frontend (Next.js), các module nội bộ giao tiếp qua lớp Facade.

---

## Tính năng

Tính năng được chia thành 3 giai đoạn phát triển:

**MVP — Core Product**
- Tìm kiếm nhà hàng theo địa điểm + bán kính (3 / 5 / 10 km), dùng thuật toán Haversine
- Lọc theo ngân sách (slider min/max)
- Lọc theo loại hình (Cafe, Nhà hàng...), mục đích (Hẹn hò, Gia đình...) và tiện ích (Wifi, Bãi đỗ xe...)
- Xếp hạng kết quả theo `match_score` — điểm phù hợp có trọng số
- Xem bản đồ (map markers) và thẻ chi tiết nhà hàng
- Tìm kiếm full-text autocomplete theo tên / địa chỉ
- AI Chatbox tích hợp Gemini: nhập câu hỏi tự nhiên → hệ thống phân tích → trả về danh sách

**Production — Full Product**
- Đăng ký / Đăng nhập / Đăng xuất (JWT + bcrypt), xác thực email OTP
- Quên / Đặt lại mật khẩu qua OTP có thời hạn
- Lưu nhà hàng yêu thích
- Đánh giá 1–5 sao, bình luận và upload ảnh
- Chỉ đường & ETA (Google Maps API): đi bộ / xe máy / ô tô
- AI popup chi tiết nhà hàng (Gemini summary, cache theo restaurant)
- Feedback bot gợi ý khi kết quả tìm kiếm = 0 (nới rộng bán kính / ngân sách)

**Extend — Advanced Features**
- Hồ sơ sở thích AI: học từ hành vi người dùng (đánh giá, lưu, lọc thường xuyên)
- Gợi ý cá nhân hoá dựa trên preference weights
- OCR scan menu bằng TrOCR (HuggingFace) — trích xuất món ăn & giá
- Nhận diện nhà hàng qua ảnh chụp (Restaurant Snapshot Recognition)
- Xác thực 2 yếu tố (2FA / TOTP)
- Tối ưu tuyến đường nhiều điểm dừng

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend | Python 3.11+, FastAPI |
| Database | PostgreSQL 16+ (SQLAlchemy ORM, Alembic migrations) |
| Cache / OTP | Redis 7+ |
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| State Management | Zustand |
| AI / NLP | Google Gemini API |
| Maps | Google Maps Distance Matrix API, Leaflet/Mapbox |
| OCR *(Extend)* | HuggingFace TrOCR (`microsoft/trocr-base-printed`) |
| Auth | JWT (access + refresh token), bcrypt |
| Containerisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Cấu trúc Repository

```
foodyssey/                          # Monorepo root
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Chạy tests khi tạo PR
│       └── deploy.yml              # Deploy khi merge vào main
│
├── backend/                        # Python / FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                    # Lịch sử migration DB
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 001_create_restaurants.py
│   │       ├── 002_create_users.py
│   │       └── 003_create_ratings.py
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point + middleware
│   │   ├── router.py               # Tổng hợp tất cả module routers
│   │   ├── core/                   # Shared infrastructure
│   │   │   ├── config.py           # Đọc .env qua pydantic-settings
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   ├── security.py         # JWT + bcrypt
│   │   │   ├── dependencies.py     # FastAPI Depends() helpers
│   │   │   └── exceptions.py       # Custom HTTPException subclasses
│   │   ├── api/v1/                 # Layer 1 — Route handlers
│   │   │   ├── discovery_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── profile_routes.py
│   │   │   ├── ratings_routes.py
│   │   │   ├── geo_routes.py
│   │   │   ├── ai_routes.py
│   │   │   ├── vision_routes.py    # [EXTEND]
│   │   │   └── feedback_routes.py
│   │   └── modules/                # Layer 2–4 — Business logic
│   │       ├── discovery/          # Tìm kiếm & xếp hạng (MVP Core)
│   │       │   ├── discovery_facade.py
│   │       │   ├── services/
│   │       │   │   ├── search_service.py
│   │       │   │   ├── filter_engine.py
│   │       │   │   ├── ranking_service.py
│   │       │   │   ├── sort_handler.py
│   │       │   │   └── chat_parser.py  # [EXTEND]
│   │       │   ├── helpers/
│   │       │   │   ├── coord_handler.py
│   │       │   │   └── radius_manager.py
│   │       │   ├── models.py
│   │       │   └── schemas.py
│   │       ├── auth/               # Xác thực người dùng
│   │       │   ├── auth_facade.py
│   │       │   ├── services/
│   │       │   │   ├── user_service.py
│   │       │   │   ├── token_service.py
│   │       │   │   └── email_service.py
│   │       │   ├── models.py
│   │       │   └── schemas.py
│   │       ├── profile/            # Hồ sơ & sở thích người dùng
│   │       │   ├── profile_facade.py
│   │       │   ├── services/
│   │       │   │   ├── profile_service.py
│   │       │   │   ├── saved_service.py
│   │       │   │   ├── weight_updater.py   # [EXTEND]
│   │       │   │   └── ranker.py           # [EXTEND]
│   │       │   ├── models.py
│   │       │   └── schemas.py
│   │       ├── ratings/            # Đánh giá & bình luận
│   │       │   ├── ratings_facade.py
│   │       │   ├── services/
│   │       │   │   └── rating_service.py
│   │       │   ├── models.py
│   │       │   └── schemas.py
│   │       ├── geo/                # Bản đồ & chỉ đường
│   │       │   ├── geo_facade.py
│   │       │   ├── services/
│   │       │   │   ├── nav_calculator.py
│   │       │   │   └── map_service.py
│   │       │   └── schemas.py
│   │       ├── ai/                 # AI Chatbox (Gemini)
│   │       │   ├── ai_facade.py
│   │       │   ├── services/
│   │       │   │   ├── gemini_service.py
│   │       │   │   └── details_service.py
│   │       │   └── schemas.py
│   │       ├── vision/             # OCR & nhận diện ảnh [EXTEND]
│   │       │   ├── vision_facade.py
│   │       │   ├── services/
│   │       │   │   ├── ocr_extractor.py
│   │       │   │   └── snapshot_service.py
│   │       │   ├── models.py
│   │       │   └── schemas.py
│   │       └── feedback/           # Suggestion bot
│   │           ├── feedback_facade.py
│   │           ├── services/
│   │           │   └── chatbot_loop.py
│   │           └── schemas.py
│   └── tests/
│       ├── unit/
│       │   ├── test_filter_engine.py
│       │   ├── test_ranking_service.py
│       │   ├── test_radius_manager.py
│       │   └── test_weight_updater.py
│       └── integration/
│           ├── test_search_flow.py
│           └── test_auth_flow.py
│
├── frontend/                       # Next.js App Router
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── public/icons/
│   └── src/
│       ├── app/                    # Next.js App Router pages
│       │   ├── layout.tsx
│       │   ├── page.tsx            # Landing page
│       │   ├── search/page.tsx     # Trang tìm kiếm chính
│       │   ├── restaurant/[id]/page.tsx
│       │   ├── auth/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── reset-password/page.tsx
│       │   └── profile/
│       │       ├── page.tsx
│       │       └── preferences/page.tsx
│       ├── components/
│       │   ├── search/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── FilterPanel.tsx
│       │   │   ├── BudgetSlider.tsx
│       │   │   └── ResultCard.tsx
│       │   ├── map/
│       │   │   ├── MapView.tsx
│       │   │   └── MarkerPopup.tsx
│       │   ├── restaurant/
│       │   │   ├── DetailModal.tsx
│       │   │   ├── PhotoGallery.tsx
│       │   │   └── RatingForm.tsx
│       │   ├── ai/
│       │   │   └── ChatBox.tsx
│       │   └── ui/                 # Shared primitives
│       │       ├── Button.tsx
│       │       ├── Badge.tsx
│       │       └── LoadingSkeleton.tsx
│       ├── hooks/
│       │   ├── useSearch.ts
│       │   ├── useGPS.ts
│       │   └── useAuth.ts
│       ├── lib/
│       │   ├── api.ts              # Axios wrapper với JWT injection
│       │   ├── constants.ts        # RADIUS_OPTIONS, CONCEPTS...
│       │   └── utils.ts            # formatPrice, formatDistance...
│       └── store/
│           ├── searchStore.ts      # Zustand: filter state
│           └── authStore.ts        # Zustand: user session
│
├── docker-compose.yml              # Backend + PostgreSQL + Redis
├── docker-compose.dev.yml          # Hot-reload dev overrides
├── .env.example                    # Template — không commit .env thật
└── README.md
```

---

## Yêu cầu hệ thống

- **Docker Desktop** ≥ 24 và **Docker Compose** ≥ 2.20 (khuyến nghị, đơn giản nhất)
- Hoặc cài thủ công: Python 3.11+, Node.js 18+, PostgreSQL 16+, Redis 7+
- Các API key cần có:
  - Google Gemini API key
  - Google Maps API key (Distance Matrix)
  - SMTP credentials (gửi email OTP)

---

## Cài đặt & Chạy chương trình

### 1. Clone repository

```bash
git clone https://github.com/<your-org>/foodyssey.git
cd foodyssey
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền các giá trị:

```env
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/foodyssey

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_SECONDS=3600

# Google APIs
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

> ⚠️ Không bao giờ commit file `.env` thật. Chỉ commit `.env.example`.

### 3. Chạy bằng Docker Compose (khuyến nghị)

**Môi trường production / demo:**
```bash
docker-compose up --build
```

**Môi trường development (hot-reload):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Dịch vụ sẽ chạy tại:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (Redoc): http://localhost:8000/redoc

### 4. Chạy migration và seed dữ liệu

```bash
# Chạy migration
docker-compose exec backend alembic upgrade head

# Seed dữ liệu mẫu (50+ nhà hàng)
docker-compose exec backend python -m app.scripts.seed_restaurants
```

### 5. Chạy thủ công (không dùng Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 6. Chạy tests

```bash
# Toàn bộ test suite
docker-compose exec backend pytest

# Chỉ unit tests
docker-compose exec backend pytest tests/unit/

# Chỉ integration tests
docker-compose exec backend pytest tests/integration/
```

---

## API Overview

Base URL: `https://api.foodapp.vn/api/v1` (production) / `http://localhost:8000/api/v1` (local)

Xác thực: `Authorization: Bearer <JWT>` — chỉ các endpoint có nhãn **Auth Required**.

| Method | Endpoint | Mô tả | Auth | Phase |
|---|---|---|---|---|
| POST | `/search` | Tìm kiếm nhà hàng theo filter + match_score | — | MVP |
| GET | `/restaurants/{id}` | Chi tiết một nhà hàng | — | MVP |
| GET | `/filters/options` | Danh sách concepts / purposes / amenities | — | MVP |
| POST | `/map-markers` | GeoJSON markers cho bản đồ | — | MVP |
| GET | `/restaurants/search/fulltext` | Autocomplete full-text | — | MVP |
| POST | `/ai/chatbox` | Chat với Gemini → danh sách nhà hàng | — | MVP |
| POST | `/auth/register` | Đăng ký tài khoản | — | PRODUCTION |
| POST | `/auth/login` | Đăng nhập, nhận JWT | — | PRODUCTION |
| POST | `/auth/logout` | Đăng xuất | ✅ | PRODUCTION |
| POST | `/auth/forgot-password` | Gửi OTP reset mật khẩu | — | PRODUCTION |
| POST | `/auth/reset-password` | Đặt lại mật khẩu bằng OTP | — | PRODUCTION |
| GET | `/profile/me` | Xem thông tin người dùng | ✅ | PRODUCTION |
| PATCH | `/profile/settings` | Cập nhật avatar / tên hiển thị | ✅ | PRODUCTION |
| POST | `/profile/saved-restaurants` | Lưu nhà hàng yêu thích | ✅ | PRODUCTION |
| GET | `/profile/saved-restaurants` | Danh sách nhà hàng đã lưu | ✅ | PRODUCTION |
| DELETE | `/profile/saved-restaurants/{id}` | Xoá khỏi danh sách lưu | ✅ | PRODUCTION |
| POST | `/ratings` | Gửi đánh giá (sao + bình luận + ảnh) | ✅ | PRODUCTION |
| GET | `/ratings/{restaurant_id}` | Danh sách đánh giá của nhà hàng | — | PRODUCTION |
| GET | `/geo/get-route/{restaurant_id}` | ETA + khoảng cách đến nhà hàng | — | PRODUCTION |
| POST | `/feedback/chat-assist` | Bot gợi ý khi kết quả = 0 | — | PRODUCTION |
| GET | `/ai/details-popup/{id}` | AI popup tóm tắt nhà hàng | ✅ | PRODUCTION |
| GET | `/profile/recommendations` | Gợi ý cá nhân hoá | ✅ | EXTEND |
| POST | `/vision/scan-menu` | OCR scan menu → món ăn & giá | ✅ | EXTEND |

Xem chi tiết request/response đầy đủ tại **Swagger UI**: `http://localhost:8000/docs`

### Công thức match_score

```
match_score = 0.30 × concept_score
            + 0.20 × purpose_score
            + 0.10 × amenity_score
            + 0.20 × distance_score   # = 1 - (distance_km / radius_km)
            + 0.20 × rating_score     # = rating / 5.0
```

Nếu người dùng không chọn một nhóm filter, trọng số của nhóm đó = 0 và các trọng số còn lại được giữ nguyên tỉ lệ.

---

## Kiến trúc hệ thống

Dự án dùng **Modular Monolith** — toàn bộ backend trong một process, nhưng chia module rõ ràng theo nghiệp vụ. Mỗi module tuân theo 4 lớp:

```
Route Handler (api/v1/)
    ↓ validates input
Facade (modules/*/facade.py)        ← điểm giao tiếp duy nhất giữa các module
    ↓ orchestrates
Services (modules/*/services/)      ← business logic
    ↓ reads/writes
Models + DB (SQLAlchemy + PostgreSQL)
```

**Quy tắc giao tiếp giữa module:**

```python
# ✅ ĐÚNG — gọi qua Facade
from app.modules.geo.geo_facade import geo_facade
result = geo_facade.geocode("Quận 1, TP.HCM")

# ❌ SAI — import thẳng vào service của module khác
from app.modules.geo.services.coord_handler import get_coordinates
```

**Sơ đồ phụ thuộc giữa các module:**

```
discovery_facade ──→ geo_facade.geocode()
discovery_facade ──→ profile_facade.rerank_with_preferences()
discovery_facade ──→ ai_facade.parse_chat_to_filters()    [EXTEND]
ratings_facade   ──→ profile_facade.update_weights()
feedback_facade  ──→ discovery_facade.execute_search()
auth_facade      ──→ profile_facade.create_default_preferences()
```

---

## Lộ trình phát triển

| Phase | Nội dung | Hoàn thành khi |
|---|---|---|
| **1 — Foundation** | `docker-compose.yml`, `core/database.py`, `core/security.py`, `.env.example`, Alembic base migration | `docker-compose up` khởi động backend + DB không lỗi |
| **2 — Data Layer** | Restaurant model + schema + seed 50+ nhà hàng, migration files | `GET /filters/options` trả về dữ liệu hợp lệ từ DB |
| **3 — MVP Search** | `discovery` module đầy đủ 4 lớp, `POST /search` endpoint | API trả về danh sách có `match_score` |
| **4 — Map & Detail** | `POST /map-markers`, `GET /restaurants/{id}`, autocomplete, Next.js map + card UI | Người dùng search → thấy bản đồ → click xem chi tiết |
| **5 — AI Chatbox** | Gemini integration, `POST /ai/chatbox`, `ChatBox.tsx` | Nhập câu hỏi tự nhiên → nhận gợi ý nhà hàng |
| **6 — Auth & Profile** | Tất cả `/auth/*`, profile module, saved restaurants, Next.js auth pages | Đăng ký / đăng nhập / lưu nhà hàng hoạt động |
| **7 — Ratings & Geo** | `POST /ratings`, `GET /geo/get-route`, Google Maps, `RatingForm.tsx` | Đánh giá nhà hàng + xem ETA trên trang chi tiết |
| **8 — Extend** | AI preference weights, OCR, restaurant snapshot, 2FA, personalised recommendations | Tính năng nâng cao bổ sung liên tục |

---

## Quy tắc phát triển nhóm

| Quy tắc | Lý do |
|---|---|
| Không bao giờ bỏ qua lớp Facade | Đổi tên một service chỉ ảnh hưởng 1 facade, không phá vỡ cả codebase |
| Commit nhỏ và thường xuyên theo từng lớp | Push theo thứ tự: models → schemas → services → facade → routes |
| Không commit file `.env` thật | Dùng `.env.example` — mỗi thành viên tự điền API key của mình |
| Mỗi PR chỉ có một Alembic migration | Tránh conflict schema DB trên shared dev database |
| Mọi type cross-module phải đi qua `schemas.py` | Tránh circular import, đảm bảo Pydantic validate nhất quán |
| Redis cho mọi cache và OTP token | TTL-based expiry; không lưu dữ liệu nhạy cảm có thời hạn vào PostgreSQL |

---

<div align="center">

**FoOdyssey** · Version 1.0 · 2026 · Made with 🍜 in Vietnam

</div>
