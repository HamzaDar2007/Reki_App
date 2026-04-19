// Test USER role endpoints end-to-end
const BASE = 'http://localhost:3000';

const results = [];
let token = null;
let userId = null;
let venueId = null;
let offerId = null;
let notifId = null;
let deviceId = null;
let voucherCode = null;

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? '  →  ' + detail : ''}`);
  results.push({ label, ok, detail });
}

async function call(method, path, { body, auth } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, ok: res.ok, data };
}

async function step(label, fn) {
  try {
    const { ok, detail } = await fn();
    log(label, ok, detail);
  } catch (e) {
    log(label, false, 'EXCEPTION: ' + e.message);
  }
}

(async () => {
  console.log('\n━━━ USER ENDPOINT TESTS ━━━\n');

  const email = `testuser_${Date.now()}@reki.test`;
  await step('POST /auth/register (setup)', async () => {
    const r = await call('POST', '/auth/register', {
      body: { email, password: 'Test1234', name: 'Test User' },
    });
    if (r.ok) { token = r.data.tokens?.accessToken; userId = r.data.user?.id; }
    return { ok: r.ok && !!token, detail: `status=${r.status} userId=${userId?.slice(0,8)}` };
  });

  await step('GET /venues?city=manchester (setup)', async () => {
    const r = await call('GET', '/venues?city=manchester&limit=5');
    venueId = r.data?.venues?.[0]?.id;
    return { ok: !!venueId, detail: `venueId=${venueId?.slice(0,8)}` };
  });

  await step('GET /venues (find offer available NOW)', async () => {
    const r = await call('GET', '/venues?city=manchester&limit=15');
    outer: for (const v of r.data?.venues || []) {
      for (const o of v.offers || []) {
        const d = await call('GET', `/offers/${o.id}`);
        if (d.data?.isAvailableNow || d.data?.offer?.isAvailableNow) {
          offerId = o.id;
          break outer;
        }
      }
    }
    return { ok: !!offerId, detail: `offerId=${offerId?.slice(0,8) || 'NONE'}` };
  });

  console.log('\n─── Preferences ───');
  await step('POST /users/preferences', async () => {
    const r = await call('POST', '/users/preferences', {
      auth: token, body: { vibes: ['Chill', 'Party'], music: ['House', 'R&B'] },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('GET /users/preferences', async () => {
    const r = await call('GET', '/users/preferences', { auth: token });
    return { ok: r.ok, detail: `vibes=${r.data?.preferences?.vibes?.length}` };
  });
  await step('PUT /users/preferences', async () => {
    const r = await call('PUT', '/users/preferences', {
      auth: token, body: { vibes: ['Chill'], music: ['House'] },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  console.log('\n─── Saved Venues ───');
  await step(`POST /users/saved-venues/:id`, async () => {
    const r = await call('POST', `/users/saved-venues/${venueId}`, { auth: token });
    return { ok: r.ok, detail: `saved=${r.data?.saved}` };
  });
  await step('GET /users/saved-venues', async () => {
    const r = await call('GET', '/users/saved-venues', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.venues?.length ?? r.data?.count ?? 0}` };
  });
  await step('DELETE /users/saved-venues/:id', async () => {
    const r = await call('DELETE', `/users/saved-venues/${venueId}`, { auth: token });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await call('POST', `/users/saved-venues/${venueId}`, { auth: token });

  console.log('\n─── Offers ───');
  if (offerId) {
    await step('POST /offers/:id/claim', async () => {
      const r = await call('POST', `/offers/${offerId}/claim`, { auth: token });
      voucherCode = r.data?.voucherCode;
      return { ok: r.ok, detail: `voucher=${voucherCode}` };
    });
    await step('POST /offers/:id/redeem', async () => {
      const r = await call('POST', `/offers/${offerId}/redeem`, {
        auth: token, body: { voucherCode },
      });
      return { ok: r.ok, detail: `status=${r.data?.status} saving=${r.data?.savingValue}` };
    });
    await step('POST /offers/:id/wallet-pass', async () => {
      const r = await call('POST', `/offers/${offerId}/wallet-pass`, { auth: token });
      return { ok: r.ok, detail: `status=${r.status}` };
    });
  }
  await step('GET /users/redemptions', async () => {
    const r = await call('GET', '/users/redemptions', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.redemptions?.length ?? r.data?.count ?? 0}` };
  });

  console.log('\n─── Notifications ───');
  await step('GET /notifications', async () => {
    const r = await call('GET', '/notifications', { auth: token });
    const first = r.data?.today?.[0] || r.data?.earlier?.[0] || r.data?.notifications?.[0];
    notifId = first?.id;
    return { ok: r.ok, detail: `today=${r.data?.today?.length ?? 0}` };
  });
  if (notifId) {
    await step('PUT /notifications/:id/read', async () => {
      const r = await call('PUT', `/notifications/${notifId}/read`, { auth: token });
      return { ok: r.ok, detail: `status=${r.status}` };
    });
  }
  await step('PUT /notifications/read-all', async () => {
    const r = await call('PUT', '/notifications/read-all', { auth: token });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  console.log('\n─── Notification Preferences ───');
  await step('PUT /users/notification-preferences', async () => {
    const r = await call('PUT', '/users/notification-preferences', {
      auth: token,
      body: { vibeAlerts: true, offerAlerts: true, quietHoursStart: '22:00', quietHoursEnd: '09:00' },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('GET /users/notification-preferences', async () => {
    const r = await call('GET', '/users/notification-preferences', { auth: token });
    return { ok: r.ok, detail: `vibeAlerts=${r.data?.vibeAlerts}` };
  });

  console.log('\n─── Devices ───');
  await step('POST /devices/register', async () => {
    const r = await call('POST', '/devices/register', {
      auth: token,
      body: { fcmToken: 'fcm-' + Date.now(), platform: 'ios', deviceId: 'dev-' + Date.now(), appVersion: '1.0.4' },
    });
    deviceId = r.data?.deviceId || r.data?.device?.id || r.data?.id;
    return { ok: r.ok, detail: `deviceId=${deviceId?.slice(0,8)}` };
  });
  if (deviceId) {
    await step('DELETE /devices/:id', async () => {
      const r = await call('DELETE', `/devices/${deviceId}`, { auth: token });
      return { ok: r.ok, detail: `status=${r.status}` };
    });
  }

  console.log('\n─── Location ───');
  await step('POST /users/location', async () => {
    const r = await call('POST', '/users/location', {
      auth: token, body: { lat: 53.4808, lng: -2.2426, accuracy: 10 },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('PUT /users/location-consent', async () => {
    const r = await call('PUT', '/users/location-consent', {
      auth: token, body: { locationEnabled: true, backgroundLocationEnabled: false },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  console.log('\n─── Geofence ───');
  await step('POST /geofence/check', async () => {
    const r = await call('POST', '/geofence/check', {
      auth: token, body: { lat: 53.4808, lng: -2.2426 },
    });
    return { ok: r.ok, detail: `nearby=${r.data?.nearbyVenues?.length}` };
  });

  console.log('\n─── Sync ───');
  const since = new Date(Date.now() - 86400000).toISOString();
  await step('GET /venues/sync', async () => {
    const r = await call('GET', `/venues/sync?since=${since}`, { auth: token });
    return { ok: r.ok, detail: `updated=${r.data?.updated?.length}` };
  });
  await step('GET /notifications/sync', async () => {
    const r = await call('GET', `/notifications/sync?since=${since}`, { auth: token });
    return { ok: r.ok, detail: `updated=${r.data?.updated?.length}` };
  });
  await step('GET /offers/sync', async () => {
    const r = await call('GET', `/offers/sync?since=${since}`, { auth: token });
    return { ok: r.ok, detail: `updated=${r.data?.updated?.length}` };
  });
  await step('POST /sync/queue', async () => {
    const r = await call('POST', '/sync/queue', {
      auth: token,
      body: {
        deviceId: 'd-test',
        actions: [{ id: 'a1', type: 'VENUE_VIEW', venueId, offlineTimestamp: new Date().toISOString() }],
      },
    });
    return { ok: r.ok, detail: `results=${r.data?.results?.length}` };
  });
  await step('GET /sync/status', async () => {
    const r = await call('GET', '/sync/status?deviceId=d-test', { auth: token });
    return { ok: r.ok, detail: `pending=${r.data?.pendingActions}` };
  });

  console.log('\n─── State ───');
  await step('PUT /users/state', async () => {
    const r = await call('PUT', '/users/state', {
      auth: token,
      body: { preferences: { vibes: ['Chill'], music: ['House'] }, lastSyncAt: new Date().toISOString() },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('GET /users/state', async () => {
    const r = await call('GET', '/users/state', { auth: token });
    return { ok: r.ok, detail: `keys=${Object.keys(r.data || {}).length}` };
  });

  console.log('\n─── Vibe Check (new) ───');
  await step('POST /venues/:id/vibe-check', async () => {
    const r = await call('POST', `/venues/${venueId}/vibe-check`, {
      auth: token, body: { score: 5 },
    });
    return { ok: r.ok, detail: `score=${r.data?.vibeCheckScore} count=${r.data?.responseCount}` };
  });

  console.log('\n─── Live SSE ───');
  for (const path of ['/live/feed?city=manchester', `/live/venue/${venueId}`, '/live/map?city=manchester']) {
    await step(`GET ${path} (SSE)`, async () => {
      const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
      const ct = res.headers.get('content-type') || '';
      res.body?.cancel();
      return { ok: ct.includes('event-stream'), detail: `content-type=${ct.split(';')[0]}` };
    });
  }

  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log(`\n━━━ SUMMARY: ${pass}/${results.length} passed, ${fail} failed ━━━`);
  if (fail) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')));
  }
})();
