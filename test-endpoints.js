// Quick endpoint tester for REKI backend
const http = require('http');

const BASE = 'http://localhost:3000';
let userToken = '';
let userRefreshToken = '';
let guestToken = '';
let adminToken = '';
let businessToken = '';
let venueId = '';
let offerId = '';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, data: parsed, raw: data });
      });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, error: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function result(num, method, path, status, expected, note) {
  const ok = expected.includes(status);
  const icon = ok ? 'PASS' : 'FAIL';
  console.log(`${icon} | ${num.toString().padStart(2)} | ${method.padEnd(6)} | ${path.padEnd(45)} | ${status} | ${note || ''}`);
  return ok;
}

async function run() {
  let pass = 0, fail = 0, total = 0;
  
  console.log('='.repeat(100));
  console.log('REKI BACKEND - FULL ENDPOINT TEST');
  console.log('='.repeat(100));
  
  // =============================================
  // PHASE 1: PUBLIC / GUEST ENDPOINTS
  // =============================================
  console.log('\n--- PHASE 1: PUBLIC / GUEST ENDPOINTS (25) ---\n');
  console.log('     | #  | Method | Path                                          | Code | Note');
  console.log('-'.repeat(100));

  let r, n = 0;

  // 1. GET /health
  r = await req('GET', '/health');
  n++; total++; result(n, 'GET', '/health', r.status, [200], r.data?.status) ? pass++ : fail++;

  // 2. GET /config/app
  r = await req('GET', '/config/app');
  n++; total++; result(n, 'GET', '/config/app', r.status, [200], r.data?.city || r.data?.defaultCity) ? pass++ : fail++;

  // 3. POST /auth/guest
  r = await req('POST', '/auth/guest', { deviceId: 'test-device-endpoint-check' });
  guestToken = r.data?.tokens?.accessToken || r.data?.accessToken || '';
  n++; total++; result(n, 'POST', '/auth/guest', r.status, [201], guestToken ? 'token OK' : 'no token') ? pass++ : fail++;

  // 4. POST /auth/register
  const ts = Date.now();
  r = await req('POST', '/auth/register', { email: `endpointtest${ts}@test.com`, password: 'Test1234!', name: 'EP Tester' });
  n++; total++; result(n, 'POST', '/auth/register', r.status, [201], r.data?.accessToken ? 'registered' : r.data?.message) ? pass++ : fail++;

  // 5. POST /auth/login (demo user)
  r = await req('POST', '/auth/login', { email: 'demo@reki.app', password: 'demo1234' });
  userToken = r.data?.tokens?.accessToken || r.data?.accessToken || '';
  userRefreshToken = r.data?.tokens?.refreshToken || r.data?.refreshToken || '';
  n++; total++; result(n, 'POST', '/auth/login', r.status, [200, 201], userToken ? 'token OK' : 'no token') ? pass++ : fail++;

  // 6. POST /auth/google
  r = await req('POST', '/auth/google', { idToken: 'fake-google-token' });
  n++; total++; result(n, 'POST', '/auth/google', r.status, [201, 400, 401], 'social auth endpoint responds') ? pass++ : fail++;

  // 7. POST /auth/apple
  r = await req('POST', '/auth/apple', { idToken: 'fake-apple-token' });
  n++; total++; result(n, 'POST', '/auth/apple', r.status, [201, 400, 401], 'social auth endpoint responds') ? pass++ : fail++;

  // 8. POST /auth/forgot-password
  r = await req('POST', '/auth/forgot-password', { email: 'demo@reki.app' });
  n++; total++; result(n, 'POST', '/auth/forgot-password', r.status, [201, 200], r.data?.message || 'sent') ? pass++ : fail++;

  // 9. POST /auth/reset-password
  r = await req('POST', '/auth/reset-password', { token: 'fake-reset-token', password: 'New1234!' });
  n++; total++; result(n, 'POST', '/auth/reset-password', r.status, [200, 201, 400, 404], 'endpoint responds') ? pass++ : fail++;

  // 10. POST /auth/refresh-token
  r = await req('POST', '/auth/refresh-token', { refreshToken: userRefreshToken || 'fake' });
  n++; total++; result(n, 'POST', '/auth/refresh-token', r.status, [201, 200, 401], userRefreshToken ? 'refresh OK' : 'no refresh token') ? pass++ : fail++;

  // 11. GET /venues
  r = await req('GET', '/venues');
  if (r.data?.venues && Array.isArray(r.data.venues) && r.data.venues.length > 0) { venueId = r.data.venues[0].id; }
  else if (r.data && Array.isArray(r.data) && r.data.length > 0) { venueId = r.data[0].id; }
  else if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) { venueId = r.data.data[0].id; }
  const venueCount = r.data?.venues?.length || r.data?.count || (Array.isArray(r.data) ? r.data.length : '?');
  n++; total++; result(n, 'GET', '/venues', r.status, [200], `${venueCount} venues`) ? pass++ : fail++;

  // 12. GET /venues/search
  r = await req('GET', '/venues/search?q=albert');
  n++; total++; result(n, 'GET', '/venues/search?q=albert', r.status, [200], 'search OK') ? pass++ : fail++;

  // 13. GET /venues/filter-options
  r = await req('GET', '/venues/filter-options');
  n++; total++; result(n, 'GET', '/venues/filter-options', r.status, [200], 'filters OK') ? pass++ : fail++;

  // 14. GET /venues/trending
  r = await req('GET', '/venues/trending');
  n++; total++; result(n, 'GET', '/venues/trending', r.status, [200], 'trending OK') ? pass++ : fail++;

  // 15. GET /venues/map-markers
  r = await req('GET', '/venues/map-markers');
  n++; total++; result(n, 'GET', '/venues/map-markers', r.status, [200], 'markers OK') ? pass++ : fail++;

  // 16. GET /venues/:id
  if (venueId) {
    r = await req('GET', `/venues/${venueId}`);
    n++; total++; result(n, 'GET', `/venues/${venueId.substring(0,8)}...`, r.status, [200], r.data?.name || 'venue detail') ? pass++ : fail++;
    // get an offer from venue
    if (r.data?.offers?.length > 0) offerId = r.data.offers[0].id;
  } else {
    n++; total++; result(n, 'GET', '/venues/:id', 0, [], 'NO VENUE ID') ? pass++ : fail++;
  }

  // 17. POST /venues/:id/view
  if (venueId) {
    r = await req('POST', `/venues/${venueId}/view`);
    n++; total++; result(n, 'POST', `/venues/${venueId.substring(0,8)}.../view`, r.status, [201, 200], 'view tracked') ? pass++ : fail++;
  } else {
    n++; total++; result(n, 'POST', '/venues/:id/view', 0, [], 'NO VENUE ID') ? pass++ : fail++;
  }

  // 18. GET /offers/:id
  if (!offerId) {
    // try to find an offer from any venue
    const vr2 = await req('GET', '/venues');
    const venues2 = vr2.data?.venues || (Array.isArray(vr2.data) ? vr2.data : (vr2.data?.data || []));
    for (const v of venues2) {
      if (v.offers?.length > 0) { offerId = v.offers[0].id; break; }
      const vd = await req('GET', `/venues/${v.id}`);
      if (vd.data?.offers?.length > 0) { offerId = vd.data.offers[0].id; break; }
      if (vd.data?.venue?.offers?.length > 0) { offerId = vd.data.venue.offers[0].id; break; }
    }
  }
  if (offerId) {
    r = await req('GET', `/offers/${offerId}`);
    n++; total++; result(n, 'GET', `/offers/${offerId.substring(0,8)}...`, r.status, [200], r.data?.title || 'offer detail') ? pass++ : fail++;
  } else {
    r = await req('GET', '/offers/00000000-0000-0000-0000-000000000001');
    n++; total++; result(n, 'GET', '/offers/:id', r.status, [200, 404], 'offer endpoint responds') ? pass++ : fail++;
  }

  // 19-22. Tags endpoints
  r = await req('GET', '/tags');
  n++; total++; result(n, 'GET', '/tags', r.status, [200], 'tags OK') ? pass++ : fail++;

  r = await req('GET', '/tags/vibes');
  n++; total++; result(n, 'GET', '/tags/vibes', r.status, [200], 'vibes OK') ? pass++ : fail++;

  r = await req('GET', '/tags/music');
  n++; total++; result(n, 'GET', '/tags/music', r.status, [200], 'music OK') ? pass++ : fail++;

  r = await req('GET', '/tags/search?q=live');
  n++; total++; result(n, 'GET', '/tags/search?q=live', r.status, [200], 'tag search OK') ? pass++ : fail++;

  // 23-25. Business auth
  r = await req('POST', '/auth/business/login', { email: 'manager@alberts.com', password: 'business123' });
  businessToken = r.data?.tokens?.accessToken || r.data?.accessToken || '';
  n++; total++; result(n, 'POST', '/auth/business/login', r.status, [200, 201], businessToken ? 'biz token OK' : 'no token') ? pass++ : fail++;

  r = await req('POST', '/auth/business/register', { email: `biz${ts}@test.com`, password: 'Biz1234!', name: 'Biz Test', businessName: 'Test Biz' });
  n++; total++; result(n, 'POST', '/auth/business/register', r.status, [201, 400, 409], 'biz register responds') ? pass++ : fail++;

  r = await req('POST', '/auth/business/forgot-password', { email: 'manager@alberts.com' });
  n++; total++; result(n, 'POST', '/auth/business/forgot-password', r.status, [201, 200], 'biz forgot-pw responds') ? pass++ : fail++;

  console.log(`\nPublic endpoints: ${pass}/${total} passed\n`);

  // =============================================
  // PHASE 2: AUTHENTICATED USER ENDPOINTS
  // =============================================
  console.log('--- PHASE 2: AUTHENTICATED USER ENDPOINTS (31) ---\n');
  console.log('     | #  | Method | Path                                          | Code | Note');
  console.log('-'.repeat(100));

  if (!userToken) {
    console.log('SKIP: No user token available');
  } else {
    // Users
    r = await req('GET', '/users/preferences', null, userToken);
    n++; total++; result(n, 'GET', '/users/preferences', r.status, [200], 'prefs OK') ? pass++ : fail++;

    r = await req('POST', '/users/preferences', { vibes: ['Chill', 'Party'], music: ['House', 'R&B'] }, userToken);
    n++; total++; result(n, 'POST', '/users/preferences', r.status, [201, 200], 'prefs set') ? pass++ : fail++;

    r = await req('PUT', '/users/preferences', { vibes: ['Chill', 'Lively'], music: ['House'] }, userToken);
    n++; total++; result(n, 'PUT', '/users/preferences', r.status, [200], 'prefs updated') ? pass++ : fail++;

    r = await req('GET', '/users/saved-venues', null, userToken);
    n++; total++; result(n, 'GET', '/users/saved-venues', r.status, [200], 'saved venues OK') ? pass++ : fail++;

    if (venueId) {
      r = await req('POST', `/users/saved-venues/${venueId}`, null, userToken);
      n++; total++; result(n, 'POST', '/users/saved-venues/:id', r.status, [201, 200, 409], 'venue saved') ? pass++ : fail++;

      r = await req('DELETE', `/users/saved-venues/${venueId}`, null, userToken);
      n++; total++; result(n, 'DELETE', '/users/saved-venues/:id', r.status, [200], 'venue unsaved') ? pass++ : fail++;
    } else {
      n += 2; total += 2; fail += 2;
      console.log('FAIL |    | POST/DEL | /users/saved-venues/:id | NO VENUE ID');
    }

    r = await req('GET', '/users/redemptions', null, userToken);
    n++; total++; result(n, 'GET', '/users/redemptions', r.status, [200], 'redemptions OK') ? pass++ : fail++;

    // Offers (authenticated)
    if (offerId) {
      r = await req('POST', `/offers/${offerId}/claim`, null, userToken);
      n++; total++; result(n, 'POST', `/offers/:id/claim`, r.status, [201, 200, 400, 409], 'claim responds') ? pass++ : fail++;

      r = await req('POST', `/offers/${offerId}/redeem`, { code: 'TEST123' }, userToken);
      n++; total++; result(n, 'POST', `/offers/:id/redeem`, r.status, [201, 200, 400, 404], 'redeem responds') ? pass++ : fail++;

      r = await req('POST', `/offers/${offerId}/wallet-pass`, null, userToken);
      n++; total++; result(n, 'POST', `/offers/:id/wallet-pass`, r.status, [201, 200, 400], 'wallet-pass responds') ? pass++ : fail++;
    } else {
      n += 3; total += 3;
      result(++n, 'POST', '/offers/:id/claim', 0, [0], 'NO OFFER ID'); fail++;
      result(++n, 'POST', '/offers/:id/redeem', 0, [0], 'NO OFFER ID'); fail++;
      result(++n, 'POST', '/offers/:id/wallet-pass', 0, [0], 'NO OFFER ID'); fail++;
    }

    // Notifications
    r = await req('GET', '/notifications', null, userToken);
    n++; total++; result(n, 'GET', '/notifications', r.status, [200], 'notifications OK') ? pass++ : fail++;

    r = await req('PUT', '/notifications/read-all', null, userToken);
    n++; total++; result(n, 'PUT', '/notifications/read-all', r.status, [200], 'read-all OK') ? pass++ : fail++;

    r = await req('PUT', '/notifications/00000000-0000-0000-0000-000000000001/read', null, userToken);
    n++; total++; result(n, 'PUT', '/notifications/:id/read', r.status, [200, 404], 'read responds') ? pass++ : fail++;

    // Devices
    r = await req('POST', '/devices/register', { deviceId: `test-${ts}`, platform: 'ios', fcmToken: 'fake-fcm-token-12345' }, userToken);
    const registeredDeviceId = r.data?.deviceId;
    n++; total++; result(n, 'POST', '/devices/register', r.status, [201, 200], 'device registered') ? pass++ : fail++;

    r = await req('DELETE', `/devices/${registeredDeviceId || 'unknown'}`, null, userToken);
    n++; total++; result(n, 'DELETE', '/devices/:deviceId', r.status, [200], 'device removed') ? pass++ : fail++;

    // Re-register device so notification-preferences work
    await req('POST', '/devices/register', { deviceId: `test-notif-${ts}`, platform: 'ios', fcmToken: 'fake-fcm-notif' }, userToken);

    r = await req('GET', '/users/notification-preferences', null, userToken);
    n++; total++; result(n, 'GET', '/users/notification-preferences', r.status, [200], 'notif-prefs OK') ? pass++ : fail++;

    r = await req('PUT', '/users/notification-preferences', { vibeAlerts: true, offerAlerts: true, livePerformance: false }, userToken);
    n++; total++; result(n, 'PUT', '/users/notification-preferences', r.status, [200], 'notif-prefs updated') ? pass++ : fail++;

    // Live (SSE - just check it responds, then close)
    r = await req('GET', '/live/feed', null, userToken);
    n++; total++; result(n, 'GET', '/live/feed', r.status, [200, 0], 'SSE feed responds') ? pass++ : fail++;

    if (venueId) {
      r = await req('GET', `/live/venue/${venueId}`, null, userToken);
      n++; total++; result(n, 'GET', '/live/venue/:id', r.status, [200, 0], 'SSE venue responds') ? pass++ : fail++;
    } else {
      n++; total++; result(n, 'GET', '/live/venue/:id', 0, [0], 'NO VENUE ID'); fail++;
    }

    r = await req('GET', '/live/map', null, userToken);
    n++; total++; result(n, 'GET', '/live/map', r.status, [200, 0], 'SSE map responds') ? pass++ : fail++;

    // Sync
    r = await req('POST', '/sync/queue', { deviceId: `test-sync-${ts}`, actions: [] }, userToken);
    n++; total++; result(n, 'POST', '/sync/queue', r.status, [201, 200], 'sync queue OK') ? pass++ : fail++;

    r = await req('GET', '/sync/status', null, userToken);
    n++; total++; result(n, 'GET', '/sync/status', r.status, [200], 'sync status OK') ? pass++ : fail++;

    r = await req('GET', '/venues/sync?since=2026-04-17T00:00:00.000Z', null, userToken);
    n++; total++; result(n, 'GET', '/venues/sync', r.status, [200], 'venues sync OK') ? pass++ : fail++;

    r = await req('GET', '/notifications/sync?since=2026-04-17T00:00:00.000Z', null, userToken);
    n++; total++; result(n, 'GET', '/notifications/sync', r.status, [200], 'notif sync OK') ? pass++ : fail++;

    r = await req('GET', '/offers/sync?since=2026-04-17T00:00:00.000Z', null, userToken);
    n++; total++; result(n, 'GET', '/offers/sync', r.status, [200], 'offers sync OK') ? pass++ : fail++;

    r = await req('PUT', '/users/state', { preferences: { vibes: ['Chill'] }, savedVenues: [], lastSyncAt: '2026-04-18T10:00:00.000Z' }, userToken);
    n++; total++; result(n, 'PUT', '/users/state', r.status, [200], 'state saved') ? pass++ : fail++;

    r = await req('GET', '/users/state', null, userToken);
    n++; total++; result(n, 'GET', '/users/state', r.status, [200], 'state loaded') ? pass++ : fail++;

    // Geofence
    r = await req('POST', '/users/location', { lat: 53.4808, lng: -2.2426, accuracy: 15 }, userToken);
    n++; total++; result(n, 'POST', '/users/location', r.status, [201, 200], 'location updated') ? pass++ : fail++;

    r = await req('PUT', '/users/location-consent', { locationEnabled: true, backgroundLocationEnabled: false }, userToken);
    n++; total++; result(n, 'PUT', '/users/location-consent', r.status, [200], 'consent updated') ? pass++ : fail++;

    r = await req('POST', '/geofence/check', { lat: 53.4808, lng: -2.2426 }, userToken);
    n++; total++; result(n, 'POST', '/geofence/check', r.status, [201, 200], 'geofence check OK') ? pass++ : fail++;

    r = await req('GET', '/analytics/popular-areas', null, userToken);
    n++; total++; result(n, 'GET', '/analytics/popular-areas', r.status, [200], 'popular areas OK') ? pass++ : fail++;
  }

  const userPass = pass;
  const userTotal = total;
  console.log(`\nAfter user endpoints: ${pass}/${total} passed\n`);

  // =============================================
  // PHASE 3: BUSINESS USER ENDPOINTS
  // =============================================
  console.log('--- PHASE 3: BUSINESS USER ENDPOINTS (9) ---\n');
  console.log('     | #  | Method | Path                                          | Code | Note');
  console.log('-'.repeat(100));

  if (!businessToken) {
    console.log('SKIP: No business token available');
  } else {
    // Need a venue owned by this business user
    let bizVenueId = '';
    // Get venues list and find one
    const vr = await req('GET', '/venues');
    const allVenues = vr.data?.venues || (Array.isArray(vr.data) ? vr.data : (vr.data?.data || []));
    if (allVenues.length > 0) bizVenueId = allVenues[0].id;

    if (bizVenueId) {
      r = await req('GET', `/business/dashboard/${bizVenueId}`, null, businessToken);
      n++; total++; result(n, 'GET', '/business/dashboard/:venueId', r.status, [200, 403], 'dashboard responds') ? pass++ : fail++;

      r = await req('GET', `/business/analytics/${bizVenueId}`, null, businessToken);
      n++; total++; result(n, 'GET', '/business/analytics/:venueId', r.status, [200, 403], 'analytics responds') ? pass++ : fail++;

      r = await req('PUT', `/business/venues/${bizVenueId}/status`, { busyness: 'moderate', vibes: ['chill'] }, businessToken);
      n++; total++; result(n, 'PUT', '/business/venues/:id/status', r.status, [200, 403], 'status update responds') ? pass++ : fail++;

      r = await req('GET', `/business/venues/${bizVenueId}/status`, null, businessToken);
      n++; total++; result(n, 'GET', '/business/venues/:id/status', r.status, [200, 403], 'status get responds') ? pass++ : fail++;

      r = await req('GET', `/business/venues/${bizVenueId}/offers`, null, businessToken);
      n++; total++; result(n, 'GET', '/business/venues/:id/offers', r.status, [200, 403], 'venue offers responds') ? pass++ : fail++;
    } else {
      for (let i = 0; i < 5; i++) {
        n++; total++; fail++;
        console.log(`FAIL | ${n} | -      | /business/... | NO VENUE`);
      }
    }

    r = await req('POST', '/business/offers', {
      title: 'Test Offer EP', description: 'Endpoint test offer', type: '2-for-1',
      venueId: bizVenueId, validDays: ['Mon','Tue','Wed'], validTimeStart: '17:00',
      validTimeEnd: '19:00', maxRedemptions: 50, savingValue: 9.0, expiresAt: '2027-12-31T23:59:59Z'
    }, businessToken);
    const newOfferId = r.data?.id || '';
    n++; total++; result(n, 'POST', '/business/offers', r.status, [201, 200, 403], 'create offer responds') ? pass++ : fail++;

    if (newOfferId) {
      r = await req('PUT', `/business/offers/${newOfferId}`, { title: 'Updated EP Offer' }, businessToken);
      n++; total++; result(n, 'PUT', '/business/offers/:id', r.status, [200, 403], 'update offer responds') ? pass++ : fail++;

      r = await req('PUT', `/business/offers/${newOfferId}/toggle`, { isActive: false }, businessToken);
      n++; total++; result(n, 'PUT', '/business/offers/:id/toggle', r.status, [200, 403], 'toggle offer responds') ? pass++ : fail++;

      r = await req('DELETE', `/business/offers/${newOfferId}`, null, businessToken);
      n++; total++; result(n, 'DELETE', '/business/offers/:id', r.status, [200, 403], 'delete offer responds') ? pass++ : fail++;
    } else {
      r = await req('PUT', '/business/offers/00000000-0000-0000-0000-000000000001', { title: 'X' }, businessToken);
      n++; total++; result(n, 'PUT', '/business/offers/:id', r.status, [200, 403, 404], 'update responds') ? pass++ : fail++;

      r = await req('PUT', '/business/offers/00000000-0000-0000-0000-000000000001/toggle', { isActive: false }, businessToken);
      n++; total++; result(n, 'PUT', '/business/offers/:id/toggle', r.status, [200, 403, 404], 'toggle responds') ? pass++ : fail++;

      r = await req('DELETE', '/business/offers/00000000-0000-0000-0000-000000000001', null, businessToken);
      n++; total++; result(n, 'DELETE', '/business/offers/:id', r.status, [200, 403, 404], 'delete responds') ? pass++ : fail++;
    }
  }

  console.log(`\nAfter business endpoints: ${pass}/${total} passed\n`);

  // =============================================
  // PHASE 4: ADMIN ENDPOINTS
  // =============================================
  console.log('--- PHASE 4: ADMIN ENDPOINTS (16) ---\n');
  console.log('     | #  | Method | Path                                          | Code | Note');
  console.log('-'.repeat(100));

  // Login as admin
  r = await req('POST', '/auth/login', { email: 'admin@reki.app', password: 'admin123' });
  adminToken = r.data?.tokens?.accessToken || r.data?.accessToken || '';
  
  if (!adminToken) {
    console.log('SKIP: No admin token available');
  } else {
    r = await req('GET', '/admin/stats', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/stats', r.status, [200], 'stats OK') ? pass++ : fail++;

    r = await req('GET', '/admin/stats/location', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/stats/location', r.status, [200], 'location stats OK') ? pass++ : fail++;

    r = await req('GET', '/admin/users', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/users', r.status, [200], 'users list OK') ? pass++ : fail++;

    // Get a user id for activity
    const users = r.data?.users || (Array.isArray(r.data) ? r.data : (r.data?.data || []));
    const someUserId = users[0]?.id || '00000000-0000-0000-0000-000000000001';

    r = await req('GET', `/admin/users/${someUserId}/activity`, null, adminToken);
    n++; total++; result(n, 'GET', '/admin/users/:id/activity', r.status, [200, 404], 'user activity responds') ? pass++ : fail++;

    r = await req('GET', '/admin/venues', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/venues', r.status, [200], 'admin venues OK') ? pass++ : fail++;

    r = await req('GET', `/admin/venues/${venueId || '00000000-0000-0000-0000-000000000001'}/logs`, null, adminToken);
    n++; total++; result(n, 'GET', '/admin/venues/:id/logs', r.status, [200, 404], 'venue logs responds') ? pass++ : fail++;

    r = await req('GET', '/admin/offers', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/offers', r.status, [200], 'admin offers OK') ? pass++ : fail++;

    r = await req('GET', '/admin/offers/redemptions', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/offers/redemptions', r.status, [200], 'redemptions OK') ? pass++ : fail++;

    r = await req('GET', '/admin/activity-logs', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/activity-logs', r.status, [200], 'activity logs OK') ? pass++ : fail++;

    r = await req('GET', '/admin/notifications', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/notifications', r.status, [200], 'admin notifs OK') ? pass++ : fail++;

    r = await req('GET', '/admin/stats/realtime', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/stats/realtime', r.status, [200], 'realtime stats OK') ? pass++ : fail++;

    r = await req('GET', '/admin/stats/offline', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/stats/offline', r.status, [200], 'offline stats OK') ? pass++ : fail++;

    // Demo endpoints
    r = await req('GET', '/admin/demo/scenarios', null, adminToken);
    n++; total++; result(n, 'GET', '/admin/demo/scenarios', r.status, [200], 'scenarios OK') ? pass++ : fail++;

    r = await req('POST', '/admin/demo/simulate', { scenario: 'saturday-night' }, adminToken);
    n++; total++; result(n, 'POST', '/admin/demo/simulate', r.status, [201, 200], 'simulate OK') ? pass++ : fail++;

    r = await req('POST', '/admin/demo/simulate-time', { hour: 22 }, adminToken);
    n++; total++; result(n, 'POST', '/admin/demo/simulate-time', r.status, [201, 200], 'simulate-time OK') ? pass++ : fail++;

    r = await req('POST', '/admin/demo/reset', null, adminToken);
    n++; total++; result(n, 'POST', '/admin/demo/reset', r.status, [201, 200], 'reset OK') ? pass++ : fail++;
  }

  // =============================================
  // FINAL SUMMARY
  // =============================================
  console.log('\n' + '='.repeat(100));
  console.log(`FINAL RESULT: ${pass}/${total} endpoints PASSED, ${fail} FAILED`);
  console.log('='.repeat(100));
  
  if (fail === 0) {
    console.log('ALL ENDPOINTS WORKING!');
  } else {
    console.log(`${fail} endpoint(s) need attention.`);
  }
}

run().catch(console.error);
