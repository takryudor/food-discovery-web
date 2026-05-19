# Đối chiếu mục §2 — Nhiệm vụ Tích hợp cho Frontend

> Tài liệu tham chiếu: [Frontend_Integration_Guide.md](../../Frontend_Integration_Guide.md)  
> Phạm vi đánh giá: branch `feature/fe-auth-supabase` (frontend FoOdyssey)  
> Cập nhật: 2026-05-19

---

## Tóm tắt nhanh

| Mục | Trạng thái | Mức hoàn thành |
|-----|------------|----------------|
| **§2.1 Authentication** | Đã xong (~95%) | JWT + Supabase session, login/register/settings |
| **§2.2.A VIEW** | Đã có gọi API; log chỉ khi đăng nhập | ~70% |
| **§2.2.B SEARCH** | Đã có gọi API; log chỉ khi đăng nhập | ~70% |
| **§2.2.C FAVORITE** | Đã làm | ~95% |
| **§2 tổng thể** | Đủ 3 tín hiệu AI (khi đã login) | ~90% |

```
§2.1 Auth          ████████████████████  ~95%
§2.2.A VIEW        ██████████████░░░░░░  ~70%
§2.2.B SEARCH      ██████████████░░░░░░  ~70%
§2.2.C FAVORITE    ███████████████████░  ~95%
```

---

## §2.1 — Quản lý Authentication

### Yêu cầu (guide)

- Mọi request tới Backend kèm **Access Token**.
- Library khuyến nghị: `@supabase/auth-ui-react` + `supabase-js`.
- Header bắt buộc: `Authorization: Bearer <JWT_TOKEN>`.

### Thực tế trên codebase

| Yêu cầu | Trạng thái | Chi tiết |
|---------|------------|----------|
| `Authorization: Bearer` | ✅ | `frontend/src/lib/api/client.ts` — `setAuthTokenResolver` + merge header trong `apiFetch` |
| `supabase-js` | ✅ | `frontend/src/lib/supabase.ts` — `persistSession`, `autoRefreshToken`, `detectSessionInUrl` |
| `@supabase/auth-ui-react` | ⚪ Không dùng | Modal custom: `LoginModal`, `RegisterModal` (chấp nhận được) |
| Login / logout / session | ✅ | `frontend/src/components/auth/AuthContext.tsx` |
| Đăng ký | ✅ | `RegisterModal` → `signUp` |
| Cài đặt tài khoản | ✅ (mở rộng) | `AccountSettingsModal` — tên, avatar, đổi mật khẩu |
| Env Supabase | ✅ | `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### Kết luận §2.1

**Đạt** yêu cầu cốt lõi Phase 1 (định danh + JWT cho API).

---

## §2.2 — Kích hoạt 3 Tín hiệu AI (Signals)

Backend ghi activity qua `ActivityService` khi FE gọi đúng endpoint **và** user đã xác thực (`get_current_user` trên các route liên quan).

---

### §2.2.A — Tín hiệu XEM (VIEW)

#### Yêu cầu (guide)

| Hạng mục | Nội dung |
|----------|----------|
| Endpoint | `GET /api/v1/restaurants/{id}` |
| Thời điểm | Khi user click xem chi tiết quán |
| Backend | Tự ghi log `VIEW` |

#### Thực tế

| Hạng mục | Trạng thái | Chi tiết |
|----------|------------|----------|
| API wrapper | ✅ | `getRestaurantDetail()` — `frontend/src/lib/api/restaurant.ts` → `GET /restaurants/{id}` |
| Path prefix | ✅ | `API_V1_PREFIX` có thể rỗng trong `.env` → path khớp BE hiện tại |
| Gọi khi xem detail | ✅ | `MapComponent.tsx` (click marker); `OdysseusAI.tsx` (resolve quán) |
| JWT kèm request | ✅ | Qua `apiFetch` khi đã login |
| Log `VIEW` trên BE | ⚠️ | Chỉ khi **đã đăng nhập** — `restaurants.py` bắt buộc `get_current_user` |
| Guest (chưa login) | ❌ | API thật trả **401**; mock mode vẫn xem được |

#### Kết luận §2.2.A

**Đã tích hợp gọi API**; **activity VIEW chỉ hoạt động sau login**.

---

### §2.2.B — Tín hiệu TÌM KIẾM (SEARCH)

#### Yêu cầu (guide)

| Hạng mục | Nội dung |
|----------|----------|
| Endpoint | `POST /api/v1/search` |
| Payload | `{ "query": "...", "location": "..." }` |
| Backend | Ghi log `SEARCH` |

#### Thực tế

| Hạng mục | Trạng thái | Chi tiết |
|----------|------------|----------|
| API wrapper | ✅ | `searchRestaurants()` — `frontend/src/lib/api/search.ts` → `POST /search` |
| Gọi khi search | ✅ | `MapView.tsx` (filter / query / đổi vị trí) |
| `query` | ✅ | Truyền trong payload |
| `location` | ✅ (khác ví dụ guide) | FE gửi `{ lat, lng }` — đúng `SearchRequest` backend (`backend/app/schemas/search.py`) |
| JWT kèm request | ✅ | Khi đã login |
| Log `SEARCH` trên BE | ⚠️ | Chỉ khi **đã đăng nhập** — `search.py` bắt buộc `get_current_user` |
| Guest | ❌ | Search API thật → **401** nếu chưa login |

#### Kết luận §2.2.B

**Đã tích hợp endpoint và payload**; **activity SEARCH chỉ khi login**.

---

### §2.2.C — Tín hiệu YÊU THÍCH (FAVORITE)

#### Yêu cầu (guide)

| Hạng mục | Nội dung |
|----------|----------|
| Endpoint | `POST /api/v1/users/favorite/{restaurant_id}` |
| UI | Nút Tim / Bookmark trên card nhà hàng |
| Backend | Cập nhật favorites + log `FAVORITE` |

#### Thực tế

| Hạng mục | Trạng thái | Chi tiết |
|----------|------------|----------|
| API wrapper | ✅ | `toggleFavorite()` — `frontend/src/lib/api/users.ts` |
| Gọi `POST /users/favorite/{id}` | ✅ | Qua `apiFetch` + JWT khi đã login |
| Nút Tim trên detail map | ✅ | `FavoriteButton` trên `RestaurantDetailPanel` (`MapComponent.tsx`) |
| Menu **Quán đã lưu** | ✅ | `SavedPlacesModal` từ `UserMenu.tsx` |
| State favorites | ✅ | `favoritesStore` + `useFavorites` (cache localStorage theo user) |
| Guest chưa login | ⚠️ | Nút Tim mở `LoginModal` trên map; mock mode vẫn toggle local |
| i18n | ✅ | `addToFavorites`, `removeFromFavorites`, `noSavedPlaces`, `loginToFavorite` |

#### Kết luận §2.2.C

**Đã hoàn thành** — FAVORITE signal khi user bật yêu thích (đã đăng nhập + backend thật).

---

## Phụ lục

### File liên quan (đã có)

```
frontend/src/lib/supabase.ts
frontend/src/lib/api/client.ts
frontend/src/lib/auth/authErrors.ts
frontend/src/lib/auth/profile.ts
frontend/src/components/auth/AuthContext.tsx
frontend/src/components/auth/LoginModal.tsx
frontend/src/components/auth/RegisterModal.tsx
frontend/src/components/auth/AccountSettingsModal.tsx
frontend/src/components/auth/UserMenu.tsx
frontend/src/lib/api/restaurant.ts      → VIEW signal (gọi API)
frontend/src/lib/api/search.ts          → SEARCH signal (gọi API)
frontend/src/components/map/MapComponent.tsx
frontend/src/components/map/MapView.tsx
```

### File đã thêm (§2.2.C)

```
frontend/src/lib/api/users.ts
frontend/src/store/favoritesStore.ts
frontend/src/hooks/useFavorites.ts
frontend/src/components/favorites/FavoriteButton.tsx
frontend/src/components/favorites/SavedPlacesModal.tsx
```

### Lưu ý môi trường

- `NEXT_PUBLIC_API_BASE_URL` thường là `http://localhost:8000` (prefix `/api/v1` tùy `API_V1_PREFIX` trên backend).
- Backend cần `SUPABASE_JWT_SECRET` khớp project Supabase.
- Upload avatar cần bucket Storage `avatars` + policies trên Supabase.

### §3 — Ngoài phạm vi §2 (tham khảo)

Guide §3 (AI Chat `/api/v1/ai/chat`):

- App hiện dùng `POST /ai/chatbox` qua `sendChatboxMessage` (`frontend/src/lib/api/ai.ts`).
- Có JWT khi login; **chưa** truyền đầy đủ location/context như mô tả §3.

---

## Checklist hoàn thiện §2

- [x] §2.1 — Supabase auth + Bearer token trên API client
- [x] §2.2.A — Gọi `GET /restaurants/{id}` khi xem chi tiết
- [x] §2.2.B — Gọi `POST /search` khi tìm kiếm (payload `query` + `location` lat/lng)
- [x] §2.2.C — `POST /users/favorite/{id}` + UI nút Tim
- [x] (Tuỳ chọn) UX guest: login prompt khi bấm Tim trên map (`LoginModal` trong `MapView`)
- [x] (Tuỳ chọn) Modal **Quán đã lưu** (`SavedPlacesModal`)
- [ ] (Tuỳ chọn) Login prompt trước search/view hoặc BE cho anonymous (VIEW/SEARCH vẫn 401 khi guest)

---

## Liên kết

- [Frontend Integration Guide](../../Frontend_Integration_Guide.md)
- PR branch: `feature/fe-auth-supabase`
