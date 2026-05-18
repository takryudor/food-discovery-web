# Tài liệu Hướng dẫn Tích hợp Frontend: Supabase Auth & Activity Tracking

**Người gửi:** Thụ (Backend & AI)
**Người nhận:** Phúc (Frontend & UX Lead)
**Dự án:** FoOdyssey

---

## 1. Tổng quan
Backend hiện đã hoàn thiện hạ tầng xác thực người dùng và ghi nhận hành vi (User Behavior Logging). Để hệ thống hoạt động, Frontend cần tích hợp Supabase Auth và gửi Token trong mọi request API.

## 2. Nhiệm vụ của Frontend

### 2.1. Tích hợp Supabase Auth UI
Sử dụng thư viện chính chủ của Supabase để triển khai nhanh màn hình Đăng nhập/Đăng ký.
- **Library:** `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`
- **Tài liệu:** [Supabase Auth UI Docs](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

### 2.2. Gửi Authorization Header
Tất cả các request API đến Backend (đặc biệt là các route Nhà hàng và Search) bắt buộc phải kèm theo JWT Token của người dùng đang đăng nhập.

**Định dạng Header:**
```http
Authorization: Bearer <YOUR_SUPABASE_ACCESS_TOKEN>
```

**Ví dụ với `fetch` trong Next.js:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch('http://localhost:8000/api/v1/restaurants/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 3. Các Endpoint cần lưu ý (Phase 1)

### 3.1. Xem chi tiết nhà hàng (`GET /restaurants/{id}`)
- **Hành vi:** Backend sẽ tự động ghi log `VIEW` khi nhận được request hợp lệ kèm token.
- **Yêu cầu:** Gửi token ngay khi người dùng mở chi tiết quán.

### 3.2. Tìm kiếm (`POST /search`)
- **Hành vi:** Backend sẽ tự động ghi log `SEARCH` kèm theo từ khóa tìm kiếm.
- **Yêu cầu:** Đảm bảo request này luôn có token để AI có thể học hỏi từ thói quen tìm kiếm của người dùng.

### 3.3. Yêu thích (`POST /users/favorite/{restaurant_id}`) - **NEW**
- **Hành vi:** Bật/tắt trạng thái yêu thích và ghi log `FAVORITE`.
- **Yêu cầu:** Phúc cần thêm nút "Tim" hoặc "Yêu thích" trên UI và gọi endpoint này.

## 4. Kiểm tra (Verification)
Phúc có thể kiểm tra tab **Network** trong trình duyệt để đảm bảo header `Authorization` đang được gửi đi. Nếu Backend trả về `401 Unauthorized`, nghĩa là token bị thiếu hoặc hết hạn.

---
*Mọi thắc mắc về cấu hình JWT Secret hoặc lỗi xác thực, vui lòng phản hồi lại cho Thụ.*
