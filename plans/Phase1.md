# Kế hoạch Triển khai Phase 1: Ghi nhận Hành vi Người dùng (Dành cho Thụ)

## 1. Mục tiêu (Objective)
Thiết lập hệ thống ghi nhận nhật ký hành vi (User Behavior Logs) làm nền tảng cho thuật toán Recommendation Scoring ở Phase 3. 
**Ưu tiên:** Tích hợp Supabase Auth trước để định danh người dùng chính xác.

## 2. Các file liên quan
- `backend/app/core/config.py` (Cấu hình Supabase)
- `backend/app/core/dependencies.py` (Hàm get_current_user)
- `backend/app/services/activity_service.py` (Ghi log)
- `backend/app/routes/restaurants.py` (VIEW)
- `backend/app/routes/search.py` (SEARCH)

## 3. Các bước thực hiện chi tiết

### Bước 0: Tích hợp Supabase Auth (Mới)
- Cài đặt thư viện `python-jose[cryptography]` để xử lý JWT.
- Cập nhật `backend/app/core/config.py`: Thêm `supabase_jwt_secret`.
- Triển khai `get_current_user` trong `backend/app/core/dependencies.py`:
    - Giải mã JWT từ Header.
    - Tìm User trong DB dựa trên `supabase_id`.

### Bước 1: Xây dựng ActivityService
- Tạo file `backend/app/services/activity_service.py`.
- Triển khai hàm `log_activity(db: Session, user_id: int, action_type: str, place_id: int = None)`.

### Bước 2: Tích hợp ghi nhận VIEW (Xem chi tiết)
- Sử dụng `Depends(get_current_user)` trong route.
- Gọi `activity_service.log_activity(..., action_type="VIEW")`.

### Bước 3: Tích hợp ghi nhận SEARCH (Tìm kiếm)
- Sử dụng `Depends(get_current_user)` trong route.
- Gọi `activity_service.log_activity(..., action_type="SEARCH")`.

## 4. Phối hợp (Coordination)
- **Trân (Backend Architect)**: Cập nhật Migration cho bảng `user_activities` (place_id nullable).
- **Phúc (Frontend)**: Gửi Bearer Token trong mỗi request API.
