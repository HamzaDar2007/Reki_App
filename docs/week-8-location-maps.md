# Week 8 – Real Location & Maps (Phase 2)

> ⚠️ **Note**: Phase 2 ki screens abhi client ne provide nahi ki hain. Yeh doc sirf backend tasks cover karta hai jo document.md mein defined hain. Jab Phase 2 screens milengi, tab screen-level mapping add hoga.

## Goal
Mock location data ko real geolocation se replace karna, interactive RAG map banana, proximity-based features enable karna.

**Priority**: High

---

## 1. Real Geolocation

### Replace Mock Location with Real GPS
```
Phase 1 mein:
  - Venue distances mock thay (hardcoded "0.3 miles")
  - Sort by distance fake tha

Phase 2 (ab):
  - User ka real GPS coordinates aayenge
  - Haversine formula se real distance calculate hogi
  - Sort/filter by actual proximity
```

### Location APIs

**Accept User Location** — `POST /users/location`
```json
Request: {
  "lat": 53.4808,
  "lng": -2.2426,
  "accuracy": 15,
  "timestamp": "2024-10-24T22:00:00Z"
}
Response: { "success": true }
```
- Stores user's current location in DB
- Used for proximity calculations

**Location Consent** — `PUT /users/location-consent`
```json
Request: {
  "locationEnabled": true,
  "backgroundLocationEnabled": false
}
```

### Distance-Aware Venue Queries
```
Existing endpoints upgrade:

GET /venues?city=manchester&lat=53.4808&lng=-2.2426&sort=distance
→ Returns venues sorted by real distance

GET /venues?lat=53.4808&lng=-2.2426&radius=1.0
→ Only venues within 1 mile radius ("Near Me")

GET /venues/:id?lat=53.4808&lng=-2.2426
→ Venue detail includes real distance + walking time estimate

Response includes:
{
  "distance": "0.4 miles",
  "walkingTime": "8 min",
  "directionsUrl": "https://maps.google.com/?daddr=53.4798,-2.2507"
}
```

### Distance Calculation
```
Function: haversine(lat1, lng1, lat2, lng2) → miles
- Used in all venue queries when user location provided
- If no location → fallback to Manchester city centre (53.4808, -2.2426)
```

### "Near Me" Sorting
```
GET /venues?sort=distance&lat=...&lng=...
Score formula updated:
  recommendedScore = (preferenceMatch * 2) + (proximityScore * 1.5) + (busynessScore * 1)
  proximityScore = 1 / (distance + 0.1)
```

### Permission States Handling
```
Backend handles when client sends no location:
- Location denied → return venues without distance, sort by busyness/relevance
- Location granted → return venues with real distance
- Background location → enable geofencing features
```

---

## 2. RAG Interactive Map View

### RAG Color Logic (Red, Amber, Green)
```
GREEN  (🟢): busyness 0-33%   → Quiet, easy entry
AMBER  (🟡): busyness 34-66%  → Getting busy, some wait possible
RED    (🔴): busyness 67-100% → Packed, may restrict entry
```

### Map Markers Endpoint (Upgraded)
```
GET /venues/map-markers?lat=53.4808&lng=-2.2426&city=manchester

Response: {
  "markers": [
    {
      "venueId": "v1",
      "name": "Albert's Schloss",
      "lat": 53.4745,
      "lng": -2.2489,
      "busynessPercentage": 88,
      "ragColor": "red",
      "vibeLabel": "BUZZING",
      "category": "Bar",
      "distance": "0.3 miles",
      "hasActiveOffer": true
    },
    {
      "venueId": "v2",
      "name": "20 Stories",
      "lat": 53.4798,
      "lng": -2.2507,
      "busynessPercentage": 45,
      "ragColor": "amber",
      "vibeLabel": "CHILLED",
      "category": "Rooftop Lounge",
      "distance": "0.5 miles",
      "hasActiveOffer": true
    },
    {
      "venueId": "v3",
      "name": "Night & Day Café",
      "lat": 53.4841,
      "lng": -2.2368,
      "busynessPercentage": 20,
      "ragColor": "green",
      "vibeLabel": "CHILL",
      "category": "Bar",
      "distance": "0.8 miles",
      "hasActiveOffer": false
    }
  ],
  "userLocation": { "lat": 53.4808, "lng": -2.2426 }
}
```

### Map Viewport Query (Optimization)
```
GET /venues/map-markers?bounds=SW_LAT,SW_LNG,NE_LAT,NE_LNG
→ Only return venues visible in current map viewport
→ Don't load all venues, only what's on screen
→ Reduces payload + improves performance
```

### Map-Based Discovery
```
GET /venues/search?q=northern+quarter&lat=...&lng=...
→ Search by area name → returns venues in that area with distance
```

### Navigation Deep Linking
```
Backend returns navigation URLs per venue:
{
  "navigation": {
    "googleMaps": "comgooglemaps://?daddr=53.4798,-2.2507",
    "appleMaps": "maps://?daddr=53.4798,-2.2507",
    "waze": "waze://?ll=53.4798,-2.2507&navigate=yes",
    "webFallback": "https://maps.google.com/maps?daddr=53.4798,-2.2507"
  }
}
```

---

## 3. Geofencing & Intelligence

### Geofence Check
```
POST /geofence/check
Request: { "lat": 53.4808, "lng": -2.2426 }

Backend logic:
1. Find all venues within 200m of user
2. Check if any have active offers
3. Check if user already notified for this venue today (prevent spam)
4. If new match found → create notification

Response: {
  "nearbyVenues": [
    {
      "venueId": "v1",
      "name": "The Alchemist",
      "distance": "150m",
      "activeOffer": "2-for-1 Cocktails",
      "notificationSent": true
    }
  ]
}
```

### Geofence Notification
```
When user enters 200m radius of venue with offer:
Notification: {
  type: "PROXIMITY_OFFER",
  title: "You're near The Alchemist!",
  message: "2-for-1 Cocktails available until 11 PM. Just 200m away!",
  venueId: "v1",
  offerId: "o1"
}

Rate limit: max 3 proximity notifications per user per hour
Cooldown: same venue → no re-notify for 4 hours
```

### Popular Neighborhoods Tracking
```
GET /analytics/popular-areas?city=manchester
Response: {
  "areas": [
    { "name": "Northern Quarter", "activeVenues": 12, "totalUsers": 340, "avgBusyness": 72 },
    { "name": "Spinningfields", "activeVenues": 8, "totalUsers": 225, "avgBusyness": 65 },
    { "name": "Deansgate", "activeVenues": 15, "totalUsers": 456, "avgBusyness": 80 }
  ]
}
```

### Aggregated Tracking
```
Backend tracks (anonymized, aggregated):
- Which areas have most active users at what times
- Popular routes (which areas users visit in sequence)
- Peak times per neighborhood
→ Used for business insights + admin analytics
```

---

## 4. Database Changes
```
1. Venue collection: add 2dsphere index on coordinates
   db.venues.createIndex({ "coordinates": "2dsphere" })

2. User collection: add current location field
   { currentLocation: { type: "Point", coordinates: [lng, lat] }, locationUpdatedAt }

3. GeofenceLog collection (new):
   { userId, venueId, distance, notifiedAt, offerId }

4. AreaAnalytics collection (new):
   { areaName, city, activeVenues, totalUsers, date, hour }
```

---

## 5. Admin Updates
```
GET /admin/stats → now includes:
{
  "locationStats": {
    "usersWithLocation": 2800,
    "mapDiscoveryRate": "30%",
    "geofenceNotificationsSent": 156,
    "topAreas": [...]
  }
}
```

---

## Success Metrics
```
✅ Real GPS accuracy < 50m
✅ Interactive map load time < 2s
✅ 30%+ increase in venue detail views driven by map discovery
✅ Geofencing notifications delivered within 5 seconds of entering zone
✅ RAG colors update in real-time with busyness changes
```

---

## Week 8 Deliverables Summary
1. ✅ Real GPS distance calculation (haversine) for all venue queries
2. ✅ User location API (accept + store location)
3. ✅ Near Me filter (radius-based venue query)
4. ✅ Distance-weighted feed sorting
5. ✅ RAG map markers API (Red/Amber/Green based on busyness)
6. ✅ Map viewport bounds query (load only visible venues)
7. ✅ Navigation deep linking (Google Maps, Apple Maps, Waze)
8. ✅ Geofencing system (200m proximity alerts with rate limiting)
9. ✅ Popular neighborhoods tracking + API
10. ✅ 2dsphere spatial index on venue coordinates
11. ✅ Location permission graceful handling
12. ✅ Admin location stats
