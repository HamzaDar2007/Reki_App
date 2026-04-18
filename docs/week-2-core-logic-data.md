# Week 2 – Core App Logic & Data Layer

> **Status: ✅ COMPLETE** — Build passing, seed module ready, core logic implemented
> **New Files:** seed.service.ts, seed.module.ts | **Updated:** 8 services, 2 controllers, 3 entities
> **Build:** `npx nest build` → Clean (no errors)

## Goal
Venue data structure implement karna, busyness/vibe/offer ka core logic banana, aur Manchester ke mock data setup karna.

---

## Screens ka Backend Mapping

### Screen 1: Splash / App Intro Screen
**Backend kaam:**
- ✅ `GET /config/app` API — already working from Week 1 → `src/app.service.ts`
- ✅ `GET /health` API — already working from Week 1 → `src/app.service.ts`

### Screen 2: Login / Signup Screen
**Backend kaam:** ❌ Week 2 mein nahi — Week 3 mein hoga
- ✅ User model/schema already in database (from Week 1)
- ✅ Demo user seeded: `demo@reki.app` / `demo1234` → `src/seed/seed.service.ts`

### Screen 3: Preferences Screen (Onboarding)
**Backend kaam:**
- ✅ Tags master data seeded (database mein) → `src/seed/seed.service.ts` → `seedTags()`
  - 14 vibe tags + 6 music tags inserted into `tags` table
- ✅ `GET /tags/vibes` — returns only vibe tags → `src/modules/tags/tags.controller.ts`
- ✅ `GET /tags/music` — returns only music tags → `src/modules/tags/tags.controller.ts`
- ✅ Tags search: `GET /tags/search?q=chi` → returns "Chill" (already from Week 1)
  ```
  Vibes: [Chill, Party, Romantic, High Energy, Intimate, Industrial, Rooftop, Underground, Late Night, Hidden Entrance, Date Night, Beer Garden, Packed, Live Music]
  Music: [House, R&B, Indie, Lo-fi, Techno, Vinyl]
  ```
- `GET /tags/vibes` — sabhi vibe tags return kare
- `GET /tags/music` — sabhi music tags return kare
- Tags search logic: `GET /tags?search=chi` → returns "Chill"

### Screen 4: Home / City Feed Screen
**Backend kaam (CORE):**
- ✅ **Venue schema** already in database (from Week 1)
- ✅ **Busyness schema** already in database (from Week 1)
- ✅ **15 Manchester venues seeded** → `src/seed/seed-data.ts` → `MANCHESTER_VENUES[]`
  - Albert's Schloss, Warehouse Project, 20 Stories, The Alchemist, Albert Hall,
    YES Manchester, Diecast, Refuge, Cloud 23, Night & Day Café,
    Science & Industry, Gorilla, The Ivy, Peveril of the Peak, Electrik
- ✅ **Busyness state seeded** for all 15 venues → `VENUE_BUSYNESS[]`
- ✅ **Busyness state logic** → `src/modules/busyness/busyness.service.ts`
  - `updateLevel()` — auto-calculates percentage from level
  - `getAtmosphereFromPercentage()` — Quiet ≤33%, Lively 34-66%, Packed ≥67%
  - `matchesAtmosphere()` — filter helper
- ✅ **isLive logic** → `src/modules/venues/venues.service.ts` → `isVenueLive()`
  - Checks current time vs openingHours/closingTime (handles overnight venues)
- ✅ **Venue list API** → `GET /venues?city=&category=&atmosphere=&vibe=&priceLevel=`
  - Full QueryBuilder with joins on busyness + vibe tables
  - Returns `{ venues, count, city }`
- ✅ Categories: All Venues, Bar, Club, Restaurant, Lounge, Live Music Venue, Pub, Rooftop Bar, Cocktail Bar

### Screen 5: Venue List Filter Screen
**Backend kaam:**
- ✅ **Filter logic** implemented in `VenuesService.findAll()` → `src/modules/venues/venues.service.ts`
  - `atmosphere` → QueryBuilder: busyness.percentage ranges
  - `vibe` → PostgreSQL array overlap: `vibe.tags && :vibes`
  - `priceLevel` → exact match on `venue.priceLevel`
- ✅ Atmosphere mapping in QueryBuilder:
  - Quiet → `busyness.percentage <= 33`
  - Lively → `busyness.percentage >= 34 AND <= 66`
  - Packed → `busyness.percentage >= 67`
- ✅ Venue count: response includes `count` field

### Screen 6: Venue Detail Screen
**Backend kaam (CORE):**
- ✅ **Vibe schema** already in database (from Week 1)
- ✅ **Vibe data seeded** for all 15 venues → `VENUE_VIBES[]` with tags, musicGenre, description, vibeCheckScore
- ✅ **Vibe scheduling logic** → `src/modules/vibes/vibes.service.ts` → `getScheduledVibe(hour)`
  - 6PM-8PM → Chill, Intimate (Lo-fi, Vinyl)
  - 8PM-10PM → Live Music, Party (Indie, R&B)
  - 10PM-2AM → High Energy, Packed, Late Night (House, Techno)
  - Daytime → Chill (Lo-fi)
- ✅ **Vibe update logic** → `updateVibe(venueId, tags, musicGenre, updatedBy)` — replaces current values
- ✅ **Rating system**: venue.rating set in seed data (4.3-4.9 range)
- ✅ **Venue detail API** → `GET /venues/:id` — includes busyness, vibe, offers relations + isLive
- ✅ **Social proof**: mock data in seed (vibeCheckScore + responseCount per venue)

### Screen 7: Manchester Map View Screen
**Backend kaam:**
- ✅ **Venue coordinates** seeded for all 15 venues with real Manchester lat/lng → `MANCHESTER_VENUES[]`
- ✅ **Map markers endpoint** → `GET /venues/map-markers?city=manchester` → `src/modules/venues/venues.controller.ts`
  - Returns: `[{ venueId, name, lat, lng, busynessLevel, busynessPercentage, vibeLabel, category, isLive }]`
- ✅ **Trending endpoint** → `GET /venues/trending?city=manchester` → `src/modules/venues/venues.controller.ts`
  - Top 5 venues ordered by `busyness.percentage DESC`

### Screen 8: Offer Details Screen
**Backend kaam (CORE):**
- ✅ **Offer schema** already in database (from Week 1)
- ✅ **5 Mock offers seeded** → `MOCK_OFFERS[]` in `src/seed/seed-data.ts`
  - Albert's Schloss → Happy Hour 2-for-1 (Mon-Fri, 5pm-7pm)
  - The Alchemist → Buy 1 Get 1 Free Cocktails (Daily, 12pm-11pm)
  - 20 Stories → Complimentary Signature Cocktail (Fri-Sat, 8pm-10pm)
  - Warehouse Project → Guestlist Open Now (Fri-Sat, 10pm-2am)
  - Albert Hall → Student Night Discount (Wed, 7pm-3am)
- ✅ **Offer availability logic** → `src/modules/offers/offers.service.ts` → `isOfferAvailableNow()`
  - Rule 1: `isActive` must be true
  - Rule 2: Current day in `validDays` array
  - Rule 3: Current time between `validTimeStart` and `validTimeEnd` (handles overnight)
  - Rule 4: `redemptionCount < maxRedemptions`
  - Rule 5: Current date < `expiresAt`
- ✅ **Claim offer** → `claimOffer(offerId, userId, venueId)` → generates voucherCode + transactionId
- ✅ **Voucher code format**: `"RK-{3digits}-{2chars}"` → already from Week 1 generator

### Screen 9: Offer Redeemed Confirmation Screen
**Backend kaam:**
- ✅ **Redemption schema** already in database (from Week 1)
- ✅ **Redeem offer** → `redeemOffer(redemptionId, savingValue)` → `src/modules/offers/offers.service.ts`
  - Sets status = REDEEMED, redeemedAt = now, savingValue
  - Increments offer's `redemptionCount`
- ✅ **Transaction ID format**: `"#REKI-{4digits}-MNCH"` — already from Week 1 generator
- ✅ **Saving calculation** → `calculateSaving(offer)` → returns offer.savingValue

### Screen 10: Notifications Screen
**Backend kaam:**
- ✅ **Notification schema** already in database (from Week 1)
- ✅ **8 Mock notifications seeded** → `MOCK_NOTIFICATIONS[]` in `src/seed/seed-data.ts`
  - All 7 notification types covered: WELCOME, VIBE_ALERT, LIVE_PERFORMANCE, OFFER_CONFIRMATION, SOCIAL_CHECKIN, WEEKLY_RECAP, TICKET_SECURED
- ✅ **Time grouping logic** → `findGroupedByUserId()` → `src/modules/notifications/notifications.service.ts`
  - Returns: `{ today: [], yesterday: [], earlier: [] }`
- ✅ **Mark as read** → `markAsRead(id)` + `markAllAsRead(userId)`

### Screen 11: Business Login Screen
**Backend kaam:** ❌ Week 2 mein nahi — Week 4 mein hoga
- ✅ BusinessUser schema already in database (from Week 1)

### Screen 12: Venue Dashboard Screen
**Backend kaam:**
- ✅ **VenueAnalytics schema** already in database (from Week 1)
- ✅ **5 Mock analytics records seeded** → `MOCK_ANALYTICS[]` in `src/seed/seed-data.ts`
  - Albert's Schloss → 88% busyness, 54m dwell, 4.8 vibe, 128 shares
  - Warehouse Project → 92% busyness, 120m dwell, 4.9 vibe, 245 shares
  - 20 Stories, The Alchemist, Albert Hall also seeded
- ✅ **Dashboard API** → `getDashboard(venueId)` → `src/modules/business/business.service.ts`
- ✅ **Busyness change calculation** → `calculateBusynessChange(venueId, currentPercent)`
  - Compares today vs yesterday analytics → returns ↑/↓/→ with percentage

### Screen 13: Update Busyness & Vibe Screen
**Backend kaam:**
- ✅ **Busyness update logic** → `updateLevel(venueId, level, updatedBy)` → `src/modules/busyness/busyness.service.ts`
  - Auto-sets percentage: quiet=25%, moderate=50%, busy=85%
  - Sets lastUpdated = now, updatedBy = businessUserId
- ✅ **Vibe update logic** → `updateVibe(venueId, tags, musicGenre, updatedBy)` → `src/modules/vibes/vibes.service.ts`
  - Replaces current vibe tags
  - Sets lastUpdated = now

### Screen 14: Create / Manage Offers Screen
**Backend kaam:**
- ✅ **Offer status logic** → `getOfferStatus(offer)` → `src/modules/offers/offers.service.ts`
  - active: isActive=true AND available now
  - inactive: isActive=false (toggled off)
  - expired: expiresAt < now OR maxRedemptions reached
  - upcoming: valid day but validTimeStart > current time
- ✅ **Redemption count tracking**: `redeemOffer()` auto-increments `redemptionCount`
- ✅ **Available offers**: `findAvailableByVenueId()` filters using all 5 availability rules

### Screen 15: Loading Screen
**Backend kaam:**
- ✅ Seed data auto-loads on first app start via `OnModuleInit`
- ✅ **Database indexes** added for fast queries:
  - Venue: `IDX_venue_city`, `IDX_venue_category`, `IDX_venue_price`, `IDX_venue_city_category`
  - Busyness: `IDX_busyness_venueId`
  - Offer: `IDX_offer_venueId`, `IDX_offer_isActive`, `IDX_offer_venueId_isActive`

### Screen 16: Error / Empty State Screen
**Backend kaam:**
- ✅ **Error response format** already implemented from Week 1 → `HttpExceptionFilter`
- ✅ **ErrorCode enum** with 20+ codes → `src/common/enums/error-codes.enum.ts`
- ✅ Venue not found throws `NotFoundException` with `VENUE_NOT_FOUND` code

---

## Admin — Week 2
**Backend kaam:**
- ✅ Admin seed user created: `admin@reki.app` / `admin123` (role=ADMIN) → `src/seed/seed.service.ts`
- ✅ ActivityLog schema already in database (from Week 1) → `src/modules/audit/entities/activity-log.entity.ts`

---

## Week 2 Implementation Summary

### New Files Created
| File | Purpose |
|------|---------|
| `src/seed/seed.service.ts` | Auto-seed runner (OnModuleInit) — seeds all 8 data types |
| `src/seed/seed.module.ts` | Wires SeedService with all entity repositories |

### Updated Files
| File | Changes |
|------|---------|
| `src/seed/seed-data.ts` | 15 venues, busyness, vibes, 5 offers, 8 notifications, 5 analytics records |
| `src/modules/venues/venues.service.ts` | findAll with QueryBuilder filters, isVenueLive, getMapMarkers, getTrending |
| `src/modules/venues/venues.controller.ts` | GET /venues (filters), /venues/:id, /venues/trending, /venues/map-markers, POST /venues/:id/view |
| `src/modules/venues/venues.module.ts` | Added BusynessModule import |
| `src/modules/busyness/busyness.service.ts` | updateLevel, getAtmosphereFromPercentage, matchesAtmosphere |
| `src/modules/vibes/vibes.service.ts` | updateVibe, getScheduledVibe (time-based) |
| `src/modules/offers/offers.service.ts` | isOfferAvailableNow (5 rules), getOfferStatus, claimOffer, redeemOffer, calculateSaving |
| `src/modules/notifications/notifications.service.ts` | findGroupedByUserId (Today/Yesterday/Earlier), markAsRead, markAllAsRead |
| `src/modules/business/business.service.ts` | getAnalytics, getDashboard, calculateBusynessChange |
| `src/modules/tags/tags.controller.ts` | GET /tags/vibes, GET /tags/music |
| `src/modules/venues/entities/venue.entity.ts` | Added 4 database indexes |
| `src/modules/busyness/entities/busyness.entity.ts` | Added 1 database index |
| `src/modules/offers/entities/offer.entity.ts` | Added 3 database indexes |
| `src/app.module.ts` | Added SeedModule import |

### Working API Endpoints (Week 2 — NEW)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/venues` | List venues with filters (city, category, atmosphere, vibe, priceLevel) |
| GET | `/venues/:id` | Venue detail with busyness + vibe + offers |
| GET | `/venues/trending` | Top 5 by busyness |
| GET | `/venues/map-markers` | Map marker data for all venues |
| POST | `/venues/:id/view` | Track venue view |
| GET | `/tags/vibes` | Vibe tags only |
| GET | `/tags/music` | Music tags only |

### Seed Data Summary
| Data | Count |
|------|-------|
| Manchester Venues | 15 |
| Busyness Records | 15 |
| Vibe Records | 15 |
| Offers | 5 |
| Notifications | 8 |
| Analytics Records | 5 |
| Vibe Tags | 14 |
| Music Tags | 6 |
| Admin User | 1 (admin@reki.app) |
| Demo User | 1 (demo@reki.app) |

---

## Week 2 Deliverables Summary
1. ✅ All database schemas created — already done in Week 1, now with 8 database indexes added
2. ✅ Manchester mock data seeded — 15 venues + busyness + vibes + 5 offers + 8 notifications + analytics
3. ✅ Busyness state logic — updateLevel auto-calculates %, atmosphere mapping, filter matching
4. ✅ Vibe scheduling logic — time-based (6PM-8PM/8PM-10PM/10PM-2AM), updateVibe replaces tags
5. ✅ Offer rules & availability logic — 5-rule check (isActive + day + time + maxRedemptions + expiry)
6. ✅ Tags master data — 14 vibes + 6 music seeded, GET /tags/vibes + GET /tags/music routes
7. ✅ Voucher code + Transaction ID generation — already from Week 1
8. ✅ Error response format — already from Week 1, VENUE_NOT_FOUND thrown in controller
9. ✅ Database indexes — 8 indexes across Venue (4), Busyness (1), Offer (3)
10. ✅ `GET /config/app` and `GET /health` — already working from Week 1
