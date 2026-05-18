# FoOdyssey AI Feature - Technical Utilities & Benefits

This document outlines the core technical utilities and architectural benefits of the AI module within the FoOdyssey backend.

---

## 1. Hybrid Retrieval Strategy
The AI module uses a **Hybrid Retrieval** approach to provide high-quality recommendations:
- **Search Retrieval:** First, it queries the PostgreSQL database using Full-Text Search (FTS) and keyword matching to find candidate restaurants.
- **AI Reasoning:** The retrieved database records (including address and user reviews) are injected into the Groq API as context.
- **Result:** The AI doesn't "hallucinate" fake restaurants; it intelligently selects and justifies the best options from our actual data.

## 2. Vietnamese Query Sanitization
To bridge the gap between conversational speech and database queries, the system includes a custom sanitization utility:
- **Filler Word Removal:** Strips Vietnamese "stop words" like *"tìm cho tôi"*, *"làm ơn"*, *"một vài"*.
- **Keyword Extraction:** Focuses on the core dish names or dining purposes (e.g., *"không gian yên tĩnh"*, *"bún bò"*).
- **Benefit:** Significantly increases search recall for natural language messages.

## 3. Context Injection & Review Analysis
The utility retrieves up to **10 relevant user reviews** from the database for the candidate restaurants:
- **Semantic Feedback:** AI analyzes these reviews to generate the `reason` for recommendation.
- **Example:** If users frequently mention "cheap price" or "friendly staff" in the DB, the AI will highlight these specific traits in its response.

## 4. Early Exit & Cost Optimization
To save on API costs and token usage, the system implements a pre-check utility:
- **Location Filtering:** Automatically detects if a user is asking for restaurants outside the supported area (currently only TP.HCM).
- **Keyword Awareness:** Intelligent enough to distinguish between a city name (Huế) and a dish name (*Bún bò Huế*).
- **Benefit:** Prevents unnecessary external API calls for requests we cannot fulfill.

## 5. Robust Fallback System (Fail-Safe)
The module is designed for 100% uptime, even when external AI services fail:
- **Error Detection:** Automatically catches `429 (Quota Exceeded)`, `500 (Internal Server Error)`, or `404 (Model Not Found)` from the AI client.
- **DB-Only Fallback:** If the AI is unavailable, the system transparently switches to a database-driven ranking, returning the top matches with a generic but accurate justification.
- **User Impact:** The user always gets a response; the system never "breaks" due to third-party outages.

## 6. Data Integrity & Validation
A strict verification utility ensures that every AI-generated recommendation is grounded in reality:
- **ID Matching:** The system cross-references AI-suggested `restaurant_id` values against the database.
- **Name Matching:** If the AI suggests a name without an ID, a fuzzy matching utility attempts to find the correct record in our DB.
- **Benefit:** Zero risk of recommending non-existent restaurants or incorrect addresses.
