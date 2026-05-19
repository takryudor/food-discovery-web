# Tài liệu Hướng dẫn Tích hợp Frontend: Auth, AI & Activity Tracking

**Người gửi:** Thụ (AI & Logic Engineer)
**Người nhận:** Phúc (Frontend & UX Lead)
**Dự án:** FoOdyssey
**Cập nhật:** 18/05/2026

---

## 1. Cập nhật Tiến độ Backend (Thụ đã hoàn thành)
Chào Phúc, mình đã hoàn thiện hạ tầng cốt lõi cho Phase 1 và một phần Phase 3. Dưới đây là những gì mình đã làm trên Backend mà bạn cần biết để tích hợp:

### 1.1. Hệ thống Định danh (Supabase Auth Integration)
- **Middleware:** Đã triển khai Dependency `get_current_user` để xác thực JWT Token từ Supabase.
- **Security:** Backend sẽ tự động từ chối (401 Unauthorized) các request quan trọng nếu thiếu token hoặc token giả.

### 1.2. Hạ tầng Ghi nhận Hành vi (Activity Tracking)
- **ActivityService:** Đã tạo dịch vụ xử lý lưu trữ log hành động người dùng (`VIEW`, `SEARCH`, `FAVORITE`).
- **Database:** Đã migration bảng `user_activities`, cho phép ghi log tìm kiếm ngay cả khi không gắn với một địa điểm cụ thể.

### 1.3. Tối ưu hóa AI & Search (Groq/Llama 3)
- **Intent Extraction:** AI giờ đây có khả năng tách biệt thông minh giữa 'địa điểm' và 'từ khóa' (ví dụ: "quán chay ở Quận 1" -> Keyword: "quán chay", Location: "Quận 1").
- **Strict Filtering:** Backend sẽ lọc kết quả theo địa điểm thực tế từ Database trước khi đưa cho AI trả lời, đảm bảo thông tin chính xác 100%.
- **Hallucination Fix:** Đã chặn đứng việc AI tự "chế" quán không có trong database.

---

## 2. Nhiệm vụ Tích hợp cho Frontend

### 2.1. Quản lý Authentication
Frontend cần đảm bảo mọi request đến Backend đều kèm theo **Access Token**.
- **Library khuyến nghị:** `@supabase/auth-ui-react` cho giao diện và `supabase-js` cho logic.
- **Header bắt buộc:** `Authorization: Bearer <JWT_TOKEN>`

### 2.2. Kích hoạt 3 Tín hiệu AI (Signals)
Để AI có thể học hỏi và gợi ý chính xác cho người dùng, bạn cần gọi các endpoint sau đúng thời điểm:

#### A. Tín hiệu XEM (VIEW)
- **Endpoint:** `GET /api/v1/restaurants/{id}`
- **Thời điểm:** Khi người dùng click vào xem chi tiết một quán.
- **Backend xử lý:** Tự động ghi log `VIEW` vào database.

#### B. Tín hiệu TÌM KIẾM (SEARCH)
- **Endpoint:** `POST /api/v1/search`
- **Payload:** `{ "query": "...", "location": "..." }`
- **Backend xử lý:** Ghi log `SEARCH` kèm từ khóa để phân tích xu hướng sở thích.

#### C. Tín hiệu YÊU THÍCH (FAVORITE) - **Yêu cầu UI mới**
- **Endpoint:** `POST /api/v1/users/favorite/{restaurant_id}`
- **Mục tiêu:** Phúc cần thêm nút "Tim" hoặc "Bookmark" trên card nhà hàng.
- **Backend xử lý:** Cập nhật bảng favorites và ghi log `FAVORITE` (trọng số cao nhất cho AI).

---

## 3. Tích hợp AI Chatbot (Mới)
Khi gọi API AI Chat (`/api/v1/ai/chat`), hãy đảm bảo truyền đủ context nếu có thể. Backend hiện tại đã hỗ trợ:
1. **Lọc địa điểm:** Nếu người dùng đang đứng ở Quận 1, hãy truyền tọa độ/địa điểm để AI ưu tiên kết quả gần đó.
2. **Cá nhân hóa:** Backend sẽ tự động lấy lịch sử `FAVORITE` và `VIEW` của người dùng (thông qua token) để AI đưa ra lời khuyên "Hợp gu với bạn".

---

## 4. Kiểm tra & Debug
- **Lỗi 401:** Token thiếu hoặc hết hạn. Hãy kiểm tra logic refresh session của Supabase.
- **Lỗi 422:** Payload gửi lên không khớp với Pydantic Schema của mình (Check tab Network).
- **Log Kiểm tra:** Mình đã tạo script `scripts/test_auth_logging.py` để test, bạn có thể tham khảo logic gửi request trong đó.

---

