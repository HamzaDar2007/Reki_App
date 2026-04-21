# REKI — Database Schema Documentation

> **Database:** PostgreSQL 18
> **ORM:** TypeORM with `synchronize: true` (dev mode)
> **Total Tables:** 17

---

## Entity Relationship Diagram

```
User (1) ─────── (N) Notification
User (1) ─────── (N) Redemption
User (1) ─────── (N) RefreshToken
User (1) ─────── (N) Device
User (1) ─────── (1) NotificationPreference
User (1) ─────── (N) GeofenceLog
User (1) ─────── (N) SyncAction

Venue (1) ─────── (1) Busyness
Venue (1) ─────── (1) Vibe
Venue (1) ─────── (N) Offer
Venue (1) ─────── (N) VenueAnalytics
Venue (1) ─────── (N) BusinessUser
Venue (1) ─────── (N) Redemption

Offer (1) ─────── (N) Redemption

Tag (standalone)
ActivityLog (standalone)
AreaAnalytics (standalone, aggregated per area/hour)
```

---

## Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | |
| email | VARCHAR | UNIQUE, nullable | Nullable for guest users |
| phone | VARCHAR | nullable | |
| name | VARCHAR | NOT NULL | |
| password | VARCHAR | nullable | Hashed (bcrypt). Nullable for OAuth/guest |
| authProvider | ENUM | NOT NULL | email, apple, google, guest |
| role | ENUM | NOT NULL, default: user | user, business, admin, guest |
| isVerified | BOOLEAN | default: false | Email verification status |
| isActive | BOOLEAN | default: true | Account active flag |
| preferences | JSONB | nullable | `{ vibes: string[], music: string[] }` |
| savedVenues | TEXT[] | default: [] | Array of venue UUIDs |
| currentLat | DECIMAL(10,7) | nullable | Last known GPS latitude (Week 8) |
| currentLng | DECIMAL(10,7) | nullable | Last known GPS longitude (Week 8) |
| locationUpdatedAt | TIMESTAMP | nullable | When location was last reported |
| locationEnabled | BOOLEAN | default: false | Foreground location consent |
| backgroundLocationEnabled | BOOLEAN | default: false | Background location consent (geofencing) |
| appState | JSONB | nullable | Cross-device state backup (Week 10) |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |

---

## Table: `refresh_tokens`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| token | VARCHAR | UNIQUE | Refresh token string |
| userId | UUID | FK → users.id | |
| isRevoked | BOOLEAN | default: false | Token rotation revocation |
| expiresAt | TIMESTAMP | NOT NULL | 7-day expiry |
| createdAt | TIMESTAMP | auto | |

---

## Table: `venues`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR | NOT NULL | |
| address | VARCHAR | NOT NULL | |
| city | VARCHAR | default: Manchester | |
| area | VARCHAR | nullable | Neighborhood (e.g., Northern Quarter) |
| category | ENUM | NOT NULL | bar, club, restaurant, lounge, etc. |
| lat | DECIMAL(10,7) | NOT NULL | Latitude |
| lng | DECIMAL(10,7) | NOT NULL | Longitude |
| images | TEXT[] | default: [] | Image filenames |
| priceLevel | INT | default: 2 | 1 (£) to 4 (££££) |
| openingHours | VARCHAR | nullable | e.g., "12:00" |
| closingTime | VARCHAR | nullable | e.g., "02:00" (overnight) |
| isLive | BOOLEAN | default: false | |
| tags | TEXT[] | default: [] | Quick-reference tags |
| rating | DECIMAL(2,1) | default: 4.0 | 0.0 - 5.0 |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |

**Indexes:** `IDX_venue_city`, `IDX_venue_category`, `IDX_venue_price`, `IDX_venue_city_category`

---

## Table: `busyness`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| venueId | UUID | FK → venues.id, OneToOne | |
| level | ENUM | NOT NULL | quiet, moderate, busy |
| percentage | INT | default: 25 | 0-100 |
| updatedBy | VARCHAR | nullable | User/system that last updated |
| dwellTime | INT | default: 0 | Average dwell time (minutes) |
| lastUpdated | TIMESTAMP | auto | |

**Index:** `IDX_busyness_venueId`

---

## Table: `vibes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| venueId | UUID | FK → venues.id, OneToOne | |
| tags | TEXT[] | default: [] | Current vibe tags |
| musicGenre | TEXT[] | default: [] | Current music genres |
| description | VARCHAR | nullable | Vibe description |
| vibeCheckScore | DECIMAL(2,1) | default: 0 | User satisfaction (0-5) |
| responseCount | INT | default: 0 | Number of vibe checks |
| updatedBy | VARCHAR | nullable | |
| lastUpdated | TIMESTAMP | auto | |

---

## Table: `offers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| venueId | UUID | FK → venues.id | |
| title | VARCHAR | NOT NULL | |
| description | TEXT | nullable | |
| type | ENUM | NOT NULL | 2-for-1, discount, freebie, guestlist, happy-hour |
| validDays | TEXT[] | NOT NULL | e.g., ['Mon', 'Tue', 'Fri'] |
| validTimeStart | VARCHAR | NOT NULL | e.g., "17:00" |
| validTimeEnd | VARCHAR | NOT NULL | e.g., "19:00" |
| isActive | BOOLEAN | default: true | |
| redemptionCount | INT | default: 0 | Current claim count |
| maxRedemptions | INT | default: 100 | |
| savingValue | DECIMAL(8,2) | nullable | £ value saved |
| expiresAt | TIMESTAMP | nullable | |
| createdAt | TIMESTAMP | auto | |

**Indexes:** `IDX_offer_venueId`, `IDX_offer_isActive`, `IDX_offer_venueId_isActive`

---

## Table: `redemptions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| offerId | UUID | FK → offers.id | |
| userId | UUID | FK → users.id | |
| venueId | UUID | FK → venues.id | |
| voucherCode | VARCHAR | UNIQUE | Format: "RK-XXX-XX" |
| qrCodeData | VARCHAR | | JSON string for QR generation |
| status | ENUM | NOT NULL | active, redeemed, expired |
| transactionId | VARCHAR | | Format: "#REKI-XXXX-MNCH" |
| savingValue | DECIMAL(8,2) | default: 0 | |
| currency | VARCHAR | default: GBP | |
| redeemedAt | TIMESTAMP | nullable | Set when redeemed |
| createdAt | TIMESTAMP | auto | |

---

## Table: `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| userId | UUID | FK → users.id | |
| type | ENUM | NOT NULL | vibe_alert, live_performance, social_checkin, offer_confirmation, welcome, weekly_recap, ticket_secured |
| title | VARCHAR | NOT NULL | |
| message | TEXT | NOT NULL | |
| icon | VARCHAR | nullable | Emoji or icon name |
| venueId | UUID | nullable | Related venue |
| offerId | UUID | nullable | Related offer |
| isRead | BOOLEAN | default: false | |
| createdAt | TIMESTAMP | auto | |

---

## Table: `tags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR | NOT NULL | Tag display name |
| category | ENUM | NOT NULL | vibe, music |
| isActive | BOOLEAN | default: true | |
| createdAt | TIMESTAMP | auto | |

---

## Table: `business_users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR | UNIQUE, NOT NULL | |
| name | VARCHAR | NOT NULL | |
| password | VARCHAR | NOT NULL | Hashed (bcrypt) |
| venueId | UUID | FK → venues.id | |
| role | ENUM | NOT NULL | owner, manager, staff |
| phone | VARCHAR | nullable | |
| isApproved | BOOLEAN | default: false | Admin approval status |
| isActive | BOOLEAN | default: true | |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |

---

## Table: `venue_analytics`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| venueId | UUID | FK → venues.id | |
| date | DATE | NOT NULL | Analytics date |
| liveBusynessPercent | INT | default: 0 | |
| busynessChange | VARCHAR | nullable | e.g., "↑12%" |
| avgDwellTime | INT | default: 0 | Minutes |
| dwellTimeChange | VARCHAR | nullable | |
| vibeCheckScore | DECIMAL(2,1) | default: 0 | |
| vibeCheckResponses | INT | default: 0 | |
| socialShares | INT | default: 0 | |
| socialSharesChange | VARCHAR | nullable | |
| totalViews | INT | default: 0 | |
| totalSaves | INT | default: 0 | |
| offerClicks | INT | default: 0 | |
| redemptions | INT | default: 0 | |
| createdAt | TIMESTAMP | auto | |

---

## Table: `activity_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| actorId | VARCHAR | NOT NULL | User/business UUID |
| actorRole | VARCHAR | NOT NULL | user, business, admin |
| action | VARCHAR | NOT NULL | e.g., STATUS_UPDATE, OFFER_CREATED |
| target | VARCHAR | NOT NULL | e.g., venue, offer, user |
| targetId | VARCHAR | nullable | Target entity UUID |
| details | JSONB | nullable | Additional context |
| createdAt | TIMESTAMP | auto | |

---

## Table: `devices` (Week 9 — Push Notifications)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| userId | UUID | FK → users, ON DELETE CASCADE | |
| fcmToken | VARCHAR | UNIQUE, indexed | Firebase Cloud Messaging token |
| platform | ENUM | default: ios | ios, android, web |
| deviceId | VARCHAR | NOT NULL | Client-generated device identifier |
| appVersion | VARCHAR | nullable | |
| isActive | BOOLEAN | default: true | Set false when FCM reports invalid token |
| lastActiveAt | TIMESTAMP | nullable | For stale device cleanup |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |

**Indexes:** `IDX_device_userId`, `IDX_device_fcmToken` (unique)

---

## Table: `notification_preferences` (Week 9)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| userId | UUID | UNIQUE, FK → users, ON DELETE CASCADE | 1:1 with user |
| vibeAlerts | BOOLEAN | default: true | Venue busyness alerts |
| livePerformance | BOOLEAN | default: true | Live music/DJ events |
| socialCheckins | BOOLEAN | default: true | Friend check-in alerts |
| offerAlerts | BOOLEAN | default: true | New offers from saved venues |
| weeklyRecap | BOOLEAN | default: true | Weekly summary |
| proximityAlerts | BOOLEAN | default: true | Geofence-triggered offers |
| quietHoursStart | VARCHAR | nullable | e.g., "22:00" |
| quietHoursEnd | VARCHAR | nullable | e.g., "08:00" |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |

---

## Table: `geofence_logs` (Week 8 — Proximity Alerts)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| userId | UUID | NOT NULL | |
| venueId | UUID | NOT NULL | |
| distance | DECIMAL(10,2) | NOT NULL | Meters at time of notification |
| offerId | UUID | nullable | If triggered by an offer |
| notifiedAt | TIMESTAMP | NOT NULL | Used for dedupe (4-hour cooldown per venue) |
| createdAt | TIMESTAMP | auto | |

**Indexes:** `IDX_geofence_user_venue`, `IDX_geofence_user_notified`

---

## Table: `area_analytics` (Week 8 — Popular Neighborhoods)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| areaName | VARCHAR | NOT NULL | e.g., "Northern Quarter" |
| city | VARCHAR | default: Manchester | |
| activeVenues | INT | default: 0 | Venues live in this area |
| totalUsers | INT | default: 0 | Users currently present |
| avgBusyness | INT | default: 0 | 0-100 average across area venues |
| date | VARCHAR | NOT NULL | YYYY-MM-DD bucket |
| hour | INT | default: 0 | 0-23 hour bucket |
| createdAt | TIMESTAMP | auto | |

**Indexes:** `IDX_area_city_date`

---

## Table: `sync_actions` (Week 10 — Offline Queue)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| clientActionId | VARCHAR | NOT NULL | Idempotency key from client |
| deviceId | VARCHAR | NOT NULL, indexed | |
| userId | UUID | NOT NULL, indexed | |
| type | ENUM | NOT NULL | BUSYNESS_UPDATE, VIBE_UPDATE, OFFER_TOGGLE, NOTIFICATION_READ, VENUE_SAVE, VENUE_VIEW |
| status | ENUM | default: pending, indexed | pending, success, conflict, rejected |
| data | JSONB | nullable | Raw offline payload |
| venueId | UUID | nullable | Target venue |
| notificationId | UUID | nullable | Target notification |
| offerId | UUID | nullable | Target offer |
| offlineTimestamp | TIMESTAMP | NOT NULL | When user performed action offline |
| conflictMessage | VARCHAR | nullable | Human-readable conflict reason |
| serverData | JSONB | nullable | Current server state (for conflict UI) |
| conflictOptions | TEXT[] | nullable | e.g., ["keep_server", "override_with_mine"] |
| syncedAt | TIMESTAMP | auto | When server received/processed |

**Indexes:** `IDX_sync_deviceId`, `IDX_sync_userId`, `IDX_sync_status`

---

## Enums

| Enum | Values |
|------|--------|
| Role | user, business, admin, guest |
| AuthProvider | email, apple, google, guest |
| BusinessRole | owner, manager, staff |
| BusynessLevel | quiet, moderate, busy |
| VenueCategory | bar, club, restaurant, lounge, live_music_venue, pub, rooftop_bar, cocktail_bar |
| TagCategory | vibe, music |
| OfferType | 2-for-1, discount, freebie, guestlist, happy-hour |
| OfferStatus | active, inactive, expired, upcoming |
| RedemptionStatus | active, redeemed, expired |
| NotificationType | vibe_alert, live_performance, social_checkin, offer_confirmation, welcome, weekly_recap, ticket_secured, proximity_offer |
| DevicePlatform | ios, android, web |
| SyncActionType | BUSYNESS_UPDATE, VIBE_UPDATE, OFFER_TOGGLE, NOTIFICATION_READ, VENUE_SAVE, VENUE_VIEW |
| SyncActionStatus | pending, success, conflict, rejected |
| ErrorCode | 27 error codes (see `src/common/enums/error-codes.enum.ts`) |
