# REKI — Demo Guide

> How to run demo scenarios for investor presentations

## Prerequisites

1. Backend running on `http://localhost:3000`
2. PostgreSQL database `reki_db` with seed data loaded
3. Admin credentials: `admin@reki.app` / `admin123`

## Step 1: Get Admin Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reki.app","password":"admin123"}'
```

Save the `accessToken` from the response.

## Step 2: Reset Demo Data (Before Each Presentation)

```bash
curl -X POST http://localhost:3000/admin/demo/reset \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

This resets:
- All busyness/vibe states to seed defaults
- Clears all redemptions (offer counts back to 0)
- Clears notifications and activity logs

## Step 3: Run Demo Scenarios

### Scenario A: "Saturday Night Out" (Investor Favorite)

**7 PM — Early Evening (Quiet)**
```bash
curl -X POST http://localhost:3000/admin/demo/simulate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"saturday-night","hour":19}'
```

**10 PM — Peak Hours (Busy)**
```bash
curl -X POST http://localhost:3000/admin/demo/simulate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"saturday-night","hour":22}'
```

**11 PM — Late Night (Packed)**
```bash
curl -X POST http://localhost:3000/admin/demo/simulate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"saturday-night","hour":23}'
```

### Scenario B: Quick Peak Transition
```bash
curl -X POST http://localhost:3000/admin/demo/simulate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"peak-transition"}'
```
Runs 7PM → 10PM in one call, showing the natural progression.

### All Available Scenarios

| Scenario | Description | Default Hour |
|----------|-------------|-------------|
| `saturday-night` | Full Saturday night | 22 (10 PM) |
| `quiet-afternoon` | Peaceful afternoon | 14 (2 PM) |
| `quiet-evening` | Mon-Wed evening | 18 (6 PM) |
| `warming-up` | Friday build-up | 20 (8 PM) |
| `peak-time` | Maximum capacity | 23 (11 PM) |
| `winding-down` | Late night wind-down | 1 (1 AM) |
| `peak-transition` | 7PM→10PM rapid build | N/A (runs all 4 hours) |

## Step 4: Demo the User Journey

1. **Login as demo user**: `demo@reki.app` / `demo1234`
2. **Browse feed**: `GET /venues?city=manchester&lat=53.4808&lng=-2.2426`
3. **View venue detail**: `GET /venues/:id?lat=53.4808&lng=-2.2426`
4. **Claim offer**: `POST /offers/:offerId/claim`
5. **Check notifications**: `GET /notifications`

## Step 5: Demo the Business Journey

1. **Login as business**: `manager@alberts.com` / `business123`
2. **View dashboard**: `GET /business/dashboard/:venueId`
3. **Update status**: `PUT /business/venues/:venueId/status` with `{"busyness":"busy","vibes":["High Energy","Live Music"]}`
4. **Create offer**: `POST /business/offers`

## Step 6: Demo Admin View

1. **Platform stats**: `GET /admin/stats`
2. **All users**: `GET /admin/users`
3. **All venues**: `GET /admin/venues`
4. **Activity logs**: `GET /admin/activity-logs`

## Tips for Live Demo

- **Always reset** between demo runs: `POST /admin/demo/reset`
- **Use hour parameter** to control the narrative (show progression)
- **Show map markers** after simulation to see color changes (green → amber → red)
- **Swagger UI** at `/api/docs` is great for interactive API demos
- **Social proof** messages change dynamically based on busyness %
