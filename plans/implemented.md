# Nhật ký Công việc đã Hoàn thành (Implemented Works)

## 1. Tối ưu hóa AI Chatbot (Xử lý "các quán chay")
- **AI-Powered Intent Extraction:** Triển khai phương thức `extract_intent` trong `GroqClient` sử dụng Llama 3 để phân tách rõ ràng 'địa điểm' (location) và 'từ khóa' (query) từ câu hỏi người dùng.
- **Lọc địa điểm nghiêm ngặt (Strict Location Filtering):** Cập nhật `GroqService` để lọc các kết quả từ Database theo đúng địa điểm người dùng yêu cầu trước khi đưa vào ngữ cảnh cho AI.
- **Siết chặt System Prompt:** Cập nhật hướng dẫn cho AI để tránh tình trạng "gượng ép" kết quả không liên quan và bắt buộc sử dụng `restaurant_id: 0` cho các gợi ý nằm ngoài database.
- **Cơ chế Fallback Hallucination:** Thêm logic xử lý khi AI tự chế ID nhưng vẫn có tọa độ hợp lệ, chuyển đổi chúng thành gợi ý ngoại lai (external suggestion).

## 2. Phase 1: Hạ tầng Ghi nhận Hành vi Người dùng (User Behavior Tracking)
- **Tích hợp Supabase Auth (Định danh người dùng):**
    - Cài đặt `python-jose` để giải mã JWT.
    - Triển khai dependency `get_current_user` trong `app/core/dependencies.py` để xác thực Supabase JWT.
    - Thêm cấu hình Supabase vào `app/core/config.py`.
- **Hệ thống Activity Logging:**
    - Tạo `ActivityService` tại `app/services/activity_service.py` để xử lý việc lưu trữ vào bảng `user_activities`.
    - Cập nhật model `UserActivity` để trường `place_id` có thể nhận giá trị `NULL` (phục vụ log hành động SEARCH chung).
    - Tạo và thực thi bản migration Alembic `945d8f675bd4` để cập nhật cấu hình Database.
- **Tích hợp vào các Endpoint:**
    - **VIEW:** Tích hợp logging vào `GET /api/v1/restaurants/{id}`.
    - **SEARCH:** Tích hợp logging vào `POST /api/v1/search`.
    - **FAVORITE:** Tạo mới router `app/routes/users.py` với endpoint `POST /api/v1/users/favorite/{restaurant_id}` để vừa cập nhật danh sách yêu thích vừa ghi log hành vi.
    - Đăng ký router `users` vào hệ thống `app/router.py`.

## 3. Các file đã tạo/sửa đổi chính
- `backend/app/core/dependencies.py`
- `backend/app/core/config.py`
- `backend/app/services/activity_service.py`
- `backend/app/infrastructure/groq_client.py`
- `backend/app/modules/ai/services/groq_service.py`
- `backend/app/routes/users.py`
- `backend/app/routes/restaurants.py`
- `backend/app/routes/search.py`
- `backend/app/db/models.py`
- `backend/requirements.txt`
