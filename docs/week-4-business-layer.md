# Week 4 – Business (Venue) Control Layer

> **Status: ✅ COMPLETE — All 10 deliverables implemented & tested (April 17, 2026)**

## Goal
Business portal ke tamam APIs banana — business login, venue dashboard, busyness/vibe update, offer creation & management, aur basic analytics.

---

## Screens ka Backend Mapping

### Screen 1: Splash / App Intro Screen
**Backend kaam:** ✅ Already done (Week 2)

### Screen 2: Login / Signup Screen
**Backend kaam:** ✅ Already done (Week 3) — minor improvements:
- ⏳ Rate limiting on login endpoint (5 attempts per 15 min) — Phase 2
- ⏳ Account lockout after repeated failures — Phase 2

### Screen 3: Preferences Screen
**Backend kaam:** ✅ Already done (Week 3)

### Screen 4: Home / City Feed Screen
**Backend kaam:** ✅ Already done (Week 3) — improvement:
- ✅ Feed now reflects REAL busyness updates from business owners (not just mock) — **IMPLEMENTED & TESTED**: `PUT /business/venues/:id/status` updates busyness → `GET /venues/:id` immediately shows new data
- ✅ When business updates busyness → user feed immediately shows new data

### Screen 5: Venue List Filter Screen
**Backend kaam:** ✅ Already done (Week 3)

### Screen 6: Venue Detail Screen
**Backend kaam:** ✅ Already done (Week 3) — improvement:
- ✅ Vibe tags now come from real business updates — **IMPLEMENTED**: vibes updated via `PUT /business/venues/:id/status`
- ✅ Busyness % now reflects real business updates — **TESTED**: moderate→50%, busy→85%
- ✅ Offer "Ends in Xh" calculated from actual offer validTimeEnd

### Screen 7: Manchester Map View Screen
**Backend kaam:** ✅ Already done (Week 3) — improvement:
- ✅ Map markers busynessLevel now reflects real business updates — **IMPLEMENTED**: busyness table updated by business owner

### Screen 8: Offer Details Screen
**Backend kaam:** ✅ Already done (Week 3)

### Screen 9: Offer Redeemed Confirmation Screen
**Backend kaam:** ✅ Already done (Week 3)

### Screen 10: Notifications Screen
**Backend kaam:** ✅ **IMPLEMENTED** — Improvements:
- ✅ When business updates busyness to 80%+ → auto-trigger vibe alert notification to users who saved that venue — **TESTED**: `triggerVibeAlert()` fires on busyness >= 80%:
  ```
  Notification: {
    type: "VIBE_ALERT",
    title: "Albert's Schloss is peaking!",
    message: "🔥 High Vibe Alert\n80% capacity reached. Entry might be restricted soon. Grab your spot!",
    venueId: "v1"
  }
  ```
- ✅ When business creates new offer → notify users who saved that venue — **IMPLEMENTED**: `notifySavedUsers()` called in `createOffer()`

### Screen 11: Business Login Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:** ✅ **ALL IMPLEMENTED & TESTED**

**Business Login** — `POST /auth/business/login` ✅
```json
Request: { "email": "manager@venue.com", "password": "securePass" }
Response: {
  "user": {
    "id": "b1",
    "email": "manager@venue.com",
    "name": "John Smith",
    "role": "business",
    "venue": {
      "id": "v1",
      "name": "Albert's Schloss",
      "address": "Peter St, Manchester"
    }
  },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

**Business Forgot Password** — `POST /auth/business/forgot-password` ✅
```json
Request: { "email": "manager@venue.com" }
```

**Business Register (Apply to join REKI)** — `POST /auth/business/register` ✅
```json
Request: {
  "email": "newmanager@venue.com",
  "password": "securePass",
  "name": "Jane Doe",
  "venueName": "New Venue",
  "venueAddress": "123 Oxford Road, Manchester",
  "venueCategory": "Bar",
  "phone": "+4412345678"
}
Response: {
  "success": true,
  "message": "Application submitted. We'll review and get back to you.",
  "status": "pending"
}
```
- ✅ Business accounts start as `isApproved: false` — **IMPLEMENTED**: BusinessUser entity has `isApproved` field
- ✅ For MVP: auto-approve all (no admin approval flow needed since admin is view-only) — **IMPLEMENTED**: `isApproved: true` set in register

**Role Middleware** — `roleMiddleware("business")` ✅
- ✅ All `/business/*` routes require business role token — **IMPLEMENTED**: `BusinessGuard` + `JwtAuthGuard` on all business endpoints. **TESTED**: admin token blocked from /business routes (403)

### Screen 12: Venue Dashboard Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:** ✅ **ALL IMPLEMENTED & TESTED**

> **Note**: Screen 12 shows 4 tabs: OVERVIEW, INSIGHTS, PROMOS, STAFF. MVP mein sirf OVERVIEW aur INSIGHTS cover ho rahe hain. PROMOS tab ka backend Screen 14 (Manage Offers) mein hai. **STAFF tab** abhi UI placeholder hai — staff management (invite, roles, permissions) Phase 2+ mein aayega. Backend mein staff role enum (owner/manager/staff) already BusinessUser model mein defined hai.

**Get Dashboard** — `GET /business/dashboard/:venueId` ✅ **TESTED**: venue=Albert's Schloss, busyness=85%, vibes=High Energy,Packed, weather=rain
```json
Headers: Authorization: Bearer <business-token>

Response: {
  "venue": {
    "id": "v1",
    "name": "Albert's Schloss",
    "address": "Peter St, Manchester",
    "openUntil": "2:00 AM",
    "isLive": true,
    "isVerified": true
  },
  "stats": {
    "livebusyness": {
      "percentage": 88,
      "change": "+12%",
      "level": "busy"
    },
    "avgDwellTime": {
      "minutes": 54,
      "change": "-4m",
      "comparedTo": "yesterday average"
    }
  },
  "vibeStatus": {
    "label": "High Energy",
    "description": "The crowd is highly engaged with the current DJ set. Positive sentiment is up 24% in the last hour.",
    "tags": ["High Energy", "Packed"],
    "activeUsers": 42
  },
  "engagement": {
    "vibeChecks": {
      "score": 4.8,
      "responses": 42,
      "period": "last 30m",
      "trend": "STRONG"
    },
    "socialShares": {
      "count": 128,
      "sources": "Instagram & REKI feed",
      "change": "+8.5%"
    }
  },
  "weather": {
    "message": "Manchester Weather: Heavy rain expected at 11 PM. Historical data suggests +15% dwell time increase.",
    "icon": "rain"
  }
}
```

**Weather Integration:** ✅ **IMPLEMENTED** (mock for MVP)
- ✅ Mock weather returns: rain, 8°C, "+15% dwell time increase" message
- ⏳ OpenWeatherMap real API integration — Phase 2 (needs API key)
- ✅ Insight logic: rain → "+15% dwell time expected" (mock correlation)

**Dashboard Analytics** — `GET /business/analytics/:venueId` ✅ **TESTED**: views=1250, saves=340, clicks=89, redemptions=42
```json
Query: ?period=today  (today/week/month)

Response: {
  "views": { "total": 456, "change": "+15%" },
  "saves": { "total": 89, "change": "+8%" },
  "offerClicks": { "total": 234, "change": "+22%" },
  "redemptions": { "total": 42, "change": "+5%" }
}
```

### Screen 13: Update Busyness & Vibe Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:** ✅ **ALL IMPLEMENTED & TESTED**

**Update Venue Status** — `PUT /business/venues/:id/status` ✅ **TESTED**: moderate→50%, busy→85%, vibes updated, vibe alert triggered at 80%+
```json
Headers: Authorization: Bearer <business-token>

Request: {
  "busyness": "moderate",
  "vibes": ["chill", "live-music"]
}

Validation:
  - Business user must own this venue (venueId match)
  - busyness must be: "quiet" | "moderate" | "busy"
  - vibes must be valid tag names

Backend logic:
  1. Update Busyness record:
     - level = "moderate"
     - percentage = 50 (auto-mapped)
     - lastUpdated = now
     - updatedBy = businessUserId
  2. Update Vibe record:
     - tags = ["chill", "live-music"]
     - lastUpdated = now
     - updatedBy = businessUserId
  3. Log activity:
     - ActivityLog: { actor: businessUserId, action: "STATUS_UPDATE", target: "venue", details: {...} }
  4. If busyness >= 80% → trigger VIBE_ALERT notifications to saved users

Response: {
  "success": true,
  "message": "Status updated! Updates are shared with REKI community.",
  "venue": {
    "busyness": { "level": "moderate", "percentage": 50 },
    "vibe": { "tags": ["chill", "live-music"] }
  }
}
```

**Get Venue Status** — `GET /business/venues/:id/status` ✅ **TESTED**: returns current busyness level, percentage, vibes, lastUpdated

**Busyness-to-percentage mapping:**
```
quiet    → 25%
moderate → 50%
busy     → 85%
```

### Screen 14: Create / Manage Offers Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:** ✅ **ALL IMPLEMENTED & TESTED**

**List Venue Offers** — `GET /business/venues/:id/offers` ✅ **TESTED**: active=1, inactive=0 (before create)
```json
Response: {
  "activeDeals": [
    {
      "id": "o1",
      "title": "Happy Hour 2-for-1",
      "schedule": "Mon-Fri, 5pm-7pm",
      "redemptionCount": 42,
      "isActive": true,
      "icon": "cocktail"
    },
    {
      "id": "o2",
      "title": "Student Night Discount",
      "schedule": "Wednesdays",
      "redemptionCount": 120,
      "redemptionLabel": "120 redeemed today",
      "isActive": true,
      "icon": "student"
    }
  ],
  "upcomingAndPast": [
    {
      "id": "o3",
      "title": "Weekend Welcome Drink",
      "schedule": "Sat-Sun",
      "statusLabel": "Resumes tomorrow",
      "isActive": false
    },
    {
      "id": "o4",
      "title": "Birthday Group Platter",
      "schedule": "Custom dates",
      "statusLabel": "Currently disabled",
      "isActive": false
    }
  ]
}
```

**Create Offer** — `POST /business/offers` ✅ **TESTED**: Weekend Special created + auto-notification to saved users
```json
Request: {
  "venueId": "v1",
  "title": "Happy Hour 2-for-1",
  "description": "Buy one cocktail get one free during happy hour",
  "type": "2-for-1",
  "validDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "validTimeStart": "17:00",
  "validTimeEnd": "19:00",
  "maxRedemptions": 100,
  "expiresAt": "2024-12-31"
}

Validation:
  - Business user must own this venue
  - Title required, max 100 chars
  - At least one validDay
  - validTimeStart < validTimeEnd
  - expiresAt > today

Response: {
  "success": true,
  "offer": { "id": "o5", ...all fields }
}
```

**Toggle Offer** — `PUT /business/offers/:id/toggle` ✅ **TESTED**: off→false, on→true
```json
Request: { "isActive": true }   // or false
Response: { "success": true, "offer": { "id", "isActive": true } }
```

**Update Offer** — `PUT /business/offers/:id` ✅ **TESTED**: title updated to 'Updated Weekend Special'
```json
Request: { ...updated fields }
```

**Delete Offer** — `DELETE /business/offers/:id` ✅ **TESTED**: soft deleted, moved to upcomingAndPast list
- ✅ Soft delete (mark as inactive + expiresAt=now, don't remove from DB)

### Screen 15: Loading Screen
**Backend kaam:**
- ⏳ Optimize dashboard API queries (business portal loads faster) — Phase 2
- ⏳ Add caching for analytics data (update every 5 min, not every request) — Phase 2

### Screen 16: Error / Empty State Screen
**Backend kaam:** ✅ **IMPLEMENTED**
- ✅ Business-specific errors (all in `ErrorCode` enum + tested):
  ```
  VENUE_NOT_OWNED: "You don't have permission to manage this venue" ✅ TESTED (403)
  OFFER_LIMIT_REACHED: "Maximum active offers limit reached"
  INVALID_SCHEDULE: "Offer schedule is invalid"
  VENUE_OFFLINE: "Your venue is currently offline"
  ```

---

## Admin — Week 4
**Backend kaam:** ✅ **ALL IMPLEMENTED & TESTED**
- `GET /admin/venues` ✅ **TESTED**: count=17 venues with busyness/vibe status
- `GET /admin/venues/:id/logs` ✅ **TESTED**: count=2 (STATUS_UPDATE logs)
- `GET /admin/offers` ✅ **TESTED**: count=6 offers across all venues
- `GET /admin/offers/redemptions` ✅ **TESTED**: redemption logs endpoint working
- `GET /admin/stats` ✅ **TESTED**: platform overview with new fields:
  ```json
  {
    "totalUsers": 3450,
    "activeTonight": 1250,
    "totalVenues": 86,
    "liveVenuesNow": 24,
    "activeOffers": 45,
    "redemptionsToday": 89,
    "newSignupsToday": 12
  }
  ```
- `GET /admin/activity-logs` ✅ **TESTED**: count=7 (BUSINESS_LOGIN, STATUS_UPDATE, OFFER_CREATED)

---

## Week 4 Deliverables Summary
1. ✅ Business authentication (login, register/apply, forgot password) — **TESTED**: login returns JWT + venue, register auto-approves, forgot-password returns resetToken
2. ✅ Business role middleware — **TESTED**: `BusinessGuard` blocks admin/user roles (403)
3. ✅ Venue dashboard API (live stats, engagement, weather) — **TESTED**: busyness=85%, vibes, dwell=54m, weather=rain
4. ✅ Update busyness + vibe API (with auto-notifications) — **TESTED**: moderate→50%, busy→85%, vibe alert fires at 80%+
5. ✅ Offer CRUD (create, list, toggle, update, delete) — **TESTED**: all 5 operations passed, soft delete confirmed
6. ✅ Business analytics API (views, clicks, redemptions) — **TESTED**: views=1250, saves=340, clicks=89, redemptions=42
7. ✅ Weather integration (mock for MVP) — **TESTED**: rain icon, 8°C, "+15% dwell time increase"
8. ✅ Activity logging (status updates tracked) — **TESTED**: 7 logs (BUSINESS_LOGIN, STATUS_UPDATE, OFFER_CREATED)
9. ✅ Auto-trigger vibe alert notifications (busyness > 80%) — **TESTED**: `triggerVibeAlert()` → notifications created for saved users
10. ✅ Admin APIs (venues, offers, redemptions, stats, activity logs) — **TESTED**: 5 new endpoints all working

### Implementation Details
- **Files created**: `dto/business-login.dto.ts`, `dto/business-register.dto.ts`, `dto/update-venue-status.dto.ts`, `dto/offer.dto.ts`, `dto/index.ts`, `common/guards/business.guard.ts`
- **Files rewritten**: `business.service.ts` (full Week 4), `business.controller.ts` (full Week 4)
- **Files updated**: `business.module.ts`, `admin.service.ts`, `admin.controller.ts`, `admin.module.ts`, `seed-data.ts`, `seed.service.ts`, `seed.module.ts`, `guards/index.ts`
- **Seed data added**: 3 business users — `manager@alberts.com`, `manager@warehouse.com`, `manager@alchemist.com` (password: `business123`)
- **Build**: webpack (`npx nest build --webpack`) → dist/main.js

### Phase 2 Deferred Items
- ⏳ Rate limiting on login (5 attempts per 15 min)
- ⏳ Account lockout after repeated failures
- ⏳ OpenWeatherMap real API integration (needs API key)
- ⏳ Dashboard query optimization + caching
- ⏳ Staff management (invite, roles, permissions)
