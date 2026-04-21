<div align="center">

# 🍜 FoOdyssey

**Food Discovery Web — Vietnam**

Nền tảng khám phá ẩm thực thông minh, giúp người dùng tìm quán ăn phù hợp theo vị trí, ngân sách, phong cách và mục đích chuyến đi.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135+-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16+-000000?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql&logoColor=white)
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

FoOdyssey là ứng dụng web khám phá ẩm thực dành cho người dùng tại Việt Nam. Người dùng có thể tìm kiếm quán ăn theo vị trí, bộ lọc và từ khóa, xem kết quả trên bản đồ, và nhận gợi ý từ AI chatbox.

Dự án chạy theo kiến trúc modular trong cùng một monorepo (backend FastAPI + frontend Next.js). Ở trạng thái hiện tại, backend đã có route chính cho `search`, `filters`, `restaurants`, `geo`, `ai`; frontend tách route rõ ràng theo App Router gồm `Home` (`/`), `Map` (`/map`) và `Explore` (`/explore`).

---

## Tính năng

### Đã implement trong codebase hiện tại

- Tìm kiếm nhà hàng qua `POST /search` với query + bộ lọc + phân trang.
- Lấy options cho filter qua `GET /filters/options` (có cache in-memory TTL).
- Xem chi tiết nhà hàng qua `GET /restaurants/{restaurant_id}`.
- Autocomplete full-text qua `GET /restaurants/search/fulltext`.
- Lấy map markers qua `POST /geo/map-markers` (và alias `POST /map-markers`).
- Tính ETA/khoảng cách qua `GET /geo/get-route/{restaurant_id}` (Google Distance Matrix API, có fallback mock nếu thiếu API key).
- AI chatbox qua `POST /ai/chatbox` dùng Groq + dữ liệu DB để đề xuất quán.
- Frontend map/search flow: tải filter, tìm kiếm, hiển thị marker, detail panel.
- Frontend có chế độ mock data bật mặc định (toggle trực tiếp trên UI map view).
- Frontend auth context hiện là mock state cục bộ (chưa kết nối auth backend).

### Production — Full Product (dự định giữ nguyên)

- Đăng ký / Đăng nhập / Đăng xuất (JWT + bcrypt), xác thực email OTP
- Quên / Đặt lại mật khẩu qua OTP có thời hạn
- Lưu nhà hàng yêu thích
- Đánh giá 1–5 sao, bình luận và upload ảnh
- Chỉ đường & ETA (Google Maps API): đi bộ / xe máy / ô tô
- AI popup chi tiết nhà hàng (summary + cache theo restaurant)
- Feedback bot gợi ý khi kết quả tìm kiếm = 0 (nới rộng bán kính / ngân sách)

### Extend — Advanced Features (dự định giữ nguyên)

- Hồ sơ sở thích AI: học từ hành vi người dùng (đánh giá, lưu, lọc thường xuyên)
- Gợi ý cá nhân hoá dựa trên preference weights
- OCR scan menu bằng TrOCR (HuggingFace) — trích xuất món ăn & giá
- Nhận diện nhà hàng qua ảnh chụp (Restaurant Snapshot Recognition)
- Xác thực 2 yếu tố (2FA / TOTP)
- Tối ưu tuyến đường nhiều điểm dừng

---

## Tech Stack

| Thành phần            | Công nghệ                                           |
| --------------------- | --------------------------------------------------- |
| Backend               | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic        |
| Database              | PostgreSQL (qua `psycopg`)                          |
| Frontend              | Next.js 16 (App Router), React 19, TypeScript       |
| UI                    | Tailwind CSS 4, Radix UI, Framer Motion             |
| State Management      | Zustand (UI + stores tách theo search/filter/map)   |
| Maps                  | Leaflet / React-Leaflet, Google Distance Matrix API |
| AI / NLP              | Groq API (qua `GroqClient`)                         |
| Auth (frontend state) | Mock `AuthContext` + Supabase client đã chuẩn bị    |
| Containerisation      | Docker Compose                                      |

---

## Cấu trúc Repository

```text
food-discovery-web/
├── docker-compose.yml
├── .env.example
├── README.md
├── SETUP.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py
│   │   ├── router.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── infrastructure/
│   │   │   └── groq_client.py
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   ├── discovery/
│   │   │   └── geo/
│   │   ├── routes/
│   │   │   ├── ai.py
│   │   │   ├── filters.py
│   │   │   ├── geo.py
│   │   │   ├── restaurants.py
│   │   │   └── search.py
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── scripts/
│   └── tests/
│       ├── integration/
│       └── unit/
└── frontend/
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── map/page.tsx
    │   │   ├── explore/page.tsx
    │   │   ├── _components/
    │   │   └── providers.tsx
    │   ├── components/
    │   │   ├── auth/
    │   │   ├── common/
    │   │   ├── feedback/
    │   │   ├── map/
    │   │   ├── providers/
    │   │   ├── restaurant/
    │   │   │   └── components/
    │   │   └── ui/
    │   ├── hooks/
    │   ├── store/
    │   │   ├── uiStore.ts
    │   │   ├── searchStore.ts
    │   │   ├── filterStore.ts
    │   │   └── mapStore.ts
    │   └── lib/
    │       ├── api/
    │       │   ├── client.ts
    │       │   ├── ai.ts
    │       │   ├── filters.ts
    │       │   ├── search.ts
    │       │   ├── geo.ts
    │       │   ├── restaurant.ts
    │       │   └── index.ts
    │       ├── api.ts (deprecated compatibility layer)
    │       ├── mockData.ts
    │       └── supabase.ts
    └── public/
```

---

## Yêu cầu hệ thống

- Docker Desktop >= 24 và Docker Compose >= 2.20 (khuyến nghị)
- Hoặc cài thủ công:
  - Python 3.11+
  - Node.js 20+
  - PostgreSQL 16+

Biến môi trường chính:

- Bắt buộc cho local backend/frontend:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
- Tùy chọn theo tính năng:
  - `GOOGLE_MAPS_API_KEY` (route ETA thực tế; thiếu key sẽ dùng mock route)
  - `GROQ_API_KEY` (AI chatbox)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (khi bật luồng Supabase)

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

Điền các giá trị cần thiết trong `.env` (đặc biệt `DATABASE_URL`).

### 3. Chạy bằng Docker Compose

```bash
docker compose up --build
```

Dịch vụ mặc định:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Migration và seed dữ liệu

`docker-compose.yml` đã chạy `alembic upgrade head` khi khởi động backend. Có thể chạy tay:

```bash
docker compose exec backend alembic upgrade head
```

Seed demo data:

```bash
docker compose exec backend python scripts/seed_demo.py
```

### 5. Chạy thủ công (không dùng Docker)

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### 6. Chạy tests

```bash
cd backend
pytest
```

Ghi chú: nhiều test integration hiện là test mô phỏng/placeholder, dùng để mô tả flow và dữ liệu mẫu.

---

## API Overview

Base URL local: `http://localhost:8000`

| Method | Endpoint                         | Mô tả                                         | Trạng thái  |
| ------ | -------------------------------- | --------------------------------------------- | ----------- |
| GET    | `/`                              | Trạng thái backend + link docs                | Implemented |
| GET    | `/health`                        | Health check                                  | Implemented |
| GET    | `/filters/options`               | Danh sách filter options                      | Implemented |
| POST   | `/search`                        | Tìm kiếm nhà hàng theo filter/query/location  | Implemented |
| GET    | `/restaurants/{restaurant_id}`   | Chi tiết nhà hàng                             | Implemented |
| GET    | `/restaurants/search/fulltext`   | Gợi ý autocomplete                            | Implemented |
| POST   | `/geo/map-markers`               | GeoJSON markers theo danh sách restaurant ids | Implemented |
| POST   | `/map-markers`                   | Alias của endpoint map markers                | Implemented |
| GET    | `/geo/get-route/{restaurant_id}` | ETA + khoảng cách                             | Implemented |
| POST   | `/ai/chatbox`                    | AI gợi ý nhà hàng từ hội thoại                | Implemented |

Các endpoint như `/auth/*`, `/profile/*`, `/ratings/*`, `/vision/*` vẫn thuộc roadmap, chưa được expose ở backend hiện tại.

### Match score hiện tại

Điểm `match_score` đang được tính động theo tín hiệu có trong request/query:

- Concept overlap
- Purpose overlap
- Amenity overlap
- Text relevance (FTS/ILIKE)
- Rating boost (nếu có)

Trọng số gốc trong code:

- concept: `0.35`
- purpose: `0.35`
- amenity: `0.20`
- text: `0.10`
- rating boost: `0.08`

Các trọng số này được chuẩn hoá lại theo nhóm tín hiệu thực sự có mặt, nên không phải lúc nào cũng dùng cùng một công thức cố định.

---

## Kiến trúc hệ thống

Backend hiện tại theo hướng tách lớp route/service/module trong cùng một codebase:

```text
Routes (app/routes/*)
  -> app/services/* (search, restaurants, review)
  -> app/modules/ai/* (chatbox + groq)
  -> app/modules/geo/* (map markers + route ETA)
  -> DB models (SQLAlchemy)
```

Các module nghiệp vụ đang có mặt rõ ràng trong repo:

- `modules/discovery`
- `modules/geo`
- `modules/ai`

Các module `auth/profile/ratings/vision/feedback` vẫn là định hướng roadmap, chưa có implementation đầy đủ trong backend hiện tại.

Frontend hiện tại tách theo layer + domain để giảm coupling và tránh "god module":

- `components/common`: UI component tái sử dụng thuần
- `components/providers`: các context provider (language, ...)
- `components/feedback`: dialog/toast/completion feedback
- `components/restaurant/components`: thành phần UI thuộc domain restaurant
- `app/page.tsx`, `app/map/page.tsx`, `app/explore/page.tsx`: route entry theo chuẩn App Router
- `store/uiStore.ts`: state giao diện dùng chung (theme)
- `store/searchStore.ts`, `store/filterStore.ts`, `store/mapStore.ts`: tách state theo trách nhiệm
- `lib/api/client.ts`: fetch wrapper + token injection + error handling
- `lib/api/*`: business API module; `lib/api.ts` chỉ giữ compatibility tạm thời

---

## Lộ trình phát triển

Phần này giữ nguyên định hướng sản phẩm, nhưng trạng thái thực tế hiện tại tập trung ở các mốc search + map + AI chatbox:

| Phase                      | Nội dung                                         | Trạng thái hiện tại             |
| -------------------------- | ------------------------------------------------ | ------------------------------- |
| 1 — Foundation             | Docker Compose, config, DB session, Alembic base | Done                            |
| 2 — Data Layer             | Models + migration + seed data                   | Done (ở mức demo data hiện tại) |
| 3 — MVP Search             | Search/filter/ranking + endpoint `/search`       | Done                            |
| 4 — Map & Detail           | markers + restaurant detail + fulltext + map UI  | Done                            |
| 5 — AI Chatbox             | AI recommend endpoint + UI chatbox               | Done (Groq)                     |
| 6 — Auth & Profile         | `/auth/*`, profile, saved restaurants            | Planned                         |
| 7 — Ratings & Geo nâng cao | rating flow đầy đủ, geo nâng cao                 | Planned                         |
| 8 — Extend                 | preference AI, OCR, snapshot, 2FA                | Planned                         |

---

## Quy tắc phát triển nhóm

| Quy tắc                                                        | Lý do                                        |
| -------------------------------------------------------------- | -------------------------------------------- |
| Tài liệu phải phản ánh đúng trạng thái implementation hiện tại | Tránh over-claim và lệch kỳ vọng khi handoff |
| Giữ roadmap tách biệt với phần "đã implement"                  | Dễ theo dõi tiến độ theo phase               |
| Không commit file `.env` thật                                  | Chỉ commit `.env.example`                    |
| Mỗi PR nên tập trung một cụm thay đổi (API/UI/DB)              | Dễ review và rollback                        |
| Sau khi đổi endpoint/schema, cập nhật README cùng PR           | Giữ docs luôn đồng bộ với code               |

---

<div align="center">

**FoOdyssey** · Version 1.0 · 2026 · Made with 🍜 in Vietnam

</div>
