# Week 10 – Offline Support & Data Persistence (Phase 2)

> ⚠️ **Note**: Phase 2 ki screens abhi client ne provide nahi ki hain. Yeh doc sirf backend tasks cover karta hai jo document.md mein defined hain. Jab Phase 2 screens milengi, tab screen-level mapping add hoga.

## Goal
App ko poor/zero network conditions mein reliable aur functional banana. Local caching, sync queue, conflict resolution, aur state persistence implement karna.

**Priority**: High

---

## 1. Local Database Layer (Backend Cache Support)

### Cache Headers — All Endpoints
```
Backend har response mein cache headers bhejega:

Endpoint                           Cache Duration    Reason
────────────────────────────────────────────────────────────────
GET /config/app                    1 hour            Rarely changes
GET /tags                          24 hours          Almost never changes
GET /users/preferences             24 hours          User changes rarely
GET /venues (list)                 5 minutes         Busyness changes often
GET /venues/:id (detail)           2 minutes         Busyness changes fast
GET /venues/map-markers            2 minutes         Busyness colors change
GET /venues/trending               5 minutes         Trending recalculates
GET /venues/filter-options         24 hours          Filters rarely change
GET /offers/:id                    5 minutes         Offer validity changes
GET /notifications                 1 minute          New notifications arrive
GET /business/dashboard            1 minute          Live stats
GET /users/redemptions             1 hour            Historical data
GET /admin/* (all admin)           No cache          Admin always needs fresh
```

### HTTP Headers Implementation
```
Response Headers:
  Cache-Control: max-age=300          ← client can cache for X seconds
  ETag: "resource-version-hash"       ← unique version identifier
  Last-Modified: Wed, 24 Oct 2024 22:00:00 GMT
  X-Data-Freshness: "live"            ← custom: live / cached / stale
```

### Conditional Requests (304 Not Modified)
```
Client sends: If-None-Match: "abc123"
Server checks: has resource changed since this ETag?
  → NO change:  304 Not Modified (no body, saves bandwidth)
  → YES change: 200 + new data + new ETag
```

### Timestamp-Based Invalidation
```
Backend tracks lastModified per resource type
Client stores lastFetched timestamp locally
On reconnect → only fetch what changed (delta sync)
```

---

## 2. Delta Sync Endpoint

### Sync Changed Data — `GET /venues/sync?since=TIMESTAMP`
```json
Request: GET /venues/sync?since=2024-10-24T22:00:00Z

Response: {
  "updated": [
    { "id": "v1", "name": "Albert's Schloss", "busyness": {...}, ... }
  ],
  "deleted": ["v15"],
  "lastSync": "2024-10-24T22:05:00Z"
}
```
- Only returns venues that changed since `since` timestamp
- Includes deleted venue IDs (so client can remove from cache)
- Minimizes data transfer on reconnect

### Other Sync Endpoints
```
GET /notifications/sync?since=TIMESTAMP → only new/updated notifications
GET /offers/sync?since=TIMESTAMP → only changed offers
```

---

## 3. Offline-First Architecture — Sync Queue

### Submit Offline Actions — `POST /sync/queue`
```json
Request: {
  "deviceId": "d1",
  "actions": [
    {
      "id": "local-uuid-1",
      "type": "BUSYNESS_UPDATE",
      "venueId": "v1",
      "data": { "busyness": "busy", "vibes": ["high-energy"] },
      "offlineTimestamp": "2024-10-24T22:05:00Z"
    },
    {
      "id": "local-uuid-2",
      "type": "NOTIFICATION_READ",
      "notificationId": "n1",
      "offlineTimestamp": "2024-10-24T22:06:00Z"
    },
    {
      "id": "local-uuid-3",
      "type": "VENUE_SAVE",
      "venueId": "v3",
      "offlineTimestamp": "2024-10-24T22:07:00Z"
    }
  ]
}

Response: {
  "results": [
    { "id": "local-uuid-1", "status": "conflict", "message": "Venue updated by another team member at 10:08 PM", "serverData": {...} },
    { "id": "local-uuid-2", "status": "success" },
    { "id": "local-uuid-3", "status": "success" }
  ],
  "syncedAt": "2024-10-24T22:10:00Z"
}
```

### Check Sync Status — `GET /sync/status?deviceId=d1`
```json
Response: {
  "pendingActions": 0,
  "lastSyncAt": "2024-10-24T22:10:00Z",
  "conflicts": []
}
```

### Supported Offline Actions
```
✅ BUSYNESS_UPDATE     — business updates venue busyness
✅ VIBE_UPDATE         — business updates venue vibe tags
✅ OFFER_TOGGLE        — business toggles offer on/off
✅ NOTIFICATION_READ   — user marks notification as read
✅ VENUE_SAVE          — user saves/unsaves a venue
✅ VENUE_VIEW          — user viewed a venue (analytics tracking)

❌ AUTH (login/register) — requires network (server validation)
❌ OFFER_CREATE         — requires server-side validation
❌ OFFER_REDEEM         — requires real-time server verification
❌ PAYMENT              — requires network (future Phase 3)
```

---

## 4. Conflict Resolution Strategy

### Simple Actions (No Conflicts Possible)
```
NOTIFICATION_READ → always accept (idempotent)
VENUE_SAVE        → always accept (toggle, latest wins)
VENUE_VIEW        → always accept (analytics, additive)
```

### Business Actions (Conflicts Possible)
```
BUSYNESS_UPDATE / VIBE_UPDATE:

Strategy: LAST-WRITE-WINS with user confirmation

1. Client sends offline update with offlineTimestamp
2. Server compares: offlineTimestamp vs server.lastUpdated

Case A: Offline timestamp NEWER than server → ACCEPT update
Case B: Offline timestamp OLDER than server → CONFLICT

Conflict response:
{
  "id": "local-uuid-1",
  "status": "conflict",
  "message": "Status was already updated by another team member at 10:08 PM.",
  "serverData": {
    "busyness": "busy",
    "vibes": ["high-energy", "packed"],
    "updatedBy": "Manager Mike",
    "updatedAt": "2024-10-24T22:08:00Z"
  },
  "options": ["keep_server", "override_with_mine"]
}

Client shows UI: "Keep Current" or "Override"
If override → PUT /business/venues/:id/status (normal update with force flag)
```

### Offer Toggle (Edge Case)
```
If offer was deleted/expired on server while user was offline:
→ REJECT with: { "status": "rejected", "reason": "Offer no longer exists or has expired" }

Otherwise → ACCEPT, toggle to requested state
```

---

## 5. State Persistence

### User State Backup — `PUT /users/state`
```json
Request: {
  "preferences": { "vibes": ["chill", "party"], "music": ["house"] },
  "savedVenues": ["v1", "v3", "v7"],
  "lastFilters": { "atmosphere": "lively", "vibes": ["underground"], "price": 2 },
  "notificationPreferences": { "vibeAlerts": true, "quietHoursStart": "02:00" },
  "lastSyncAt": "2024-10-24T22:10:00Z"
}
```

### User State Restore — `GET /users/state`
```json
Response: {
  "preferences": { "vibes": [...], "music": [...] },
  "savedVenues": ["v1", "v3", "v7"],
  "lastFilters": { "atmosphere": "lively", "vibes": [...], "price": 2 },
  "notificationPreferences": {...},
  "lastSyncAt": "2024-10-24T22:10:00Z"
}
```

### What Persists Across App Restarts
```
Client-side (via state API backup):
1. User authentication tokens (secure keychain)
2. User preferences (vibes, music)
3. Notification preferences
4. Saved venues list
5. Active filter selections
6. Last known location
7. Cached venue data (with timestamps)
8. Cached notifications
9. Pending sync queue (offline actions)
10. Business dashboard last state
```

---

## 6. Offline Indicators (Backend Response Support)

### Stale Data Header
```
Every response includes:
X-Data-Freshness: "live"     ← data is real-time
X-Data-Freshness: "cached"   ← data from server cache (still recent)
X-Data-Freshness: "stale"    ← data may be outdated
```

### Offline Error Codes
```
OFFLINE:           "You're offline. Showing cached data."
SYNC_REQUIRED:     "Some data may be outdated. Connect to sync."
SYNC_CONFLICT:     "This was updated while you were offline."
ACTION_QUEUED:     "Your action has been saved. Will sync when online."
FEATURE_UNAVAILABLE_OFFLINE: "This feature requires an internet connection."
```

---

## 7. Admin Updates
```
GET /admin/stats → includes:
{
  "offlineStats": {
    "offlineUsersEstimate": 45,
    "pendingSyncActions": 12,
    "avgSyncDelay": "2.3 minutes",
    "syncSuccessRate": "99.2%",
    "conflictsToday": 3
  }
}
```

---

## Success Metrics
```
✅ App remains usable for 95%+ of read operations while offline
✅ Queued offline sync success rate > 99%
✅ Delta sync reduces data transfer by 70%+ on reconnect
✅ Conflict resolution handled gracefully (no data loss)
✅ State restored correctly after app restart
```

---

## Week 10 Deliverables Summary
1. ✅ Cache headers on all endpoints (ETag, Last-Modified, Cache-Control)
2. ✅ Conditional requests (If-None-Match → 304 Not Modified)
3. ✅ Delta sync endpoints (/venues/sync, /notifications/sync, /offers/sync)
4. ✅ Sync queue API (POST /sync/queue — batch offline actions)
5. ✅ Conflict resolution (last-write-wins with user confirmation options)
6. ✅ 6 offline action types supported
7. ✅ State persistence API (backup + restore user state)
8. ✅ X-Data-Freshness header on all responses
9. ✅ Offline-specific error codes
10. ✅ Admin offline monitoring stats
11. ✅ 95%+ read operations work offline
12. ✅ Sync success rate > 99%

---

## 🎉 10-WEEK BACKEND COMPLETE

### Full API Count:
```
Phase 1 (Weeks 1-6):  ~40 REST endpoints
Phase 2 (Weeks 7-10): ~15 new REST endpoints + 4 WebSocket channels + sync system

Total: ~55 REST endpoints + 4 WebSocket channels + cache headers system
```
