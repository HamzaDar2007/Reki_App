# REKI Backend — Complete 10-Week Roadmap

> **Last Updated**: April 18, 2026
> **Tech Stack**: NestJS 11 + TypeScript + PostgreSQL 18 + TypeORM
> **Total Endpoints**: 60 | **Total Tests**: 228 | **Test Suites**: 24

---

## PROGRESS OVERVIEW

```
Week 1  ████████████████████ 100%  ✅ Technical Planning
Week 2  ████████████████████ 100%  ✅ Core Logic & Data
Week 3  ████████████████████ 100%  ✅ User App Integration
Week 4  ████████████████████ 100%  ✅ Business Control Layer
Week 5  ████████████████████ 100%  ✅ Integration & Demo
Week 6  ████████████████████ 100%  ✅ Investor Demo Delivery
Week 7  ███████████████░░░░░  75%  🟡 Quality & Stability
Week 8  ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Real Location & Maps
Week 9  ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Push Notifications & Real-Time
Week 10 ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Offline Support
```

---

## PHASE 1 — MVP (Weeks 1-6) ✅ 100% COMPLETE

### Week 1: Technical Planning & MVP Scoping ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | 12 Database Entities (User, Venue, Busyness, Vibe, Offer, Redemption, Notification, Tag, BusinessUser, VenueAnalytics, ActivityLog, RefreshToken) | ✅ |
| 2 | 13 NestJS Modules (auth, users, venues, busyness, vibes, offers, notifications, tags, business, admin, audit, profile, demo) | ✅ |
| 3 | 11 Enums (Role, AuthProvider, BusynessLevel, VenueCategory, TagCategory, OfferType, OfferStatus, RedemptionStatus, NotificationType, BusinessRole, ErrorCode) | ✅ |
| 4 | 5 Guards (JwtAuthGuard, LocalAuthGuard, RolesGuard, NoGuestGuard, BusinessGuard) | ✅ |
| 5 | JWT Auth System (Passport JWT + Local strategy, access 15min, refresh 7 days) | ✅ |
| 6 | Error Handling (HttpExceptionFilter + 20+ ErrorCodes) | ✅ |
| 7 | Response Format (ResponseInterceptor for consistent API responses) | ✅ |
| 8 | Utility Functions (generateVoucherCode → "RK-992-TX", generateTransactionId → "#REKI-8829-MNCH") | ✅ |
| 9 | Config Files (app.config.ts, database.config.ts — Manchester lat/lng, JWT secrets) | ✅ |
| 10 | Decorators (@Roles for RBAC, @CurrentUser for request user) | ✅ |
| 11 | 9 Working Endpoints (/config/app, /health, /auth/register, /auth/login, /auth/guest, /auth/refresh-token, /tags, /tags/search, /admin/stats) | ✅ |

---

### Week 2: Core App Logic & Data Layer ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | 15 Manchester Venues Seeded (Albert's Schloss, Warehouse Project, 20 Stories, The Alchemist, Albert Hall, YES Manchester, Diecast, Refuge, Cloud 23, Night & Day Café, Science & Industry, Gorilla, The Ivy, Peveril of the Peak, Electrik) | ✅ |
| 2 | Busyness State Logic (updateLevel auto-calculates %, matchesAtmosphere filter) | ✅ |
| 3 | Vibe Scheduling Logic (6-8PM=Chill, 8-10PM=High Energy, 10PM-2AM=Late Night) | ✅ |
| 4 | Offer Availability Logic (5-rule check: isActive + day + time + maxRedemptions + expiry) | ✅ |
| 5 | Claim + Redeem System (claimOffer → voucher+QR, redeemOffer → marks redeemed + count) | ✅ |
| 6 | Notification Grouping (findGroupedByUserId → Today/Yesterday/Earlier) | ✅ |
| 7 | 20 Tags Seeded (14 vibe + 6 music) | ✅ |
| 8 | 8 Database Indexes (Venue 4, Busyness 1, Offer 3) | ✅ |
| 9 | Venue List with Filters (GET /venues?city=&category=&atmosphere=&vibe=&priceLevel=) | ✅ |
| 10 | isVenueLive Logic (opening/closing time check, handles overnight) | ✅ |
| 11 | Map Markers + Trending (GET /venues/map-markers, GET /venues/trending top 5) | ✅ |
| 12 | Seed Module (auto-loads all data on first start via OnModuleInit) | ✅ |
| 13 | Saving Calculation (calculateSaving → offer.savingValue in GBP) | ✅ |

---

### Week 3: User App Functional Integration ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Full Auth System (Register, Login, Google OAuth, Apple Sign-In, Guest, Forgot Password, Reset Password, Refresh Token — 8 endpoints) | ✅ |
| 2 | Google OAuth (POST /auth/google — idToken decode → create/find user → JWT) | ✅ |
| 3 | Apple Sign-In (POST /auth/apple — identityToken decode → create/find user → JWT) | ✅ |
| 4 | Guest Login (POST /auth/guest — limited access, NoGuestGuard blocks save/claim/redeem) | ✅ |
| 5 | Forgot + Reset Password (JWT reset token 15min expiry → bcrypt password update) | ✅ |
| 6 | User Preferences CRUD (GET/POST/PUT /users/preferences — vibes[] + music[]) | ✅ |
| 7 | Saved Venues System (POST/DELETE /users/saved-venues/:venueId) | ✅ |
| 8 | Redemption History (GET /users/redemptions) | ✅ |
| 9 | Personalized Feed (matchScore = vibes×2 + music×1, sorted DESC) | ✅ |
| 10 | Venue Search (GET /venues/search?q= — name, area, tags) | ✅ |
| 11 | Filter Options (GET /venues/filter-options — atmospheres, vibes, priceRange) | ✅ |
| 12 | Offer Claim with QR (POST /offers/:id/claim → voucherCode + qrCodeData) | ✅ |
| 13 | Offer Redeem with Validation (POST /offers/:id/redeem — double-redeem protection) | ✅ |
| 14 | Apple Wallet Pass (POST /offers/:id/wallet-pass — pass data structure) | ✅ |
| 15 | Welcome Notification (auto-trigger on register/google/apple signup) | ✅ |
| 16 | Notifications Grouped (GET /notifications → Today/Yesterday/Earlier) | ✅ |

---

### Week 4: Business Control Layer ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Business Login (POST /auth/business/login → JWT + venue data) | ✅ |
| 2 | Business Register (POST /auth/business/register — auto-approve for MVP) | ✅ |
| 3 | Business Forgot Password (POST /auth/business/forgot-password) | ✅ |
| 4 | Venue Dashboard (GET /business/dashboard/:venueId — busyness, vibe, engagement, weather) | ✅ |
| 5 | Analytics Endpoint (GET /business/analytics/:venueId?period= — views, saves, clicks, redemptions) | ✅ |
| 6 | Busyness + Vibe Update (PUT /business/venues/:id/status — live status update) | ✅ |
| 7 | Venue Status Get (GET /business/venues/:id/status — current busyness + vibes) | ✅ |
| 8 | Offer CRUD — 5 Endpoints (List, Create, Update, Toggle, Soft Delete) | ✅ |
| 9 | BusinessGuard (only business role users access /business/* routes) | ✅ |
| 10 | Activity Logging (status update, offer create, login → ActivityLog table) | ✅ |
| 11 | Vibe Alert Auto-Trigger (busyness ≥80% → VIBE_ALERT to saved-venue users) | ✅ |
| 12 | Offer Notification Trigger (new offer → notify saved-venue users) | ✅ |
| 13 | Mock Weather Integration (rain, 8°C, "+15% dwell time increase") | ✅ |
| 14 | 3 Business Users Seeded (manager@alberts.com, manager@warehouse.com, manager@alchemist.com) | ✅ |
| 15 | 5 Admin Endpoints (venues, venue-logs, offers, redemptions, activity-logs) | ✅ |

---

### Week 5: System Integration & Demo Stability ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Demo Simulation System (POST /admin/demo/simulate — named scenarios) | ✅ |
| 2 | Time Simulation (POST /admin/demo/simulate-time — hour-based 15-venue update) | ✅ |
| 3 | 3 Initial Demo Scenarios (saturday-night, quiet-afternoon, peak-transition) | ✅ |
| 4 | Distance Calculation (haversine formula → "0.3 miles" format) | ✅ |
| 5 | Social Proof (generateSocialProof → "Sarah, Mike & 48 others are here") | ✅ |
| 6 | Busyness Color Logic (getBusynessColor → green/amber/red) | ✅ |
| 7 | Live Performance Notification (business adds "Live Music" → alert saved users) | ✅ |
| 8 | Welcome Notification on All Auth (register, google, apple) | ✅ |
| 9 | Map Markers with Distance (GET /venues/map-markers?lat=&lng= → per-venue distance) | ✅ |
| 10 | Admin Notifications Endpoint (GET /admin/notifications) | ✅ |

---

### Week 6: Investor Demo Prep & Delivery ✅

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Demo Reset Endpoint (POST /admin/demo/reset — clears all, restores seed state) | ✅ |
| 2 | 4 More Demo Scenarios (quiet-evening, warming-up, peak-time, winding-down → total: 7) | ✅ |
| 3 | 15 Offers Seeded (1 per venue, was 5 → upgraded to 15) | ✅ |
| 4 | Venue Images Upgraded (2→3 images per venue) | ✅ |
| 5 | trackView Fix (POST /venues/:id/view → actually increments VenueAnalytics.totalViews) | ✅ |
| 6 | README.md (setup, env vars, demo accounts, API table, architecture) | ✅ |
| 7 | Demo Guide (docs/demo-guide.md — step-by-step with curl commands) | ✅ |
| 8 | Database Schema Doc (docs/database-schema.md — 17 tables, columns, indexes) | ✅ |
| 9 | Phase 2 Roadmap (docs/phase-2-roadmap.md — Weeks 7-10 + beyond) | ✅ |
| 10 | Swagger API Docs (auto-generated at /api/docs — 83 endpoints) | ✅ |
| 11 | 5 Demo Accounts (demo@reki.app, admin@reki.app, 3 business managers) | ✅ |

---

## PHASE 2 — Post-Investment (Weeks 7-10)

### Week 7: Quality & Stability Foundation 🟡 75%

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Unit Tests — 11 Service Specs (auth, users, venues, offers, notifications, business, admin, tags, busyness, vibes, app) | ✅ |
| 2 | Unit Tests — 10 Controller Specs (auth, admin, users, venues, offers, notifications, business, tags, demo, busyness) | ✅ |
| 3 | Unit Tests — Guard Specs (BusinessGuard, NoGuestGuard, RolesGuard, JwtAuthGuard, LocalAuthGuard) | ✅ |
| 4 | Unit Tests — Audit + Demo Service Specs | ✅ |
| 5 | 228 Tests Passing, 24 Test Suites | ✅ |
| 6 | Code Coverage (statements 80%+, lines 80%+, functions 80%+, branches 60%+) | ✅ |
| 7 | Jest Config with Coverage Thresholds | ✅ |
| 8 | Structured Logging — Winston (JSON format, daily rotation, 30-day retention) | ✅ |
| 9 | Request ID Tracking (UUID per request in LoggingInterceptor) | ✅ |
| 10 | Rate Limiting (100 req/min global, 3-5/min on auth endpoints via @nestjs/throttler) | ✅ |
| 11 | Helmet Security Headers | ✅ |
| 12 | CORS Configuration | ✅ |
| 13 | Pagination (PaginationDto + paginate() helper, 7 endpoints upgraded) | ✅ |
| 14 | Health Check Enhanced (DB status, uptime, environment) | ✅ |
| 15 | **Integration Tests (6 e2e flows)** | ❌ MISSING |
| 16 | **CI Pipeline (GitHub Actions with test gate)** | ❌ MISSING |
| 17 | **Error Tracking (Sentry/Crashlytics)** | ❌ MISSING |
| 18 | **Retry Logic + Circuit Breaker (exponential backoff)** | ❌ MISSING |

---

### Week 8: Real Location & Maps ❌ 0%

| # | Deliverable | Status |
|---|------------|--------|
| 1 | PostGIS Extension for geo-spatial queries | ❌ |
| 2 | Radius-based venue search (GET /venues?lat=&lng=&radius=) | ❌ |
| 3 | Real-time GPS tracking (client sends location periodically) | ❌ |
| 4 | Dynamic map markers with live RAG colors | ❌ |
| 5 | "Venues near me" sorted by walking distance | ❌ |
| 6 | Google Maps / Mapbox integration support | ❌ |
| 7 | Geofencing alerts (notify when near saved venue) | ❌ |

> **Note**: Basic haversine distance + map markers + busyness colors already done in Week 5. Week 8 upgrades to real PostGIS + GPS.

---

### Week 9: Push Notifications & Real-Time ❌ 0%

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Firebase Cloud Messaging (FCM) integration | ❌ |
| 2 | Device token management (register/unregister) | ❌ |
| 3 | WebSocket/SSE for live busyness updates | ❌ |
| 4 | Push notification preferences (opt-in/out per type) | ❌ |
| 5 | Weekly recap cron job (Monday morning auto-notification) | ❌ |
| 6 | Rich notifications (images/banners + deep linking) | ❌ |
| 7 | "Currently viewing" counter on venue detail | ❌ |

---

### Week 10: Offline Support & Data Persistence ❌ 0%

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Backend cache headers (ETag, Cache-Control) | ❌ |
| 2 | Sync queue for offline actions | ❌ |
| 3 | Conflict resolution strategy (server wins for busyness, client wins for preferences) | ❌ |
| 4 | Cache invalidation (timestamp-based) | ❌ |
| 5 | State persistence support | ❌ |

---

## TECHNICAL DEBT (From MVP Phase)

| Item | Priority | Status |
|------|----------|--------|
| Google/Apple OAuth real verification | HIGH | ❌ Currently decode() only |
| Password reset token in response | HIGH | ❌ Remove before production |
| Email verification flow | MEDIUM | ❌ isVerified field exists, no email |
| Apple Wallet real .pkpass | MEDIUM | ❌ Mock data, needs Apple certs |
| Mock weather data | LOW | ❌ Hardcoded rain/8°C |
| Mock analytics data | LOW | ❌ Business dashboard uses hardcoded |
| Social proof mock names | LOW | ❌ Random names, not real users |
| Profile module empty | LOW | ❌ Logic in users module |

---

## TOTAL NUMBERS (As of April 18, 2026)

| Metric | Count |
|--------|-------|
| API Endpoints | 60 |
| Database Tables | 12 |
| NestJS Modules | 13 |
| Test Suites | 24 |
| Tests Passing | 228 |
| Seeded Venues | 15 |
| Seeded Offers | 15 |
| Seeded Tags | 20 |
| Demo Scenarios | 7 |
| Demo Accounts | 5 |
| Enums | 11 |
| Guards | 5 |
| Database Indexes | 8 |
| Documentation Files | 5 |

---

## DEMO CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reki.app | admin123 |
| User | demo@reki.app | demo1234 |
| Business | manager@alberts.com | business123 |
| Business | manager@warehouse.com | business123 |
| Business | manager@alchemist.com | business123 |
| Guest | POST /auth/guest | No credentials |

---

## BUILD & RUN COMMANDS

```bash
# Build
npx nest build --webpack

# Run Tests
npx jest --no-coverage

# Run Tests with Coverage
npx jest --coverage

# Start Server
node dist/main.js

# Swagger Docs
http://localhost:3000/api/docs
```
