// Test BUSINESS role endpoints end-to-end
const BASE = 'http://localhost:3000';
const results = [];
let token = null;
let venueId = null;
let offerId = null;

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
  console.log('\n━━━ BUSINESS ENDPOINT TESTS ━━━\n');

  console.log('─── Auth ───');

  // 1. Register a new business (fresh venue)
  const bizEmail = `biztest_${Date.now()}@reki.test`;
  await step('POST /auth/business/register', async () => {
    const r = await call('POST', '/auth/business/register', {
      body: {
        email: bizEmail,
        password: 'BizPass123',
        name: 'Test Biz Owner',
        phone: '+447111000001',
        venueName: 'Test Venue ' + Date.now(),
        venueCategory: 'bar',
        venueAddress: '100 Test St, Manchester',
      },
    });
    return { ok: r.ok, detail: `status=${r.status} ${r.data?.status || r.data?.message?.slice(0,40)}` };
  });

  // 2. Forgot password
  await step('POST /auth/business/forgot-password', async () => {
    const r = await call('POST', '/auth/business/forgot-password', {
      body: { email: bizEmail },
    });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  // 3. Login with seeded account (manager@alberts.com → Albert's Schloss)
  await step('POST /auth/business/login', async () => {
    const r = await call('POST', '/auth/business/login', {
      body: { email: 'manager@alberts.com', password: 'business123' },
    });
    if (r.ok) {
      token = r.data.tokens?.accessToken;
      venueId = r.data.user?.venue?.id || r.data.user?.venueId;
    }
    return { ok: r.ok && !!token, detail: `venueId=${venueId?.slice(0,8)}` };
  });

  if (!token) { console.log('Cannot continue — no business token'); return; }

  console.log('\n─── Dashboard ───');
  await step('GET /business/dashboard/:venueId', async () => {
    const r = await call('GET', `/business/dashboard/${venueId}`, { auth: token });
    return { ok: r.ok, detail: `venue=${r.data?.venue?.name} busy=${r.data?.venue?.busyness?.percentage}%` };
  });

  await step('GET /business/analytics/:venueId?period=today', async () => {
    const r = await call('GET', `/business/analytics/${venueId}?period=today`, { auth: token });
    return { ok: r.ok, detail: `views=${r.data?.views?.total} redemptions=${r.data?.redemptions?.total}` };
  });

  console.log('\n─── Venue Status ───');
  await step('PUT /business/venues/:id/status (busy, vibe alert triggers)', async () => {
    const r = await call('PUT', `/business/venues/${venueId}/status`, {
      auth: token,
      body: { busyness: 'busy', vibes: ['High Energy', 'Live Music'] },
    });
    return { ok: r.ok, detail: `busyness=${r.data?.busyness?.percentage}% vibes=${r.data?.vibe?.tags?.length}` };
  });

  await step('GET /business/venues/:id/status', async () => {
    const r = await call('GET', `/business/venues/${venueId}/status`, { auth: token });
    return { ok: r.ok, detail: `level=${r.data?.busyness?.level} %=${r.data?.busyness?.percentage}` };
  });

  console.log('\n─── Offers CRUD ───');
  await step('GET /business/venues/:id/offers', async () => {
    const r = await call('GET', `/business/venues/${venueId}/offers`, { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.data?.length ?? r.data?.offers?.length ?? r.data?.length ?? 0}` };
  });

  await step('POST /business/offers (create)', async () => {
    const r = await call('POST', '/business/offers', {
      auth: token,
      body: {
        venueId,
        title: 'Test Offer ' + Date.now(),
        description: 'Automated test offer',
        type: '2-for-1',
        validDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        validTimeStart: '00:00',
        validTimeEnd: '23:59',
        maxRedemptions: 50,
        savingValue: 9.5,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
    });
    offerId = r.data?.offer?.id || r.data?.id;
    return { ok: r.ok, detail: `offerId=${offerId?.slice(0,8)}` };
  });

  if (offerId) {
    await step('PUT /business/offers/:id (update)', async () => {
      const r = await call('PUT', `/business/offers/${offerId}`, {
        auth: token,
        body: { title: 'Test Offer UPDATED', description: 'Updated desc' },
      });
      return { ok: r.ok, detail: `title=${r.data?.offer?.title || r.data?.title}` };
    });

    await step('PUT /business/offers/:id/toggle (off)', async () => {
      const r = await call('PUT', `/business/offers/${offerId}/toggle`, {
        auth: token, body: { isActive: false },
      });
      return { ok: r.ok, detail: `isActive=${r.data?.offer?.isActive ?? r.data?.isActive}` };
    });

    await step('DELETE /business/offers/:id', async () => {
      const r = await call('DELETE', `/business/offers/${offerId}`, { auth: token });
      return { ok: r.ok, detail: `status=${r.status}` };
    });
  }

  // Security test: admin token / user token should NOT access business routes
  console.log('\n─── Security (role isolation) ───');
  // Try as regular user
  const userReg = await call('POST', '/auth/register', {
    body: { email: `secuser_${Date.now()}@t.com`, password: 'Test1234', name: 'U' },
  });
  const userToken = userReg.data?.tokens?.accessToken;
  await step('GET /business/dashboard/:id with USER token → 403', async () => {
    const r = await call('GET', `/business/dashboard/${venueId}`, { auth: userToken });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log(`\n━━━ SUMMARY: ${pass}/${results.length} passed, ${fail} failed ━━━`);
  if (fail) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')));
  }
})();
