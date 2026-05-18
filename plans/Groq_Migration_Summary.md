# Groq Migration & AI Feature Upgrade Summary

This document summarizes the technical improvements and architectural changes implemented during the transition from Gemini to Groq as the primary AI engine for FoOdyssey.

---

## 1. Engine Transition
- **Primary Service:** Switched from `GeminiService` to `GroqService` via the `AIFacade`.
- **Inference:** Now uses `llama-3.1-8b-instant` via the Groq API for faster response times and improved Vietnamese reasoning.
- **Cleanup:** Unused Gemini components (`GeminiClient`, `GeminiService`) have been deprecated and commented out to maintain system integrity while removing unnecessary dependencies.

## 2. Technical Enhancements

### A. Robust Multi-Object Parsing
- **Previous Issue:** The parser was "greedy" and only captured the first JSON object in a stream.
- **Fix:** Implemented a regex-based collection logic in `GroqClient` that scans the entire raw response and extracts **all** valid restaurant JSON objects. This ensures no recommendations are lost.

### B. GeoMap Coordinate Fallback
- **Logic:** If a restaurant exists in our database but has `NULL` coordinates, the system now uses the **AI-provided coordinates** as a fallback.
- **Benefit:** Guarantees that every recommendation returned by the AI can be rendered as a marker on the interactive map, even if the local database record is incomplete.

### C. User-Aware Personalization
- **Feature:** Added `user_id` support to the chat request.
- **Logic:** If a user is logged in, the system retrieves their stored `preferences` (favorite cuisines, budget profile) and injects them into the AI prompt as a new context source.
- **Outcome:** Recommendations are now tailored to individual user tastes and historical preferences.

### D. Rich Context Injection
- **Data Points:** The AI now receives expanded data for candidate restaurants:
    - **Ratings:** (e.g., "4.5/5")
    - **Opening Hours:** Real-time availability info.
    - **Price Range:** Accurate budget mapping.
    - **Phone Info:** For immediate contact.
- **Reasoning:** AI utilizes this rich data to provide professional justifications (e.g., *"Recommended because it matches your cheap budget and is currently open"*).

## 3. Resilience & Safety
- **Fail-Safe Fallback:** If the external API fails (429/500), the system automatically switches to a high-quality DB search using Vietnamese query sanitization.
- **Data Integrity:** AI is strictly forbidden from "hallucinating" IDs. If an ID is provided, it is cross-referenced; if a restaurant is suggested from external knowledge, it is marked with: *"(Hiện tại thông tin của quán chưa được cập nhật)"*.

---

**Status:** Completed and Verified
**Last Updated:** May 17, 2026
