# Week 9 – Push Notifications & Real-Time (Phase 2)

> ⚠️ **Note**: Phase 2 ki screens abhi client ne provide nahi ki hain. Yeh doc sirf backend tasks cover karta hai jo document.md mein defined hain. Jab Phase 2 screens milengi, tab screen-level mapping add hoga.

## Goal
Remote push notifications enable karna (FCM), real-time data updates lagana (WebSocket/SSE), user re-engagement drive karna.

**Priority**: High

---

## 1. Push Notification System (Firebase Cloud Messaging)

### FCM Setup
```
- Firebase project configured
- FCM server key stored in environment variables
- Admin SDK initialized for server-side sending
- APN certificate configured for iOS push
```

### Device Token Registration

**Register Device** — `POST /devices/register`
```json
Request: {
  "fcmToken": "firebase-cloud-messaging-token",
  "platform": "ios",
  "deviceId": "unique-device-id",
  "appVersion": "1.0.4"
}
Response: { "success": true, "deviceId": "d1" }
```

**Deactivate Device** (on logout) — `DELETE /devices/:deviceId`

**Device Model:**
```
Device {
  id, userId, fcmToken, platform (ios/android),
  deviceId, appVersion, isActive,
  createdAt, lastActiveAt
}
```

### User Notification Preferences

**Set Preferences** — `PUT /users/notification-preferences`
```json
Request: {
  "vibeAlerts": true,         ← venue busyness alerts
  "livePerformance": true,    ← new live music/events
  "socialCheckins": true,     ← friend check-ins
  "offerAlerts": true,        ← new offers at saved venues
  "weeklyRecap": true,        ← weekly summary
  "proximityAlerts": true,    ← nearby venue with offers (Week 8)
  "quietHoursStart": "02:00", ← no notifications after 2 AM
  "quietHoursEnd": "09:00"    ← resume at 9 AM
}
```

**Get Preferences** — `GET /users/notification-preferences`

### Push Notification Types (via FCM)
```
1. VIBE_ALERT:
   Title: "🔥 Albert Hall is peaking!"
   Body: "80% capacity reached. Grab your spot!"
   Image: venue hero image (rich notification)
   Deep link: reki://venue/v5

2. LIVE_PERFORMANCE:
   Title: "🎵 YES Manchester"
   Body: "New live set starting in 15 mins."
   Deep link: reki://venue/v6

3. SOCIAL_CHECKIN:
   Title: "👋 Alex just checked in"
   Body: "Alex is at Diecast. Join the crew!"
   Deep link: reki://venue/v7

4. OFFER_CONFIRMATION:
   Title: "🎫 Offer Redeemed!"
   Body: "Your 2-for-1 at The Alchemist is confirmed."
   Deep link: reki://redemption/r1

5. PROXIMITY_OFFER (from Week 8):
   Title: "📍 You're near The Alchemist!"
   Body: "2-for-1 Cocktails available. Just 200m away!"
   Deep link: reki://venue/v1/offer/o1

6. WEEKLY_RECAP:
   Title: "📊 Weekly Recap"
   Body: "You visited 4 venues last week."
   Deep link: reki://notifications
```

### Rich Notification Support
```
FCM payload:
{
  "to": "device-fcm-token",
  "notification": {
    "title": "🔥 Albert Hall is peaking!",
    "body": "80% capacity. Grab your spot!",
    "image": "https://cdn.reki.app/venues/v5/hero.jpg",
    "sound": "reki_notification.wav"
  },
  "data": {
    "type": "VIBE_ALERT",
    "venueId": "v5",
    "deepLink": "reki://venue/v5"
  }
}
```

### Delivery Logic (Before Sending)
```
1. Check user's notification preferences (vibeAlerts: true?)
2. Check quiet hours (not between quietHoursStart and quietHoursEnd)
3. Check device token is active
4. Check user hasn't been notified for same venue/event in last 1 hour
5. Send via FCM
6. Log delivery status

If FCM returns invalid token → mark device as inactive
If FCM quota exceeded → queue and retry with backoff
```

### Notification Analytics
```
Track per notification:
- sent: timestamp
- delivered: FCM delivery receipt
- opened: user tapped (deep link triggered)
- dismissed: user swiped away

Admin endpoint:
GET /admin/notifications → {
  "totalSent": 1000,
  "delivered": 950,
  "opened": 340,
  "openRate": "34%"
}
```

---

## 2. Real-Time Updates (WebSocket / SSE)

### WebSocket Server Architecture
```
Connection URL: wss://api.reki.app/live?token=JWT_TOKEN

Connection flow:
1. Client connects with JWT token
2. Server validates token
3. Assigns user to rooms:
   - City room: "manchester" (feed/map updates for all users in city)
   - Venue room: "venue:v1" (specific venue detail updates)
   - User room: "user:u1" (personal notifications)
   - Business room: "business:v1" (dashboard updates)
4. Heartbeat: ping/pong every 30 seconds
5. Max connections per user: 3 (phone + tablet + web)
```

### Real-Time Channels & Events

**Channel: City Feed** (`/live/feed?city=manchester`)
```
When any venue's busyness changes:
Event: "BUSYNESS_UPDATE"
Data: {
  "venueId": "v1",
  "busyness": { "level": "busy", "percentage": 88, "ragColor": "red" },
  "vibeTags": ["HIGH ENERGY", "PACKED"]
}

When business creates new offer:
Event: "NEW_OFFER"
Data: {
  "venueId": "v1",
  "venueName": "Albert's Schloss",
  "offer": { "title": "Flash Deal: Free Starter", "endsIn": "1h" }
}
```

**Channel: Venue Detail** (`/live/venue/:venueId`)
```
Event: "BUSYNESS_LIVE"
Data: { "percentage": 90, "level": "busy", "ragColor": "red", "peakTime": "10:30 PM" }

Event: "VIBE_UPDATE"
Data: { "tags": ["High Energy", "Live Music", "Packed"] }

Event: "OFFER_COUNTDOWN"
Data: { "offerId": "o1", "remainingMinutes": 15, "isUrgent": true }

Event: "SOCIAL_UPDATE"
Data: { "count": 16, "message": "Sarah, Mike & 14 others are here" }

Event: "VIEWING_COUNT"
Data: { "count": 24 }
```

**Channel: Business Dashboard** (`/live/business/dashboard/:venueId`)
```
Event: "STATS_UPDATE"
Data: { "busyness": 90, "change": "+14%", "redemptions": 43, "vibeScore": 4.9 }

Event: "NEW_REDEMPTION"
Data: { "offerId": "o1", "offerTitle": "Happy Hour", "count": 43 }

Event: "NEW_SAVE"
Data: { "totalSaves": 90 }
```

**Channel: Map** (`/live/map?city=manchester`)
```
Event: "MARKER_UPDATE"
Data: {
  "venueId": "v1",
  "ragColor": "red",
  "busynessPercentage": 85,
  "vibeLabel": "BUZZING"
}
```

### "Currently Viewing" Counter
```
Per venue, track how many users are viewing right now:

- User opens venue detail → WebSocket joins "venue:v1" room → increment counter
- User leaves (disconnect/navigate away) → decrement counter
- GET /venues/:id response includes: { "currentlyViewing": 23 }
- WebSocket pushes count changes to all viewers
```

### Offer Countdown (Real-Time)
```
When offer has limited time:
- At 30 min remaining → push "OFFER_COUNTDOWN" with remainingMinutes: 30
- At 15 min remaining → push with isUrgent: true
- At 5 min remaining → push every minute
- At 0 → push "OFFER_EXPIRED" → all viewers see expired state
```

### Event Broadcasting Logic
```
When business updates busyness:
  → Broadcast to "manchester" room (feed update for all users)
  → Broadcast to "venue:v1" room (detail update for viewers)
  → Broadcast to "map:manchester" room (map marker color change)
  → Broadcast to "business:v1" room (dashboard confirmation)
  → If >= 80% → FCM push to users who saved this venue
```

### Fallback Strategy
```
1. Primary: WebSocket (Socket.io)
2. Fallback 1: SSE (Server-Sent Events) — if WebSocket fails
3. Fallback 2: Polling every 30 seconds — if SSE also fails

Client auto-detects and downgrades:
WebSocket connect failed? → try SSE
SSE failed? → fall back to GET /venues polling every 30s
```

### Optimistic UI Updates
```
User actions that update optimistically:
- Save venue → heart fills immediately (before server confirms)
- Mark notification read → grays out immediately
- Toggle offer → switches immediately

If server returns error → revert UI + show error toast
Backend sends confirmation/rejection within 2 seconds
```

---

## 3. Business Push Notifications
```
Business-specific push notifications:
- "Your venue Albert's Schloss is trending! 88% busyness."
- "New offer 'Happy Hour' has been redeemed 42 times today."
- "Vibe check score dropped to 3.2 — consider updating status."
```

---

## 4. Admin Updates
```
GET /admin/stats → includes:
{
  "realTimeStats": {
    "activeWebSocketConnections": 456,
    "pushNotificationsSentToday": 1200,
    "pushOpenRate": "34%",
    "avgRealtimeLatency": "120ms"
  }
}
```

---

## Success Metrics
```
✅ 60%+ push notification opt-in rate
✅ 15%+ of app sessions initiated via notification taps
✅ WebSocket connection established < 500ms
✅ Real-time busyness updates delivered < 1 second
✅ Offer countdown accuracy within 1 minute
```

---

## Week 9 Deliverables Summary
1. ✅ FCM integration (Firebase Cloud Messaging for iOS)
2. ✅ Device token registration/deactivation API
3. ✅ Notification preference toggles API (6 types + quiet hours)
4. ✅ Rich push notifications (images, deep links, sound)
5. ✅ Push delivery logic (preferences check, rate limiting, quiet hours)
6. ✅ WebSocket server with room-based architecture
7. ✅ Live feed channel (city-wide busyness changes)
8. ✅ Live venue detail channel (busyness, vibe, offers, social)
9. ✅ Live map channel (RAG marker color updates)
10. ✅ Live business dashboard channel
11. ✅ "Currently viewing" counter
12. ✅ Offer countdown (real-time minutes remaining)
13. ✅ Fallback: WebSocket → SSE → Polling
14. ✅ Notification delivery tracking (sent/delivered/opened)
