# REKI — Phase 2 Technical Roadmap

> Post-MVP development plan for investor visibility

---

## Week 7: Quality & Stability
**Goal:** Production-grade reliability

- [ ] Unit tests for all services (Jest + supertest)
- [ ] Integration tests for critical flows (auth, offers, business)
- [ ] CI/CD pipeline (GitHub Actions → build, test, deploy)
- [ ] Structured logging (Winston/Pino with correlation IDs)
- [ ] Error monitoring (Sentry integration)
- [ ] Health check dashboard (uptimeRobot or similar)
- [ ] Rate limiting on auth endpoints (5 attempts per 15 min)
- [ ] Account lockout after repeated failures
- [ ] Input sanitization audit

## Week 8: Real GPS & Interactive Maps
**Goal:** Live location-based discovery

- [ ] Real-time GPS tracking (client sends location periodically)
- [ ] Geo-spatial queries (PostGIS extension)
- [ ] Radius-based venue search (`GET /venues?lat=&lng=&radius=`)
- [ ] Dynamic map markers with real-time busyness colors
- [ ] "Venues near me" sorted by actual walking distance
- [ ] Google Maps / Mapbox integration support
- [ ] Geofencing alerts (notify when near saved venue)

## Week 9: Push Notifications & Real-Time
**Goal:** Engagement through timely alerts

- [ ] Firebase Cloud Messaging (FCM) integration
- [ ] Device token management (register/unregister)
- [ ] Real-time WebSocket connections (Socket.IO or native WS)
- [ ] Live busyness updates pushed to connected clients
- [ ] Push notification preferences (user opt-in/out per type)
- [ ] Weekly recap cron job (Monday morning automated notification)
- [ ] Social check-in system (real friend activity, not mock)

## Week 10: Offline Support & Polish
**Goal:** Reliable experience on unstable connections

- [ ] Offline-first architecture (local SQLite/AsyncStorage cache)
- [ ] Background sync queue (queue actions while offline)
- [ ] Conflict resolution strategy (server wins for busyness, client wins for preferences)
- [ ] Image caching and progressive loading
- [ ] Skeleton screens for better perceived performance
- [ ] App store submission preparation (iOS + Android)

## Beyond Week 10

### Multi-City Expansion
- [ ] City selector in app config
- [ ] Seed data for London, Birmingham, Leeds
- [ ] City-specific venue categories and tags
- [ ] Regional admin dashboards

### Payments & Monetization
- [ ] Stripe integration for premium venue listings
- [ ] In-app ticket purchases
- [ ] Revenue share model for redeemed offers
- [ ] Business subscription tiers (Basic/Pro/Enterprise)

### Real Integrations
- [ ] OpenWeatherMap API (real weather data)
- [ ] Apple Wallet .pkpass generation (real Apple Developer certs)
- [ ] Google Wallet pass support
- [ ] Instagram/TikTok social sharing
- [ ] Real venue partnerships in Manchester

### Advanced Features
- [ ] Machine learning vibe prediction
- [ ] Crowd density estimation from anonymized data
- [ ] Personalized venue recommendations (collaborative filtering)
- [ ] Event calendar integration
- [ ] Group planning features (plan a night out with friends)
- [ ] Loyalty program (visit X times → unlock reward)

---

## Technical Debt (from MVP)

| Item | Priority | Notes |
|------|----------|-------|
| Google/Apple OAuth verification | HIGH | Currently `decode()` only, needs real API verification |
| Password reset token in response | HIGH | Remove before production (currently DEV-only) |
| Email verification flow | MEDIUM | `isVerified` field exists but no email confirmation |
| Apple Wallet .pkpass | MEDIUM | Returns mock data, needs Apple Developer certs |
| Mock weather data | LOW | Hardcoded rain/8°C, needs OpenWeatherMap key |
| Mock analytics data | LOW | Business dashboard uses hardcoded metrics |
| Social proof mock names | LOW | Uses random names, not real user data |
| Profile module empty | LOW | All profile logic is in users module |

---

## Infrastructure Requirements

| Service | Purpose | Provider Options |
|---------|---------|-----------------|
| Hosting | NestJS server | AWS EC2, Railway, Render, DigitalOcean |
| Database | PostgreSQL | AWS RDS, Supabase, Railway |
| File Storage | Venue images | AWS S3, Cloudflare R2 |
| Push Notifications | FCM | Firebase (free tier) |
| Email | Password reset, verification | SendGrid, Amazon SES |
| Monitoring | Error tracking | Sentry (free tier) |
| CI/CD | Build + deploy | GitHub Actions (free for public repos) |
| CDN | Static assets | CloudFront, Cloudflare |
