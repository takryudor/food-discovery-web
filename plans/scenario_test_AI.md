# FoOdyssey AI Chatbox - Kịch bản Kiểm thử Hệ thống (Testing Scenarios)

Tài liệu này tổng hợp các kịch bản kiểm thử cho AI Chatbox, tập trung vào khả năng trích xuất ý định (Intent), lọc địa điểm nghiêm ngặt và xử lý thông tin cá nhân hóa dựa trên những cập nhật mới nhất từ Backend.

## 1. Môi trường Kiểm thử
- **Endpoint:** `POST /api/v1/ai/chatbox` (hoặc `/ai/chatbox` tùy route)
- **Header:** `Authorization: Bearer <TOKEN>` (Bắt buộc để kiểm tra tính năng cá nhân hóa)

---

## 2. Các Nhóm Kịch bản (Scenarios)

### Nhóm A: Kiểm thử Trích xuất Ý định (Intent Extraction)
**Mục tiêu:** Đảm bảo AI tách được đúng món ăn và địa điểm từ câu hỏi tự nhiên.

| ID | Câu hỏi (Message) | Kết quả mong đợi (Intent) | Ghi chú |
|:---|:---|:---|:---|
| A1 | "Tìm quán bún bò ở Quận 1" | `query: "bún bò"`, `location: "Quận 1"` | Trường hợp cơ bản. |
| A2 | "có chỗ nào ăn chay gần đây không?" | `query: "chay"`, `location: "gần đây"` | Xử lý từ khóa "gần đây". |
| A3 | "muốn uống cà phê không gian yên tĩnh q3" | `query: "cà phê không gian yên tĩnh"`, `location: "q3"` | Viết tắt Quận 3. |

### Nhóm B: Kiểm thử Lọc Địa điểm Nghiêm ngặt (Strict Filtering)
**Mục tiêu:** Đảm bảo AI chỉ gợi ý quán trong DB đúng Quận yêu cầu, không gượng ép kết quả sai lệch.

| ID | Câu hỏi (Message) | Kết quả mong đợi | Hành vi Backend |
|:---|:---|:---|:---|
| B1 | "Quán phở ở Quận 7" | Trả về các quán Phở có địa chỉ thuộc Quận 7 trong DB. | `GroqService` lọc substring "Quận 7" trong address. |
| B2 | "Tìm sushi ở Quận 2" | Trả về quán Sushi tại Quận 2 hoặc TP. Thủ Đức. | Ưu tiên quán trong DB. |
| B3 | "Quán ốc ở Cần Thơ" | "Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này" | Early Exit kích hoạt (Chặn tỉnh khác). |
| B4 | "Tìm quán bún bò huế" | Trả về quán Bún bò Huế tại TP.HCM. | Bỏ qua lọc "Huế" vì là tên món ăn (Fix logic). |

### Nhóm C: Kiểm thử Chống ảo giác (Anti-Hallucination)
**Mục tiêu:** AI không được tự chế quán hoặc phải đánh dấu rõ quán ngoài DB.

| ID | Câu hỏi (Message) | Kết quả mong đợi | Logic Check |
|:---|:---|:---|:---|
| C1 | "Quán Pizza 4P's Bến Thành" | Trả về đúng quán Pizza 4P's kèm `restaurant_id` từ DB. | Ưu tiên khớp ID trong Context. |
| C2 | "Quán ăn nào mới mở ở Quận 1" (Không có trong DB) | Có thể gợi ý quán nổi tiếng ngoài DB nhưng `restaurant_id` PHẢI là `0`. | AI tự cung cấp Lat/Lng và ghi chú ngoại lai. |
| C3 | "Quán cơm tấm ngon nhất vũ trụ" | Trả về gợi ý từ DB hoặc thông báo không tìm thấy. | Không được trả về ID lung tung. |

### Nhóm D: Kiểm thử Cá nhân hóa & Hoạt động (Personalization)
**Mục tiêu:** AI sử dụng lịch sử `FAVORITE` và `VIEW` của người dùng để đưa ra lời khuyên.

| ID | Câu hỏi (Message) | Kết quả mong đợi | Ghi chú |
|:---|:---|:---|:---|
| D1 | "Gợi ý quán hợp gu với tôi" | AI nhắc đến sở thích của người dùng (ví dụ: "Vì bạn thích đồ Nhật..."). | Backend truyền `user_context` vào Prompt. |
| D2 | "Tìm quán cà phê giống quán tôi vừa xem" | AI gợi ý quán có concept tương đương quán cuối cùng người dùng `VIEW`. | Sử dụng Activity Log. |

---

## 3. Cách thực hiện Test nhanh (cURL)

### Test Trích xuất & Lọc Quận
```bash
curl -X POST http://localhost:8000/api/v1/ai/chatbox \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     -d '{"message": "Tìm quán lẩu mắm ở Quận 4"}'
```

### Test Chặn địa điểm ngoài TP.HCM
```bash
curl -X POST http://localhost:8000/api/v1/ai/chatbox \
     -H "Content-Type: application/json" \
     -d '{"message": "Quán bánh đa cua ở Hải Phòng"}'
```

---

## 4. Tiêu chí Đạt (Success Criteria)
1. **Đúng ID:** Nếu quán có trong DB, `restaurant_id` phải khớp chính xác.
2. **Đúng Quận:** Nếu người dùng hỏi Quận X, không được gợi ý quán Quận Y.
3. **Đúng Tone:** Lý do (reason) phải trích xuất từ đánh giá thật trong DB để tăng tính thuyết phục.
4. **Resilience:** Nếu AI API lỗi, hệ thống phải tự động trả về 3 gợi ý từ DB Fallback.
