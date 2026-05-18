# My Assignment: AI & Logic Engineer (Thu)

## Overview
- **Sprint Duration:** 10 Days
- **Focus:** User Behavior Tracking, Recommendation Scoring, AI Prompt Optimization.

## Task Checklist

### Phase 1: Infrastructure (Deadline: Day 3)
- [ ] User Behavior Tracking Logic
    - [ ] Create ActivityService to handle UserActivity records.
    - [ ] Integrate logging into GET /restaurants/{id} (VIEW).
    - [ ] Integrate logging into GET /search (SEARCH).
    - [ ] Integrate logging into Favorite actions (FAVORITE).

### Phase 3: Intelligence & Personalization (Deadline: Day 10)
- [ ] Recommendation Scoring Matrix Tuning
    - [ ] Verify compute_match_score weights (current: 0.35 Concept, 0.35 Purpose, 0.20 Amenity).
    - [ ] Tune "Dish Match" boost (current: 0.9 in text score).
    - [ ] Perform "Self-Data" testing with 10+ scenarios to validate ranking.
- [ ] AI Prompt & Personalization Optimization
    - [ ] Fetch user preferences from users.preferences in GroqService.
    - [ ] Pass user_context to GroqClient.
    - [ ] Update system_prompt to prioritize historical preferences.
    - [ ] Ensure AI summaries leverage real DB reviews for authenticity.

## Success Criteria
- [x] No Mock Data: AI only suggests restaurants from PostgreSQL (Verified in GroqService).
- [ ] 3 Signal Input: Recommendations use VIEW, SEARCH, and FAVORITE data.
- [ ] Personalization: Chat responses reference user history/preferences.

---
*Generated based on master assignment on May 17, 2026.*
