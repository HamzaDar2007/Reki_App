// Test BUSINESS endpoints with separate venue management
const BASE = 'http://localhost:3000';

const results = [];
let token = null;
let businessUserId = null;
let venueId1 = null;
let venueId2 = null;

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
  console.log('\n━━━ BUSINESS SEPARATE VENUE MANAGEMENT TESTS ━━━\n');

  const email = `business_${Date.now()}@reki.test`;

  // ─── REGISTRATION (No venue) ───
  console.log('\n─── Registration (Account Only) ───');
  await step('POST /auth/business/register', async () => {
    const r = await call('POST', '/auth/business/register', {
      body: {
        email,
        password: 'Business123',
        name: 'John Doe',
        phone: '+447700900000',
      },
    });
    return { ok: r.ok, detail: `status=${r.status} message="${r.data?.message}"` };
  });

  // ─── LOGIN ───
  console.log('\n─── Login ───');
  await step('POST /auth/business/login', async () => {
    const r = await call('POST', '/auth/business/login', {
      body: { email, password: 'Business123' },
    });
    if (r.ok) {
      token = r.data.tokens?.accessToken;
      businessUserId = r.data.user?.id;
    }
    return {
      ok: r.ok && !!token,
      detail: `userId=${businessUserId?.slice(0, 8)} venues=${r.data.user?.venues?.length || 0}`,
    };
  });

  // ─── CREATE VENUE 1 ───
  console.log('\n─── Create Venues ───');
  await step('POST /business/venues (Venue 1)', async () => {
    const r = await call('POST', '/business/venues', {
      auth: token,
      body: {
        name: 'The Blue Moon Bar',
        address: '123 Oxford Road, Manchester',
        city: 'Manchester',
        area: 'City Centre',
        category: 'BAR',
        lat: 53.4808,
        lng: -2.2426,
        priceLevel: 2,
        openingHours: '18:00',
        closingTime: '02:00',
        tags: ['Chill', 'Party'],
        images: ['https://example.com/image1.jpg'],
      },
    });
    if (r.ok) venueId1 = r.data.venue?.id;
    return { ok: r.ok, detail: `venueId=${venueId1?.slice(0, 8)} name="${r.data.venue?.name}"` };
  });

  await step('POST /business/venues (Venue 2)', async () => {
    const r = await call('POST', '/business/venues', {
      auth: token,
      body: {
        name: 'Red Dragon Club',
        address: '456 Deansgate, Manchester',
        city: 'Manchester',
        area: 'Deansgate',
        category: 'CLUB',
        lat: 53.4750,
        lng: -2.2500,
        priceLevel: 3,
        openingHours: '22:00',
        closingTime: '04:00',
        tags: ['High Energy', 'Party'],
      },
    });
    if (r.ok) venueId2 = r.data.venue?.id;
    return { ok: r.ok, detail: `venueId=${venueId2?.slice(0, 8)} name="${r.data.venue?.name}"` };
  });

  // ─── GET MY VENUES ───
  console.log('\n─── Get My Venues ───');
  await step('GET /business/venues', async () => {
    const r = await call('GET', '/business/venues', { auth: token });
    return { ok: r.ok, detail: `total=${r.data?.total} venues=${r.data?.venues?.length}` };
  });

  // ─── UPDATE VENUE ───
  console.log('\n─── Update Venue ───');
  if (venueId1) {
    await step('PUT /business/venues/:id', async () => {
      const r = await call('PUT', `/business/venues/${venueId1}`, {
        auth: token,
        body: {
          name: 'The Blue Moon Bar (Updated)',
          priceLevel: 3,
        },
      });
      return { ok: r.ok, detail: `status=${r.status}` };
    });
  }

  // ─── VENUE STATUS UPDATE ───
  console.log('\n─── Venue Status Management ───');
  if (venueId1) {
    await step('PUT /business/venues/:id/status', async () => {
      const r = await call('PUT', `/business/venues/${venueId1}/status`, {
        auth: token,
        body: {
          busyness: 'busy',
          vibes: ['Party', 'Live Music'],
        },
      });
      return { ok: r.ok, detail: `busyness=${r.data?.venue?.busyness?.level}` };
    });

    await step('GET /business/venues/:id/status', async () => {
      const r = await call('GET', `/business/venues/${venueId1}/status`, { auth: token });
      return {
        ok: r.ok,
        detail: `level=${r.data?.busyness?.level} vibes=${r.data?.vibe?.tags?.length}`,
      };
    });
  }

  // ─── DASHBOARD ───
  console.log('\n─── Dashboard ───');
  if (venueId1) {
    await step('GET /business/dashboard/:venueId', async () => {
      const r = await call('GET', `/business/dashboard/${venueId1}`, { auth: token });
      return {
        ok: r.ok,
        detail: `venue="${r.data?.venue?.name}" busyness=${r.data?.stats?.liveBusyness?.percentage}%`,
      };
    });
  }

  // ─── OFFERS ───
  console.log('\n─── Offers Management ───');
  if (venueId1) {
    let offerId = null;

    await step('POST /business/offers', async () => {
      const r = await call('POST', '/business/offers', {
        auth: token,
        body: {
          venueId: venueId1,
          title: 'Happy Hour 2-for-1',
          description: 'Buy one get one free on all drinks',
          type: 'TWO_FOR_ONE',
          validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          validTimeStart: '17:00',
          validTimeEnd: '19:00',
          maxRedemptions: 100,
          savingValue: 5.5,
          expiresAt: '2026-12-31',
        },
      });
      if (r.ok) offerId = r.data.offer?.id;
      return { ok: r.ok, detail: `offerId=${offerId?.slice(0, 8)}` };
    });

    await step('GET /business/venues/:id/offers', async () => {
      const r = await call('GET', `/business/venues/${venueId1}/offers`, { auth: token });
      return {
        ok: r.ok,
        detail: `active=${r.data?.activeDeals?.length} total=${r.data?.pagination?.total}`,
      };
    });

    if (offerId) {
      await step('PUT /business/offers/:id/toggle', async () => {
        const r = await call('PUT', `/business/offers/${offerId}/toggle`, {
          auth: token,
          body: { isActive: false },
        });
        return { ok: r.ok, detail: `isActive=${r.data?.offer?.isActive}` };
      });
    }
  }

  // ─── DELETE VENUE ───
  console.log('\n─── Delete Venue ───');
  if (venueId2) {
    await step('DELETE /business/venues/:id', async () => {
      const r = await call('DELETE', `/business/venues/${venueId2}`, { auth: token });
      return { ok: r.ok, detail: `status=${r.status}` };
    });

    await step('GET /business/venues (after delete)', async () => {
      const r = await call('GET', '/business/venues', { auth: token });
      return { ok: r.ok, detail: `total=${r.data?.total} (should be 1)` };
    });
  }

  // ─── SUMMARY ───
  console.log('\n━━━ TEST SUMMARY ━━━\n');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ❌ ${r.label} → ${r.detail}`));
  }
})();
