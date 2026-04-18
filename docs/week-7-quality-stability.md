# Week 7 – Quality & Stability Foundation (Phase 2)

> ⚠️ **Note**: Phase 2 ki screens abhi client ne provide nahi ki hain. Yeh doc sirf backend tasks cover karta hai jo document.md mein defined hain. Jab Phase 2 screens milengi, tab screen-level mapping add hoga.

## Goal
Testing framework lagana, production gaps fix karna, MVP harden karna, aur critical technical debt pay down karna before scaling.

**Priority**: Critical

---

## 1. Test Coverage Suite

### Unit Tests — All 7 Repositories
```
Repository            Tests Required
─────────────────────────────────────────
AuthRepository        - register, login, OAuth (Apple/Google), guest, forgot/reset password, token refresh
UserRepository        - get/update profile, preferences CRUD, saved venues, redemption history
VenueRepository       - list (with filters), detail, search, map markers, trending, view tracking
BusynessRepository    - get status, update status, percentage mapping, level logic
VibeRepository        - get vibe, update vibe, tag validation, scheduling logic
OfferRepository       - CRUD, toggle, claim, redeem, validation rules, voucher generation
NotificationRepository - create, list (grouped), mark read, auto-triggers
```

### Unit Tests — All 11 Data Models
```
Model               Key Validations
─────────────────────────────────────────
User                - required fields, email format, password hash, auth provider enum
BusinessUser        - venue ownership, role enum (owner/manager/staff), approval status
Venue               - coordinates validation, category enum, price level range (1-4)
Busyness            - level enum (quiet/moderate/busy), percentage range (0-100)
Vibe                - valid tag names, vibeCheckScore range (1-5)
Offer               - valid days array, time range, maxRedemptions > 0, expiry date
Redemption          - voucher code format, transaction ID format, status enum
Notification        - type enum, grouping logic, isRead default false
VenueAnalytics      - percentage calculations, change calculations
ActivityLog         - action enum, actor reference, timestamp
Tags                - unique names, category (vibe/music)
```

### Integration Tests — Core Flows
```
Flow 1: User Registration → Login → Set Preferences → Browse Feed
Flow 2: Filter Venues → View Detail → Claim Offer → Redeem Offer
Flow 3: Business Login → View Dashboard → Update Status → Verify User Feed Updated
Flow 4: Business Create Offer → User Sees Offer → User Redeems → Business Sees Count
Flow 5: Busyness Update → Auto Notification Trigger → User Receives Notification
Flow 6: Admin Login → View Stats → View User/Venue/Offer Logs
```

### Coverage Target
```
Overall: 80%+ code coverage
CI Gate: PRs blocked if coverage drops below 80%
Tool: Jest / Mocha + Istanbul / nyc
```

---

## 2. Production Hardening

### Structured Logging
```
Replace: console.log("User logged in", userId)
With:    logger.info("User logged in", { userId, ip, timestamp, requestId })

Logger setup:
- Library: Winston or Pino
- Levels: error, warn, info, debug
- Format: JSON structured logs
- Output: files (daily rotation, 30-day retention) + console (dev)
- Request ID: unique per request, tracked across all logs
```

### Error Tracking
```
Firebase Crashlytics / Sentry integration:
- Unhandled exception capturing
- API error tracking with context (route, user, params)
- Performance monitoring (API response times)
- Release tracking (which version caused errors)
- Alert rules: error rate spike → Slack/email notification
```

### Request Retry Logic
```
For external API calls (weather, OAuth providers, etc.):
- Retry count: 3 attempts max
- Backoff: exponential (1s → 2s → 4s)
- Circuit breaker: after 5 consecutive failures → stop calling for 30s
- Timeout: 5 seconds per request
```

### Network Connectivity Monitoring
```
- GET /health endpoint → database + external services status
- Response: { "status": "healthy", "db": "connected", "uptime": "48h" }
- Periodic self-check (every 60s)
- Graceful degradation: if weather API down → return cached/mock weather
```

---

## 3. Performance Optimization

### Pagination (All List Endpoints)
```
Endpoints to upgrade:
- GET /venues              → ?page=1&limit=10
- GET /offers              → ?page=1&limit=10
- GET /notifications       → ?page=1&limit=20
- GET /users/redemptions   → ?page=1&limit=10
- GET /admin/users         → ?page=1&limit=20
- GET /admin/venues        → ?page=1&limit=20
- GET /admin/offers        → ?page=1&limit=20
- GET /admin/activity-logs → ?page=1&limit=50
- GET /business/venues/:id/offers → ?page=1&limit=10

Response format:
{
  "data": [...],
  "pagination": {
    "page": 1, "limit": 10, "total": 86,
    "pages": 9, "hasNext": true, "hasPrev": false
  }
}
```

### Image Optimization
```
Backend support:
- Image URLs return with CDN-ready paths
- Thumbnail URLs for list views (smaller size)
- Full-size URLs for detail views
- Response includes image dimensions for layout pre-calculation
```

### Startup & Query Optimization
```
- GET /config/app response time < 100ms
- Database connection pool (min: 5, max: 20)
- Index verification on all queried fields
- Aggregate pipelines optimized for dashboard stats
- API response benchmarks:
    Venue list: < 500ms
    Venue detail: < 300ms
    Dashboard: < 500ms
    Offer redeem: < 200ms
    Notifications: < 300ms
```

---

## 4. Security Hardening
```
- Rate limiting: 100 requests/min per IP (general), 5/15min (login)
- Helmet.js security headers
- CORS configuration (whitelist specific origins)
- Input sanitization (prevent NoSQL injection)
- Password policy: min 8 chars, 1 uppercase, 1 number
- JWT: short access token (15min), longer refresh (7 days)
- No stack traces in production error responses
```

---

## 5. CI Pipeline Setup
```
On every PR/merge:
  1. Run all unit tests
  2. Run integration tests
  3. Check code coverage (must be >= 80%)
  4. Lint check (ESLint)
  5. Build check
  6. Block merge if any step fails
```

---

## Success Metrics
```
✅ 80%+ overall code coverage
✅ 0 crash rate increase post-release
✅ CI pipeline blocks failing merges
✅ All APIs paginated
✅ Structured logging on all routes
✅ Error tracking active
```

---

## Week 7 Deliverables Summary
1. ✅ Unit tests for all 7 repositories
2. ✅ Unit tests for all 11 data models
3. ✅ Integration tests for 6 core flows
4. ✅ 80%+ code coverage achieved
5. ✅ CI pipeline with test gate
6. ✅ Structured logging (Winston/Pino)
7. ✅ Error tracking (Sentry/Crashlytics)
8. ✅ Retry logic with exponential backoff + circuit breaker
9. ✅ Pagination on all list endpoints
10. ✅ Image URL optimization
11. ✅ Security hardening
12. ✅ Health check endpoint enhanced
