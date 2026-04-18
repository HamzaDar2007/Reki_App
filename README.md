# REKI Backend — Manchester Nightlife Discovery

> **Version:** 1.0.4 (Investor Demo MVP)
> **Stack:** NestJS 11 + TypeScript + PostgreSQL 18 + TypeORM
> **City:** Manchester, UK

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Setup PostgreSQL database
#    Create database: reki_db
#    User: postgres / Password: postgres (or update .env)

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Build
npx nest build --webpack

# 5. Run
npm run start:dev
# or
node dist/main.js
```

App runs on **http://localhost:3000**
Swagger docs at **http://localhost:3000/api/docs**

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USERNAME` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_NAME` | reki_db | Database name |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `JWT_REFRESH_SECRET` | *(required)* | Refresh token secret |
| `JWT_EXPIRATION` | 15m | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | 7d | Refresh token TTL |
| `DEFAULT_CITY` | Manchester | Default city |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reki.app | admin123 |
| User | demo@reki.app | demo1234 |
| Business (Albert's Schloss) | manager@alberts.com | business123 |
| Business (Warehouse Project) | manager@warehouse.com | business123 |
| Business (The Alchemist) | manager@alchemist.com | business123 |

## Seed Data

On first start (empty database), the app auto-seeds:
- **15 Manchester venues** with real coordinates, busyness, vibes
- **15 offers** (1 per venue)
- **8 notifications** covering all 7 types
- **5 analytics records**
- **3 business users** + 1 admin + 1 demo user
- **20 tags** (14 vibe + 6 music)

## API Endpoints Overview

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/config/app` | App configuration |
| GET | `/health` | Health check |

### Auth (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email/password signup |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/google` | Google OAuth |
| POST | `/auth/apple` | Apple Sign-In |
| POST | `/auth/guest` | Guest anonymous login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset with token |
| POST | `/auth/refresh-token` | Refresh JWT tokens |

### User (JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/preferences` | Get vibe/music preferences |
| POST | `/users/preferences` | Save preferences |
| PUT | `/users/preferences` | Update preferences |
| GET | `/users/saved-venues` | List saved venues |
| POST | `/users/saved-venues/:venueId` | Save venue |
| DELETE | `/users/saved-venues/:venueId` | Unsave venue |
| GET | `/users/redemptions` | Redemption history |

### Venues (Public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/venues` | List with filters + pagination |
| GET | `/venues/search?q=` | Search venues |
| GET | `/venues/filter-options` | Available filters |
| GET | `/venues/trending` | Top 5 by busyness |
| GET | `/venues/map-markers` | Map marker data |
| GET | `/venues/:id` | Venue detail |
| POST | `/venues/:id/view` | Track view |

### Tags (Public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tags` | All tags (vibes + music) |
| GET | `/tags/vibes` | Vibe tags only |
| GET | `/tags/music` | Music tags only |
| GET | `/tags/search?q=` | Search tags |

### Offers (JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/offers/:id` | Offer detail |
| POST | `/offers/:id/claim` | Claim offer (get voucher) |
| POST | `/offers/:id/redeem` | Redeem with voucher code |
| POST | `/offers/:id/wallet-pass` | Apple Wallet pass data |

### Notifications (JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Grouped (Today/Yesterday/Earlier) |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

### Business Auth (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/business/login` | Business login |
| POST | `/auth/business/register` | Apply to join REKI |
| POST | `/auth/business/forgot-password` | Business password reset |

### Business Portal (Business JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/business/dashboard/:venueId` | Venue dashboard |
| GET | `/business/analytics/:venueId` | Venue analytics |
| PUT | `/business/venues/:id/status` | Update busyness + vibes |
| GET | `/business/venues/:id/status` | Get current status |
| GET | `/business/venues/:id/offers` | List venue offers |
| POST | `/business/offers` | Create offer |
| PUT | `/business/offers/:id` | Update offer |
| PUT | `/business/offers/:id/toggle` | Toggle active/inactive |
| DELETE | `/business/offers/:id` | Soft delete offer |

### Admin (Admin JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform overview stats |
| GET | `/admin/users` | All users |
| GET | `/admin/users/:id/activity` | User activity |
| GET | `/admin/venues` | All venues with status |
| GET | `/admin/venues/:id/logs` | Venue update logs |
| GET | `/admin/offers` | All offers |
| GET | `/admin/offers/redemptions` | Redemption logs |
| GET | `/admin/activity-logs` | System activity logs |
| GET | `/admin/notifications` | All notifications |

### Demo Simulation (Admin JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/demo/simulate` | Run named scenario |
| POST | `/admin/demo/simulate-time` | Simulate specific hour |
| GET | `/admin/demo/scenarios` | List scenarios |
| POST | `/admin/demo/reset` | Reset to seed state |

## Database Schema

**15 Entities:**

| Entity | Table | Key Fields |
|--------|-------|------------|
| User | users | id, email, name, role, preferences (JSONB), savedVenues |
| RefreshToken | refresh_tokens | token, userId, isRevoked, expiresAt |
| Venue | venues | id, name, address, city, lat/lng, category, rating |
| Busyness | busyness | venueId, level (quiet/moderate/busy), percentage |
| Vibe | vibes | venueId, tags[], musicGenre[], vibeCheckScore |
| Offer | offers | venueId, title, type, validDays[], validTimeStart/End |
| Redemption | redemptions | offerId, userId, voucherCode, status, transactionId |
| Notification | notifications | userId, type, title, message, isRead |
| Tag | tags | name, category (vibe/music), isActive |
| BusinessUser | business_users | email, venueId, role (owner/manager/staff) |
| VenueAnalytics | venue_analytics | venueId, date, totalViews, redemptions, etc. |
| ActivityLog | activity_logs | actorId, action, target, details (JSONB) |

## Demo Scenarios

```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reki.app","password":"admin123"}'

# Run Saturday Night at 10 PM
curl -X POST http://localhost:3000/admin/demo/simulate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"saturday-night","hour":22}'

# Reset demo data between presentations
curl -X POST http://localhost:3000/admin/demo/reset \
  -H "Authorization: Bearer <token>"
```

**Available Scenarios:**
- `saturday-night` — Full Saturday night progression (7PM-midnight)
- `quiet-afternoon` — Peaceful afternoon (2-4 PM)
- `quiet-evening` — Mon-Wed evening (6-7 PM)
- `warming-up` — Friday 8-9 PM build-up
- `peak-time` — Fri-Sat 11PM-1AM maximum capacity
- `winding-down` — Saturday 1-2 AM wind-down
- `peak-transition` — Rapid 7PM → 10PM progression

## Project Structure

```
backend/src/
├── app.module.ts          # Root module
├── app.controller.ts      # Config + health endpoints
├── main.ts                # Bootstrap (Swagger, CORS, pipes)
├── config/                # App + database configuration
├── common/
│   ├── decorators/        # @Roles(), @CurrentUser()
│   ├── enums/             # 10 enum types
│   ├── filters/           # HttpExceptionFilter
│   ├── guards/            # RolesGuard, BusinessGuard, NoGuestGuard
│   ├── interceptors/      # ResponseInterceptor
│   ├── pipes/             # ValidationPipe
│   └── utils/             # Haversine distance, generators
├── modules/
│   ├── admin/             # Admin dashboard APIs
│   ├── audit/             # Activity logging
│   ├── auth/              # JWT auth, strategies, guards
│   ├── business/          # Business portal (dashboard, offers, status)
│   ├── busyness/          # Venue busyness state
│   ├── demo/              # Demo simulation system
│   ├── notifications/     # User notification system
│   ├── offers/            # Offers + redemptions
│   ├── profile/           # Profile placeholder
│   ├── tags/              # Vibe + music tags
│   ├── users/             # User management + preferences
│   ├── venues/            # Venue discovery + filtering
│   └── vibes/             # Venue vibe state
└── seed/                  # Auto-seed data + service
```

## Phase 2 Roadmap

- **Week 7:** Quality & Stability — tests, CI/CD, logging, monitoring
- **Week 8:** Real GPS & Interactive Maps — live location, RAG markers
- **Week 9:** Push Notifications & Real-Time — FCM, WebSockets
- **Week 10:** Offline Support — local cache, sync queue
- **Beyond:** Android, multi-city, payments, live partnerships
