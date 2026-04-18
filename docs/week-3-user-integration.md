# Week 3 – User App Functional Integration

## Goal
User-side ke tamam APIs functional banana — auth, venue discovery, busyness+vibe display, offer redemption, aur preference-based filtering.

---

## Screens ka Backend Mapping

### Screen 1: Splash / App Intro Screen
**Backend kaam:**
- `GET /config/app` — already built (Week 2)
- Add: **token validation check**
  ```
  Client sends: Authorization: Bearer <token>
  Backend checks: token valid? → return user data
  Token expired? → return 401 → client shows login screen
  No token? → show login screen
  ```

### Screen 2: Login / Signup Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Register API** — `POST /auth/register`
```json
Request: {
  "email": "alex@example.com",   // or phone
  "password": "securePass123",
  "name": "Alex"
}
Response: {
  "success": true,
  "user": { "id", "email", "name", "role": "user" },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

**Login API** — `POST /auth/login`
```json
Request: { "email": "alex@example.com", "password": "securePass123" }
Response: { "success": true, "user": {...}, "tokens": {...} }
```

**Google Sign-In** — `POST /auth/google`
```json
Request: { "idToken": "google-oauth-token" }
→ Verify with Google → Create/find user → Return JWT tokens
```

**Apple Sign-In** — `POST /auth/apple`
```json
Request: { "identityToken": "apple-token", "authorizationCode": "..." }
→ Verify with Apple → Create/find user → Return JWT tokens
```

**Guest Login** — `POST /auth/guest`
```json
Request: {} (no body needed)
Response: {
  "user": { "id", "role": "guest", "name": "Guest" },
  "tokens": { "accessToken": "...(limited scope)..." }
}
```
- Guest restrictions: cannot save venues, cannot redeem offers, cannot access notifications

**Forgot Password** — `POST /auth/forgot-password`
```json
Request: { "email": "alex@example.com" }
→ Send reset email with token link
```

**Reset Password** — `POST /auth/reset-password`
```json
Request: { "token": "reset-token", "newPassword": "newPass123" }
```

**Refresh Token** — `POST /auth/refresh-token`
```json
Request: { "refreshToken": "..." }
Response: { "accessToken": "new-token", "refreshToken": "new-refresh" }
```

**Middleware:**
- `authMiddleware` — verify JWT on protected routes
- `roleMiddleware("user")` — check role for user-only routes
- `guestMiddleware` — allow guest with limited access

### Screen 3: Preferences Screen (Onboarding) ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Get all tags** — `GET /tags` (already built Week 2)
```json
Response: {
  "vibes": ["Chill", "Party", "Romantic", ...],
  "music": ["House", "R&B", "Indie", ...]
}
```

**Save preferences** — `POST /users/preferences`
```json
Request: {
  "vibes": ["Chill", "Party", "Romantic"],
  "music": ["House", "R&B"]
}
Response: { "success": true, "preferences": {...} }
```

**Get preferences** — `GET /users/preferences`
- Returns current user's saved preferences
- Used to decide if onboarding screen show karna hai ya skip

**Update preferences** — `PUT /users/preferences`
- Same as POST but updates existing

**Skip logic:**
- If user skips → no preferences saved → feed shows all venues (no personalization)
- If user saves → feed sorted/weighted by matching preferences

### Screen 4: Home / City Feed Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**List Venues** — `GET /venues`
```
Query params:
  ?city=manchester          (required)
  &category=bar             (optional: all/bar/club/restaurant/lounge)
  &sort=recommended         (optional: recommended/distance/busyness)
  &page=1&limit=10          (pagination)

Response: {
  "success": true,
  "venues": [
    {
      "id": "v1",
      "name": "Albert's Schloss",
      "address": "Peter Street",
      "area": "Peter Street",
      "city": "Manchester",
      "category": "Bar",
      "images": ["url1", "url2"],
      "priceLevel": 2,
      "isLive": true,
      "coordinates": { "lat": 53.4745, "lng": -2.2489 },
      "busyness": {
        "level": "busy",
        "percentage": 88,
        "isLive": true
      },
      "vibeTags": ["BUZZING", "HOUSE MUSIC"],
      "activeOffer": {
        "title": "2-for-1",
        "badge": "OFFER 2-for-1"
      },
      "distance": "0.3 miles",
      "isSaved": false
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 86, "pages": 9 }
}
```

**Personalized feed logic:**
- If user has preferences → venues matching user's vibes/music get higher weight
- Score calculation: `matchScore = (matching vibes count * 2) + (matching music count * 1)`
- Sort by: matchScore DESC, then busyness DESC

**Save/Unsave Venue** — `POST /users/saved-venues/:venueId`
```json
Response: { "success": true, "saved": true }
```
**Unsave** — `DELETE /users/saved-venues/:venueId`

**Search Venues** — `GET /venues/search?q=alchemist&city=manchester`
- Search by venue name, area, tags

### Screen 5: Venue List Filter Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Filtered Venues** — `GET /venues` (same endpoint with filters)
```
Query params:
  ?city=manchester
  &atmosphere=lively         (quiet/lively/packed)
  &vibes=underground-tech,industrial-chic   (comma separated)
  &priceMin=2&priceMax=2     (price range)

Response: same as venue list + count
  "filterCount": 24  ← "Show 24 Venues"
```

**Get filter options** — `GET /venues/filter-options?city=manchester`
```json
Response: {
  "atmospheres": ["Quiet", "Lively", "Packed"],
  "vibes": ["Underground Tech", "Rooftop Terrace", "Industrial Chic", "Hidden Speakeasy", "Neon Jungle"],
  "priceRange": { "min": 1, "max": 4 }
}
```

### Screen 6: Venue Detail Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Venue Detail** — `GET /venues/:id`
```json
Response: {
  "venue": {
    "id": "v1",
    "name": "The Alchemist",
    "area": "Spinningfields",
    "category": "Cocktail Bar",
    "rating": 4.8,
    "images": ["url1", "url2", "url3"],
    "coordinates": { "lat": 53.4798, "lng": -2.2507 },
    "address": "3 Hardman St, Manchester",
    "busyness": {
      "level": "busy",
      "percentage": 85,
      "isLive": true,
      "peakTimeExpected": "10:30 PM"
    },
    "vibe": {
      "tags": ["Dim Lighting", "House Music", "Mixology"],
      "vibeCheckScore": 4.8,
      "responseCount": 42
    },
    "activeOffer": {
      "id": "o1",
      "title": "2-for-1 Signature Cocktails",
      "endsIn": "2h",
      "type": "member_perk"
    },
    "socialProof": {
      "count": 14,
      "names": ["Sarah", "Mike"],
      "message": "Sarah, Mike & 12 others are here"
    },
    "distance": "0.4 miles",
    "isSaved": true
  }
}
```

**Track venue view** — `POST /venues/:id/view` (for analytics)
- Increment view count silently

### Screen 7: Manchester Map View Screen
**Backend kaam:**

**Map Markers** — `GET /venues/map-markers?city=manchester`
```json
Response: {
  "markers": [
    {
      "venueId": "v1",
      "name": "Albert's Schloss",
      "lat": 53.4745,
      "lng": -2.2489,
      "busynessLevel": "busy",
      "vibeLabel": "BUZZING",
      "icon": "trophy"
    }
  ]
}
```

**Trending Venues** — `GET /venues/trending?city=manchester&limit=5`
```json
Response: {
  "venues": [
    {
      "id", "name", "rating", "distance", "area",
      "tags": ["ELECTRIC", "COCKTAILS"],
      "thumbnail": "url",
      "isSaved": false
    }
  ]
}
```

### Screen 8: Offer Details Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Offer Detail** — `GET /offers/:id`
```json
Response: {
  "offer": {
    "id": "o1",
    "title": "Buy 1 Get 1 Free Cocktails",
    "venue": { "name": "The Alchemist", "address": "Spinningfields, Manchester" },
    "isExclusive": true,
    "image": "url",
    "validUntil": "11:00 PM tonight",
    "expiresAt": "2024-10-24",
    "voucherCode": "RK-992-TX",
    "qrCodeData": "reki://offer/o1/RK-992-TX",
    "instructions": [
      "Present this digital voucher to your server before ordering.",
      "The server will scan the QR code to verify the offer status.",
      "Enjoy your cocktails! One voucher per customer per night."
    ],
    "location": { "lat": 53.4798, "lng": -2.2507, "address": "Spinningfields, Manchester" },
    "termsAndConditions": "TERMS & CONDITIONS APPLY • MUST BE 18+ • SUBJECT TO AVAILABILITY"
  }
}
```

**Claim Offer (Generate Voucher)** — `POST /offers/:id/claim`
```json
Response: {
  "voucherCode": "RK-992-TX",
  "qrCodeData": "reki://offer/o1/RK-992-TX",
  "status": "active"
}
```

**Add to Apple Wallet** — `POST /offers/:id/wallet-pass`
```json
Headers: Authorization: Bearer <token>

Backend logic:
  1. Fetch claimed offer + venue details
  2. Generate .pkpass file containing:
     - Offer title, venue name & address
     - QR code / barcode (voucherCode embedded)
     - Expiry date/time
     - REKI branding (logo, teal color scheme)
  3. Sign .pkpass with Apple Wallet certificate
  4. Return file as download

Response: .pkpass file (Content-Type: application/vnd.apple.pkpass)

Requirements:
  - Apple Developer account with Pass Type ID
  - Pass certificate (.p12) + WWDR intermediate cert
  - Library: passkit-generator (Node.js) or similar
  - Pass type: "coupon" (Apple's pass style for offers)

Pass fields:
  - headerField: venue name
  - primaryField: offer title
  - secondaryField: "Valid until 11:00 PM"
  - auxiliaryField: voucher code "RK-992-TX"
  - barcode: { format: "PKBarcodeFormatQR", message: "reki://offer/o1/RK-992-TX" }
  - relevantDate: offer expiry (triggers lock screen notification)
  - locations: [{ lat, lng }] (triggers notification near venue)
```

### Screen 9: Offer Redeemed Confirmation Screen ⭐ PRIMARY THIS WEEK
**Backend kaam:**

**Redeem Offer** — `POST /offers/:id/redeem`
```json
Request: { "voucherCode": "RK-992-TX" }

Validation:
  1. Is offer still active? ✅
  2. Is current time within valid hours? ✅
  3. Has user already redeemed tonight? ❌ (not yet) ✅
  4. Is redemptionCount < maxRedemptions? ✅

Response (success): {
  "success": true,
  "redemption": {
    "status": "redeemed",
    "venueName": "20 Stories Manchester",
    "offerTitle": "1x Complimentary Signature Cocktail",
    "transactionId": "#REKI-8829-MNCH",
    "redeemedAt": "2023-10-24T22:45:00Z",
    "savingValue": 14.50,
    "currency": "GBP"
  }
}

Response (already redeemed): {
  "success": false,
  "error": { "code": "ALREADY_REDEEMED", "message": "You've already redeemed this offer tonight." }
}
```

**Get user's redemption history** — `GET /users/redemptions`

### Screen 10: Notifications Screen
**Backend kaam:**

**Get Notifications** — `GET /notifications`
```json
Query: ?grouped=true

Response: {
  "today": [
    { "id", "type": "VIBE_ALERT", "title": "Albert Hall is peaking!", "message": "🔥 High Vibe Alert\n80% capacity reached.", "timeAgo": "2m ago", "isRead": false, "icon": "venue", "venueId": "v5" },
    { "type": "LIVE_PERFORMANCE", "title": "YES Manchester", "message": "New live set starting in 15 mins on the Pink Room stage.", "timeAgo": "15m ago" },
    { "type": "SOCIAL_CHECKIN", "title": "Alex just checked in", "message": "Alex is at Diecast. Join the crew!", "timeAgo": "1h ago" }
  ],
  "yesterday": [
    { "type": "TICKET_SECURED", "title": "Ticket Secured!", "message": "Your tickets for Warehouse Project are now available in your wallet.", "timeAgo": "22h ago" },
    { "type": "WELCOME", "title": "Welcome to REKI", "message": "Start exploring Manchester's best vibes.", "timeAgo": "1d ago" }
  ],
  "earlier": [
    { "type": "WEEKLY_RECAP", "title": "Weekly Recap", "message": "You visited 4 venues last week. View your night-out highlights!", "timeAgo": "3d ago" }
  ]
}
```

**Mark as read** — `PUT /notifications/:id/read`
**Mark all read** — `PUT /notifications/read-all`
**Create welcome notification** — triggered on user signup (internal)

### Screen 11: Business Login Screen
**Backend kaam:** ❌ Week 3 mein nahi — Week 4 mein hoga

### Screen 12: Venue Dashboard Screen
**Backend kaam:** ❌ Week 3 mein nahi — Week 4 mein hoga

### Screen 13: Update Busyness & Vibe Screen
**Backend kaam:** ❌ Week 3 mein nahi — Week 4 mein hoga

### Screen 14: Create / Manage Offers Screen
**Backend kaam:** ❌ Week 3 mein nahi — Week 4 mein hoga

### Screen 15: Loading Screen
**Backend kaam:**
- Ensure venue list API returns within 500ms
- Add database indexes on frequently queried fields
- Optimize venue query with proper projections (don't return unnecessary fields in list)

### Screen 16: Error / Empty State Screen
**Backend kaam:**
- Implement proper empty responses:
  ```json
  GET /venues?vibes=nonexistent
  Response: {
    "success": true,
    "venues": [],
    "pagination": { "total": 0 },
    "message": "No venues match your current filters in Manchester."
  }
  ```
- All 404/empty results return structured response (not crash)

---

## Admin — Week 3
**Backend kaam:**
- `GET /admin/users` — list all registered users
- `GET /admin/users/:id/activity` — user's login history, redemptions
- Basic user count stats for admin dashboard

---

## Week 3 Deliverables Summary
1. ✅ Full auth system (register, login, Google, Apple, guest, forgot password)
2. ✅ JWT middleware (access + refresh tokens)
3. ✅ Role-based middleware (user, guest, business, admin)
4. ✅ User preferences CRUD (save/update vibes & music)
5. ✅ Venue listing API with filters (atmosphere, vibe, price, category)
6. ✅ Personalized feed (preference-based sorting)
7. ✅ Venue search API
8. ✅ Venue detail API (busyness, vibe, offer, social proof)
9. ✅ Save/unsave venue API
10. ✅ Map markers API
11. ✅ Trending venues API
12. ✅ Offer detail + claim API
13. ✅ Apple Wallet pass generation API (.pkpass)
14. ✅ Offer redemption API (with all validations)
15. ✅ Notifications API (grouped, mark read)
16. ✅ Venue view tracking
17. ✅ Admin user listing API

---

## Implementation Status (Updated: 2026-04-17)

### Auth Module — ✅ COMPLETE
- ✅ `POST /auth/register` — email/password registration with JWT
- ✅ `POST /auth/login` — email/password login
- ✅ `POST /auth/google` — Google OAuth (idToken decode + create/find user)
- ✅ `POST /auth/apple` — Apple Sign-In (identityToken decode + create/find user)
- ✅ `POST /auth/guest` — Guest login with restricted JWT
- ✅ `POST /auth/forgot-password` — JWT reset token generation (15min expiry)
- ✅ `POST /auth/reset-password` — Token verification + password update
- ✅ `POST /auth/refresh-token` — Refresh token rotation with revocation

### Guards & Middleware — ✅ COMPLETE
- ✅ `JwtAuthGuard` — Passport JWT strategy
- ✅ `LocalAuthGuard` — Passport local strategy
- ✅ `RolesGuard` + `@Roles()` — Role-based access control
- ✅ `NoGuestGuard` — Blocks guests from save/claim/redeem/notifications

### User Module — ✅ COMPLETE
- ✅ `GET /users/preferences` — Returns vibes + music + hasPreferences flag
- ✅ `POST /users/preferences` — Save preferences (onboarding)
- ✅ `PUT /users/preferences` — Update preferences
- ✅ `GET /users/saved-venues` — List saved venue IDs
- ✅ `POST /users/saved-venues/:venueId` — Save venue
- ✅ `DELETE /users/saved-venues/:venueId` — Unsave venue
- ✅ `GET /users/redemptions` — Redemption history with offer + venue details

### Venue Module — ✅ COMPLETE
- ✅ `GET /venues` — Full filter support + pagination (page/limit) + personalized feed
- ✅ `GET /venues/search?q=` — Search by name, area, tags
- ✅ `GET /venues/filter-options` — Dynamic filter options (atmospheres, vibes, priceRange)
- ✅ `GET /venues/trending` — Top 5 by busyness
- ✅ `GET /venues/map-markers` — All markers with lat/lng/busyness/vibe
- ✅ `GET /venues/:id` — Full detail with busyness + vibe + offers
- ✅ `POST /venues/:id/view` — View tracking

### Offers Module — ✅ COMPLETE
- ✅ `GET /offers/:id` — Offer detail with status + availability check
- ✅ `POST /offers/:id/claim` — Generates voucher code (RK-XXX-XX) + QR + transaction ID
- ✅ `POST /offers/:id/redeem` — Validates voucher, marks redeemed, returns saving value
- ✅ `POST /offers/:id/wallet-pass` — Apple Wallet pass data structure
- ✅ Double-redeem protection (ALREADY_REDEEMED error)
- ✅ Duplicate claim prevention (returns existing claim)
- ✅ 7-rule availability check (active, day, time, overnight, max, expiry)

### Notifications Module — ✅ COMPLETE
- ✅ `GET /notifications` — Grouped by Today/Yesterday/Earlier
- ✅ `PUT /notifications/:id/read` — Mark single as read
- ✅ `PUT /notifications/read-all` — Mark all as read

### Admin Module — ✅ COMPLETE
- ✅ `GET /admin/stats` — totalUsers, totalVenues, activeOffers, redemptionsToday
- ✅ `GET /admin/users` — List all users with role/provider/status
- ✅ `GET /admin/users/:id/activity` — User redemption history
