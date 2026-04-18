---
name: plan-auto-commit
description: Protocol tự động commit code sau khi hoàn thành một Implementation Plan. Giúp duy trì lịch sử thay đổi rõ ràng và không bỏ sót các bước lưu trữ.
---

# Plan Auto-Commit Protocol

Kỹ năng này quy định việc tự động lưu trữ (commit) các thay đổi vào Git sau khi một nhiệm vụ (Plan) đã được thực hiện xong.

## 1. Điều kiện kích hoạt
Bạn **PHẢI** thực hiện quy trình commit ngay sau khi:
- Tất cả các mục trong `task.md` đã được đánh dấu là hoàn thành `[x]`.
- Một `walkthrough.md` đã được tạo hoặc cập nhật để tổng kết thay đổi.

## 2. Quy trình thực hiện

### Bước 1: Kiểm tra thay đổi
Kiểm tra lại danh sách các file đã thay đổi:
```bash
git status
```

### Bước 2: Stage và Commit
Sử dụng format tin nhắn commit chuyên nghiệp, ưu tiên lấy thông tin từ tiêu đề của `implementation_plan.md`.

**Cấu trúc lệnh:**
```bash
git add .
git commit -m "feat: [Tiêu đề hoặc tóm tắt từ Plan]"
```

*Lưu ý: Nếu có nhiều thay đổi thuộc các loại khác nhau (fix, chore, docs), hãy cân nhắc chia nhỏ commit hoặc sử dụng tiêu đề bao quát nhất.*

## 3. Quy tắc đặt tên Commit Message
Tuân thủ Conventional Commits nếu dự án yêu cầu, hoặc sử dụng các tiền tố sau:
- `feat:` Cho tính năng mới.
- `fix:` Cho sửa lỗi.
- `chore:` Cho các thay đổi về cấu trúc, cấu hình hoặc bảo trì.
- `docs:` Cho cập nhật tài liệu/comment.

## 4. Ngoại lệ
- Không commit nếu quá trình kiểm thử (Verification) thất bại.
- Không commit nếu User yêu cầu tạm dừng để review bản nháp.
- Không tự động `git push` trừ khi được User yêu cầu cụ thể.
