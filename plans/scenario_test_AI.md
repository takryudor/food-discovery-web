# FoOdyssey AI Chatbox - Manual Testing Scenarios

This document provides a structured guide for manual testing of the AI Chatbox feature. These scenarios cover core functionality, edge cases, and resilience logic.

## Testing Environment
- **Endpoint:** `POST /ai/chatbox`
- **Base URL:** `http://localhost:8000` (Default)
- **Headers:** `Content-Type: application/json`

---

## Scenarios

### Scenario 1: Basic Dish Search (Success)
**Goal:** Verify AI returns relevant restaurants for a simple dish name.
- **Input:** `{"message": "Tôi muốn ăn phở"}`
- **Expected Outcome:** 
    - Status: `200 OK`
    - Data: A list of 1-3 restaurants in TP.HCM that serve Phở.
    - Field `reason`: Should mention specific qualities (e.g., "Nước dùng thanh, đậm đà").

### Scenario 2: The "Bún bò Huế" Edge Case (Success)
**Goal:** Ensure queries for "Bún bò Huế" are NOT blocked by the location filter (which blocks the city "Huế").
- **Input:** `{"message": "Tìm quán bún bò huế ngon"}`
- **Expected Outcome:** 
    - Status: `200 OK`
    - Data: Successfully returns matching restaurants in TP.HCM.
    - Logic Check: The "Early Exit" logic should detect this as a dish, not a request for restaurants *in the city of Huế*.

### Scenario 3: Natural Language with Filler Words (Success)
**Goal:** Verify the system can extract keywords from conversational Vietnamese.
- **Input:** `{"message": "Làm ơn tìm giúp tôi một vài quán cà phê không gian yên tĩnh để làm việc ở TP.HCM"}`
- **Expected Outcome:** 
    - The system strips "Làm ơn tìm giúp tôi," "một vài," "ở TP.HCM" and searches for "quán cà phê không gian yên tĩnh."
    - Returns relevant cafe results from the DB.

### Scenario 4: Unsupported Location (Negative)
**Goal:** Verify the system correctly informs users when a location is outside TP.HCM.
- **Input:** `{"message": "Tôi muốn ăn bánh đa cua ở Hải Phòng"}`
- **Expected Outcome:** 
    - `recommendations`: `[]` (Empty)
    - `message`: "Data hiện tại của chúng tôi chưa hỗ trợ cho khu vực này"

### Scenario 5: API Quota/Failure Fallback (Resilience)
**Goal:** Ensure the system still works even if the Gemini API is down or throttled.
- **How to Test:** Send multiple rapid requests to trigger a `429 Quota Exceeded` (or temporarily use an invalid key in `.env`).
- **Expected Outcome:** 
    - Status: `200 OK`
    - The system detects the API error and automatically switches to **Database Fallback**.
    - It returns relevant restaurants directly from the DB with a generic reason: *"Gợi ý dựa trên dữ liệu có sẵn trong hệ thống."*

---

## Manual Execution (CLI Examples)

### Test Basic Search
```bash
curl -X POST http://localhost:8000/ai/chatbox \
     -H "Content-Type: application/json" \
     -d '{"message": "Tìm quán bún bò"}'
```

### Test Bún Bò Huế (The Fix)
```bash
curl -X POST http://localhost:8000/ai/chatbox \
     -H "Content-Type: application/json" \
     -d '{"message": "Tìm cho tôi quán bún bò huế"}'
```

### Test Unsupported City
```bash
curl -X POST http://localhost:8000/ai/chatbox \
     -H "Content-Type: application/json" \
     -d '{"message": "Quán phở ở Hà Nội"}'
```

---

## Observation Points
1. **Response Time:** AI responses take 2-4 seconds; Fallback responses are nearly instant (<200ms).
2. **Reasoning Quality:** Look for mentions of "vị thanh," "nhiệt tình," or "đậm đà" in the AI's reason—these are extracted from actual user reviews.
3. **Data Integrity:** Verify that every `restaurant_id` returned matches a real ID in your database.
