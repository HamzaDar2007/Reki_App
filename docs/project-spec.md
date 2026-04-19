REKI – 10-Week MVP Milestone Plan (No UI/UX Scope)

Objective
Deliver an investor-ready iOS MVP for one city (Manchester) within 10 weeks, focused on core functionality, real-world logic simulation, and clear business value.

Platform
iOS-first MVP
One city only (Manchester)
Client-provided UI/UX designs


What This MVP Will Deliver
✅ A working, demo-ready MVP
 ✅ Realistic app behavior (busyness, vibe, offers)
 ✅ Clear monetization story for investors
 ✅ Scalable technical foundation
❌ No heavy infrastructure or production scaling (Phase 2)

10-Week Timeline & Cost Breakdown

Week 1 – Technical Planning & MVP Scoping
Deliverables
Final MVP feature confirmation
Technical architecture (lightweight & scalable)
Data models (venues, busyness, vibe, offers)
Manchester city configuration
Investor demo flow definition
Outcome
 Clear build scope with zero ambiguity

Week 2 – Core App Logic & Data Layer
Deliverables
Venue data structure
Busyness state logic (Quiet / Moderate / Busy)
Vibe scheduling logic
Offer rules & availability logic
Local/mock data setup for demos
Outcome
 Core REKI logic implemented (independent of UI)

Week 3 – User App Functional Integration
Deliverables
User authentication (basic)
Venue discovery (Manchester only)
Busyness + vibe display logic
Offer visibility & redemption flow (simulated)
Preference-based filtering (basic)
Outcome
 User-side MVP flows functional and demo-ready

Week 4 – Business (Venue) Control Layer
Deliverables    
Offer creation & activation
Basic analytics counters (views, clicks)
Outcome
 Clear value proposition for businesses

Week 5 – System Integration & Demo Stability
Deliverables
End-to-end flow testing
Realistic state changes (time-based)
Demo scenarios (quiet → busy, offer push)
Notification flow simulation
Performance & stability improvements
Outcome
 Smooth, convincing investor demo

Week 6 – Investor Demo Prep & Delivery
Deliverables
Final MVP build
Demo walkthrough script
Key feature explanation notes
Phase 2 technical roadmap
Handover documentation
Outcome
 Investor-ready MVP package

 
 
 

What the Client Will Have After 6 Weeks
iOS MVP for Manchester
Live-like crowd & vibe logic
Business-side controls
Investor demo flow
Clear roadmap to full build





Phase 2 start 

Week 7 : Quality & Stability Foundation
Priority: Critical | Duration: 3–4 weeks 
Goal: Establish testing, fix production gaps, harden the existing MVP, and pay down critical technical debt before scaling.
Test Coverage Suite: Implement unit tests for all 7 repositories and 11 data models. Secure critical UI components with widget tests and write integration tests for core flows. Achieve 80%+ code coverage and establish a CI test gate.
Production Hardening: Replace debug logging with a structured logging framework. Integrate Firebase Crashlytics/Sentry. Implement request retry logic with exponential backoff and network connectivity monitors.
Performance Optimization: Introduce pagination for venues, offers, and users. Implement image caching and lazy loading for heavy screens. Optimize app startup time.
Success Metrics: 80%+ overall code coverage, 0 crash rate increase post-release, CI pipeline blocks failing merges.


Week 8: Real Location & Maps (Includes Client Request)
Priority: High | Duration: 3–4 weeks 
Goal: Replace mock location data with real geolocation, enabling interactive maps and proximity-based features.
Real Geolocation: Integrate background location tracking, handle all OS permission states gracefully, and enable sorting by distance / "Near Me" filters.
RAG Interactive Map View (Client Request): Integrate Google Maps or Mapbox. Display venue markers using a strict RAG (Red, Amber, Green) color-coding system to visually represent live busyness. Add map-based discovery and native app deep-linking for navigation.
Geofencing & Intelligence: Trigger notifications when users approach venues with active offers and track aggregated popular neighborhoods.
Success Metrics: Real GPS accuracy < 50m, Interactive map load time < 2s, 30%+ increase in venue detail views driven by map discovery.
 
Week 9: Push Notifications & Real-Time
Priority: High | Duration: 2–3 weeks 
Goal: Enable remote push notifications and real-time data updates to drive user re-engagement and live busyness accuracy.
Push Notification System: Integrate Firebase Cloud Messaging (FCM). Build device token registration, user preference toggles, rich notifications (images/banners), and deep linking.
Real-Time Updates: Establish WebSocket or SSE connections for live busyness updates and limited-offer countdowns. Add a "currently viewing" counter to venue details and optimistic UI updates for user actions.
Success Metrics: 60%+ push notification opt-in rate, 15%+ of app sessions initiated via notification taps.


Week 10: Offline Support & Data Persistence
Priority: High | Duration: 3 weeks 
Goal: Make the application reliable and functional under poor or zero network connectivity conditions.
Local Database Layer: Cache venue data, user profiles, redeemed offers, and notifications with timestamp-based invalidation.
Offline-First Architecture: Create a sync queue for offline actions (e.g., worker busyness updates) with a conflict resolution strategy.
State Persistence: Persist app states across restarts to save user preferences, filters, and offline analytics dashboards.
Success Metrics: App remains usable for 95%+ of read operations while offline, queued offline sync success rate > 99%.

