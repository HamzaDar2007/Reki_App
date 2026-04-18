# Week 1 – Technical Planning & MVP Scoping

> **Status: ✅ COMPLETE** — Build passing, 108 source files, 12 modules, 12 entities
> **Tech Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + Passport JWT
> **Build:** `npx nest build` → Clean (no errors)

## Goal
Architecture finalize karna, data models design karna, city config banana, aur investor demo flow define karna.

---

## Screens ka Backend Mapping (Kaunsi Screen ka Kya Banana Hai)

### Screen 1: Splash / App Intro Screen
**Backend kaam:**
- ✅ App config API: `GET /config/app` — app version, city, tagline → `src/app.controller.ts` + `src/app.service.ts`
- ✅ City config: Manchester defaults (lat: 53.4808, lng: -2.2426) → `src/config/app.config.ts`
- ✅ Health check endpoint: `GET /health` → `src/app.controller.ts`

### Screen 2: Login / Signup Screen
**Backend kaam:**
- ✅ Auth architecture implemented:
  - ✅ Email + Password (JWT based) → `POST /auth/login` working
  - ✅ Apple Sign-In DTO ready → `AppleAuthDto` (implementation Week 3)
  - ✅ Google Sign-In DTO ready → `GoogleAuthDto` (implementation Week 3)
  - ✅ Guest mode → `POST /auth/guest` working (anonymous token)
- ✅ User entity created → `src/modules/users/entities/user.entity.ts`
  ```
  User {
    id (UUID), email (unique, nullable), phone (nullable), name,
    password (nullable, hashed), authProvider (EMAIL/APPLE/GOOGLE/GUEST),
    role (USER/BUSINESS/ADMIN/GUEST), isVerified, isActive,
    preferences (JSONB: {vibes[], music[]}), savedVenues (text[]),
    createdAt, updatedAt
  }
  ```
- ✅ Password hashing: bcrypt (10 salt rounds) → `src/modules/auth/auth.service.ts`
- ✅ JWT tokens: accessToken (15min) + refreshToken (7 days) → `src/modules/auth/strategies/jwt.strategy.ts`
- ✅ Refresh token entity → `src/modules/auth/entities/refresh-token.entity.ts`
- ✅ Forgot/Reset Password DTOs ready → `src/modules/auth/dto/password.dto.ts` (implementation Week 3)
- ✅ Working endpoints:
  - `POST /auth/register` → register + return tokens
  - `POST /auth/login` → LocalStrategy validates → return tokens
  - `POST /auth/guest` → anonymous guest user + token
  - `POST /auth/refresh-token` → revoke old + issue new tokens

### Screen 3: Preferences Screen (Onboarding)
**Backend kaam:**
- ✅ Vibe tags master list (14 tags) → `src/seed/seed-data.ts`
  ```
  VibeTags: [Chill, Party, Romantic, High Energy, Intimate, Industrial, Rooftop, Underground, Late Night, Hidden Entrance, Date Night, Beer Garden, Packed, Live Music]
  ```
- ✅ Music tags master list (6 tags) → `src/seed/seed-data.ts`
  ```
  MusicTags: [House, R&B, Indie, Lo-fi, Techno, Vinyl]
  ```
- ✅ User preferences → JSONB field on User entity (`preferences: {vibes[], music[]}`)
- ✅ Tag entity + TagCategory enum (VIBE/MUSIC) → `src/modules/tags/entities/tag.entity.ts`
- ✅ Tags API working:
  - `GET /tags` → returns `{ vibes: Tag[], music: Tag[] }`
  - `GET /tags/search?q=query` → ILIKE search on tag name

### Screen 4: Home / City Feed Screen
**Backend kaam:**
- ✅ Venue entity created → `src/modules/venues/entities/venue.entity.ts`
  ```
  Venue {
    id (UUID), name, address, city (default: Manchester), area,
    category (BAR/CLUB/RESTAURANT/LOUNGE/LIVE_MUSIC_VENUE/PUB/ROOFTOP_BAR/COCKTAIL_BAR),
    lat (decimal 10,7), lng (decimal 10,7), images (text[]),
    priceLevel (int 1-4, default 2), openingHours, closingTime,
    isLive (boolean), tags (text[]), rating (decimal 2,1),
    createdAt, updatedAt
  }
  ```
- ✅ Busyness entity created → `src/modules/busyness/entities/busyness.entity.ts`
  ```
  Busyness {
    id (UUID), venueId (FK), level (QUIET/MODERATE/BUSY enum),
    percentage (int, default 25), updatedBy, dwellTime (int),
    lastUpdated (auto)
  }
  ```
- ✅ VenueCategory enum (8 categories) → `src/common/enums/venue-category.enum.ts`
- ✅ Feed routes planned → `src/modules/venues/venues.controller.ts`:
  - `GET /venues` (filters, pagination — implementation Week 2)
  - `GET /venues/:id` (detail — implementation Week 2)

### Screen 5: Venue List Filter Screen
**Backend kaam:**
- ✅ Filter parameters designed in controller (atmosphere, vibe, price)
- ✅ BusynessLevel enum with percentage mapping → `src/common/enums/busyness-level.enum.ts`:
  - Quiet = 25%, Moderate = 50%, Busy = 85%
- ✅ Filter routes planned: `GET /venues?atmosphere=...&vibe=...&price=...` (implementation Week 2)

### Screen 6: Venue Detail Screen
**Backend kaam:**
- ✅ Vibe entity created → `src/modules/vibes/entities/vibe.entity.ts`
  ```
  Vibe {
    id (UUID), venueId (FK, OneToOne Venue), tags (text[]),
    musicGenre (text[]), description, vibeCheckScore (decimal 2,1),
    responseCount (int), updatedBy, lastUpdated (auto)
  }
  ```
- ✅ Offer entity created → `src/modules/offers/entities/offer.entity.ts`
  ```
  Offer {
    id (UUID), venueId (FK, ManyToOne Venue), title, description,
    type (TWO_FOR_ONE/DISCOUNT/FREEBIE/GUESTLIST/HAPPY_HOUR),
    validDays (text[]), validTimeStart, validTimeEnd,
    isActive (boolean), redemptionCount (int), maxRedemptions (int),
    savingValue (decimal 8,2), expiresAt, createdAt
  }
  ```
- ✅ Venue detail route planned: `GET /venues/:id` (with relations: busyness, vibe, offers)
- ✅ VenuesService.findById() loads busyness + vibe + offers relations

### Screen 7: Manchester Map View Screen
**Backend kaam:**
- ✅ Geo-query route planned: `GET /venues?lat=...&lng=...&radius=...` (implementation Week 2)
- ✅ Trending route planned: `GET /venues/trending` (implementation Week 2)
- ✅ Map markers route planned: `GET /venues/map-markers` (implementation Week 2)
- ✅ Manchester coordinates configured: lat=53.4808, lng=-2.2426 → `src/config/app.config.ts`

### Screen 8: Offer Details Screen
**Backend kaam:**
- ✅ Redemption entity created → `src/modules/offers/entities/redemption.entity.ts`
  ```
  Redemption {
    id (UUID), offerId (FK), userId (FK), venueId (FK),
    voucherCode (unique, "RK-XXX-XX" format),
    qrCodeData, status (ACTIVE/REDEEMED/EXPIRED enum),
    transactionId ("#REKI-XXXX-MNCH" format),
    savingValue (decimal 8,2), currency (default: GBP),
    redeemedAt (nullable), createdAt
  }
  ```
- ✅ Voucher code generator → `src/common/utils/generators.util.ts` → `generateVoucherCode()` → "RK-992-TX"
- ✅ Apple Wallet route planned: `POST /offers/:id/wallet-pass` (implementation Week 5)
- ✅ Offer routes planned in controller:
  - `GET /offers/:id` — offer detail
  - `POST /offers/:id/claim` — generate voucher
  - `POST /offers/:id/redeem` — mark redeemed

### Screen 9: Offer Redeemed Confirmation Screen
**Backend kaam:**
- ✅ Transaction ID generator → `src/common/utils/generators.util.ts` → `generateTransactionId()` → "#REKI-4829-MNCH"
- ✅ Redemption response structure designed:
  ```
  { status: "redeemed", venueName, offerTitle, transactionId: "#REKI-XXXX-MNCH", redeemedAt, savingValue }
  ```

### Screen 10: Notifications Screen
**Backend kaam:**
- ✅ Notification entity created → `src/modules/notifications/entities/notification.entity.ts`
  ```
  Notification {
    id (UUID), userId (FK, ManyToOne User),
    type (VIBE_ALERT/LIVE_PERFORMANCE/SOCIAL_CHECKIN/OFFER_CONFIRMATION/WELCOME/WEEKLY_RECAP/TICKET_SECURED),
    title, message, icon (nullable), venueId (nullable), offerId (nullable),
    isRead (default: false), createdAt
  }
  ```
- ✅ NotificationType enum (7 types) → `src/common/enums/notification-type.enum.ts`
- ✅ Notification routes planned:
  - `GET /notifications` — grouped by Today/Yesterday/Earlier
  - `PUT /notifications/:id/read`
  - `PUT /notifications/read-all`
- ✅ NotificationsService.findByUserId() → ordered DESC by createdAt

### Screen 11: Business Login Screen
**Backend kaam:**
- ✅ BusinessUser entity created → `src/modules/business/entities/business-user.entity.ts`
  ```
  BusinessUser {
    id (UUID), email (unique), name, password,
    venueId (FK, ManyToOne Venue),
    role (OWNER/MANAGER/STAFF enum), phone (nullable),
    isApproved (default: false), isActive (default: true),
    createdAt, updatedAt
  }
  ```
- ✅ BusinessRole enum → `src/common/enums/business-role.enum.ts`
- ✅ Business auth routes planned: `POST /auth/business/login`, `POST /auth/business/register`
- ✅ Face ID → client-side, same JWT token

### Screen 12: Venue Dashboard Screen
**Backend kaam:**
- ✅ VenueAnalytics entity created → `src/modules/business/entities/venue-analytics.entity.ts`
  ```
  VenueAnalytics {
    id (UUID), venueId (FK, ManyToOne Venue), date,
    liveBusynessPercent (int), busynessChange (string ↑/↓/→),
    avgDwellTime (int, minutes), dwellTimeChange,
    vibeCheckScore (decimal 2,1), vibeCheckResponses (int),
    socialShares (int), socialSharesChange,
    totalViews (int), totalSaves (int),
    offerClicks (int), redemptions (int), createdAt
  }
  ```
  > Note: Screen 12 has STAFF tab — BusinessRole enum includes STAFF alongside OWNER/MANAGER
- ✅ Dashboard route planned: `GET /business/dashboard/:venueId` (implementation Week 4)
- ✅ Weather integration designed (OpenWeatherMap — implementation Week 5)

### Screen 13: Update Busyness & Vibe Screen
**Backend kaam:**
- ✅ Status update route planned: `PUT /business/venues/:id/status` (implementation Week 4)
- ✅ BusynessLevel enum with percentages:
  - Quiet = 25%, Moderate = 50%, Busy = 85%
- ✅ Request body structure designed

### Screen 14: Create / Manage Offers Screen
**Backend kaam:**
- ✅ Offer CRUD routes planned in business controller:
  - `GET /business/venues/:id/offers`
  - `POST /business/offers`
  - `PUT /business/offers/:id`
  - `PUT /business/offers/:id/toggle`
  - `DELETE /business/offers/:id`
- ✅ OfferStatus enum (ACTIVE/INACTIVE/EXPIRED/UPCOMING) → `src/common/enums/offer-type.enum.ts`

### Screen 15: Loading Screen
**Backend kaam:**
- ✅ No dedicated backend logic needed
- Frontend handles loading states

### Screen 16: Error / Empty State Screen
**Backend kaam:**
- ✅ HttpExceptionFilter → `src/common/filters/http-exception.filter.ts`
  ```
  { success: false, error: { code: "NO_VENUES_FOUND", message: "..." }, statusCode: 404 }
  ```
- ✅ ErrorCode enum (20+ codes) → `src/common/enums/error-codes.enum.ts`
  - Venue: NO_VENUES_FOUND, VENUE_NOT_FOUND
  - Offer: NO_OFFERS_AVAILABLE, OFFER_NOT_FOUND, OFFER_EXPIRED, ALREADY_REDEEMED, MAX_REDEMPTIONS_REACHED
  - Auth: UNAUTHORIZED, FORBIDDEN, INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS, TOKEN_EXPIRED
  - Business: VENUE_NOT_OWNED, OFFER_LIMIT_REACHED, VENUE_OFFLINE
  - General: INVALID_FILTER, SERVER_ERROR, VALIDATION_ERROR, NOT_FOUND

---

## Admin (View-Only) — Week 1 Planning
**Backend kaam:**
- ✅ Admin → same User model with role="admin" (Role.ADMIN enum)
- ✅ Admin module created → `src/modules/admin/`
- ✅ Protected by `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`
- ✅ Working endpoint:
  - `GET /admin/stats` → returns { totalUsers, totalVenues, activeOffers, redemptionsToday }
- ✅ Planned endpoints (implementation Week 4):
  - `GET /admin/users` — user list
  - `GET /admin/venues` — venue list
  - `GET /admin/offers` — offers list
  - `GET /admin/offers/redemptions` — redemption logs
  - `GET /admin/notifications` — notification logs
  - `GET /admin/activity-logs` — system activity
- ✅ Audit module → `src/modules/audit/` with ActivityLog entity for tracking all actions

---

## Week 1 Implementation Summary

### What Was Built (108 source files)

**12 Modules:**
| # | Module | Location | Status |
|---|--------|----------|--------|
| 1 | Auth | `src/modules/auth/` | ✅ Working (register, login, guest, refresh) |
| 2 | Users | `src/modules/users/` | ✅ Entity + basic service |
| 3 | Profile | `src/modules/profile/` | ✅ Skeleton (Week 3) |
| 4 | Venues | `src/modules/venues/` | ✅ Entity + findAll/findById |
| 5 | Busyness | `src/modules/busyness/` | ✅ Entity + findByVenueId |
| 6 | Vibes | `src/modules/vibes/` | ✅ Entity + findByVenueId |
| 7 | Offers | `src/modules/offers/` | ✅ Offer + Redemption entities |
| 8 | Notifications | `src/modules/notifications/` | ✅ Entity + findByUserId |
| 9 | Tags | `src/modules/tags/` | ✅ Working (findAll, search) |
| 10 | Business | `src/modules/business/` | ✅ BusinessUser + VenueAnalytics entities |
| 11 | Admin | `src/modules/admin/` | ✅ Working (GET /admin/stats) |
| 12 | Audit | `src/modules/audit/` | ✅ ActivityLog entity + log/findAll |

**12 Database Entities (PostgreSQL tables):**
User, RefreshToken, Venue, Busyness, Vibe, Offer, Redemption, Notification, Tag, BusinessUser, VenueAnalytics, ActivityLog

**10 Enums:**
Role, AuthProvider, BusynessLevel, VenueCategory, TagCategory, OfferType, OfferStatus, RedemptionStatus, NotificationType, BusinessRole, ErrorCode

**Common Utilities:**
- RolesGuard, HttpExceptionFilter, ResponseInterceptor, ValidationPipe
- @Roles() decorator, @CurrentUser() decorator
- generateVoucherCode(), generateTransactionId()

**Config:**
- App config (port, JWT secrets, Manchester defaults)
- Database config (PostgreSQL connection)
- .env + .env.example
- Dockerfile, .gitignore

**Working API Endpoints (Week 1):**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config/app` | App configuration |
| GET | `/health` | Health check |
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/guest` | Guest anonymous login |
| POST | `/auth/refresh-token` | Refresh JWT tokens |
| GET | `/tags` | Get all vibe + music tags |
| GET | `/tags/search?q=` | Search tags |
| GET | `/admin/stats` | Platform stats (admin only) |

---

## Week 1 Deliverables Summary
1. ✅ Complete database schema — 12 entities finalized with TypeORM decorators
2. ✅ API route list — all endpoints documented in controllers (25+ planned routes)
3. ✅ Auth architecture — JWT + Passport (Local + JWT strategies), bcrypt, refresh tokens
4. ✅ Project folder structure — 12 NestJS modules with dto/, entities/, controller, service, module
5. ✅ Tech stack — NestJS + TypeScript + PostgreSQL + TypeORM
6. ✅ Manchester city configuration — lat: 53.4808, lng: -2.2426, default city
7. ✅ Error handling & response format — HttpExceptionFilter + ResponseInterceptor + 20+ ErrorCodes
8. ✅ Role-based access control (RBAC) — User, Business, Admin with RolesGuard + JwtAuthGuard
