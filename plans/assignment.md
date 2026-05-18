# FoOdyssey: Team Assignment Report (10-Day Sprint)

This document outlines the distribution of tasks for the 5-person development team to be completed within a **10-day intensive sprint**.

## 1. Team Roles & Assignments

| Role | Primary Owner | Focus Areas |
| :--- | :--- | :--- |
| **Backend Architect** | **Trân** | DB Schema Refactor, Auth & Role Logic, Migrations |
| **Frontend & UX Lead** | **Phúc** | Filter UX Overhaul, Admin Dashboard, Notification UI |
| **AI & Logic Engineer** | **Thụ** | Recommendation Scoring, Weight Matrix, Gemini AI Optimization |
| **GIS & Map Specialist** | **Nam** | Map Layer Replacement, Real-time Notifications (WS/SSE) |
| **Fullstack & QA** | **Trường** | Contribution Workflow, Data Audit, Integration Testing |

---

## 2. Task Breakdown

### Phase 1: Infrastructure & "Clean Map" (Deadline: Day 3)
- **Trân**: Finalize DB Schema and run Alembic migrations for `user_logs` and `restaurant_contributions`.
- **Nam**: **[CRITICAL]** Replace the existing map provider with a clean, legal alternative (Mapbox/OSM).
- **Phúc**: Design and prototype the new "Simplified Filter" UI.
- **Thụ**: Setup the initial logic for recording user behavior logs.

### Phase 2: User Flows & Crowdsourcing (Deadline: Day 7)
- **Trân**: Implement User vs. Admin permission gates on the backend.
- **Trường**: Develop the frontend and backend for the "Suggest a Place" feature (Crowdsourcing).
- **Phúc**: Build the Admin interface for verifying user-submitted data.
- **Nam**: Implement the Notification Pipeline (Event-driven emission).

### Phase 3: Intelligence & Personalization (Deadline: Day 10)
- **Thụ**: Build the Recommendation Scoring matrix and tune weights using internal "Self-Data" testing.
- **Phúc**: Integrate real-time notification components into the user feed.
- **Trường**: Perform a full audit to ensure 100% of mock data is removed.
- **Trân & Thụ**: Optimize AI prompts to utilize real database records for personalized summaries.

---

## 3. Technical Success Criteria
- [ ] **Map Compliance**: Zero "Nine-dash line" occurrences in the map layer.
- [ ] **Data Integrity**: All API responses must originate from PostgreSQL (No mock hardcoding).
- [ ] **System Intelligence**: Recommendation algorithm must provide relevant suggestions based on at least 3 distinct user signals (clicks, searches, ratings).
- [ ] **Real-time Connectivity**: Notifications for "Explore" posts appear in < 2 seconds for active users.

---
**Deadline:** 10 Days from Start
**Date Created:** May 17, 2026
**Project:** FoOdyssey (Vietnam)
