// Test GUEST role endpoints and verify restrictions
const BASE = 'http://localhost:3000';
const results = [];
let token = null;
let venueId = null;
let offerId = null;

function log(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? '  →  ' + detail : ''}`);
  results.push({ label, ok, detail });
}
async function call(method, path, { body, auth } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, ok: res.ok, data };
}
async function step(label, fn) {
  try { const { ok, detail } = await fn(); log(label, ok, detail); }
  catch (e) { log(label, false, 'EX: ' + e.message); }
}

(async () => {
  console.log('\n━━━ GUEST ENDPOINT TESTS ━━━\n');

  console.log('─── Auth ───');
  await step('POST /auth/guest (create guest session)', async () => {
    const r = await call('POST', '/auth/guest');
    if (r.ok) token = r.data.tokens?.accessToken;
    return { ok: r.ok && !!token, detail: `role=${r.data?.user?.role} id=${r.data?.user?.id?.slice(0,8)}` };
  });
  if (!token) { console.log('No guest token'); return; }

  console.log('\n─── Allowed (browse-only) ───');
  await step('GET /venues (discover list)', async () => {
    const r = await call('GET', '/venues?limit=20', { auth: token });
    const list = r.data?.venues || r.data?.data || [];
    if (list.length) venueId = list[0].id;
    return { ok: r.ok && list.length > 0, detail: `count=${list.length}` };
  });

  // Find a venue that has offers by scanning venue details
  if (venueId) {
    const listRes = await call('GET', '/venues?limit=20', { auth: token });
    const list = listRes.data?.venues || [];
    for (const v of list) {
      const d = await call('GET', `/venues/${v.id}`, { auth: token });
      const offers = d.data?.offers || [];
      if (offers.length) { venueId = v.id; offerId = offers[0].id; break; }
    }
  }

  if (venueId) {
    await step('GET /venues/:id (detail)', async () => {
      const r = await call('GET', `/venues/${venueId}`, { auth: token });
      return { ok: r.ok, detail: `name=${r.data?.name} offers=${r.data?.offers?.length || 0}` };
    });
  }

  await step('GET /users/preferences (guest read allowed)', async () => {
    const r = await call('GET', '/users/preferences', { auth: token });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  console.log('\n─── Restricted (expect 403) ───');

  await step('POST /users/saved-venues/:venueId → 403', async () => {
    const r = await call('POST', `/users/saved-venues/${venueId}`, { auth: token });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('GET /users/saved-venues → 403', async () => {
    const r = await call('GET', '/users/saved-venues', { auth: token });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('PUT /users/preferences → 403', async () => {
    const r = await call('PUT', '/users/preferences', { auth: token, body: { vibes: ['Chill'] } });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  if (offerId) {
    await step('POST /offers/:id/claim → 403', async () => {
      const r = await call('POST', `/offers/${offerId}/claim`, { auth: token });
      return { ok: r.status === 403, detail: `status=${r.status}` };
    });
    await step('POST /offers/:id/redeem → 403', async () => {
      const r = await call('POST', `/offers/${offerId}/redeem`, { auth: token, body: { voucherCode: 'X' } });
      return { ok: r.status === 403, detail: `status=${r.status}` };
    });
    await step('POST /offers/:id/wallet-pass → 403', async () => {
      const r = await call('POST', `/offers/${offerId}/wallet-pass`, { auth: token });
      return { ok: r.status === 403, detail: `status=${r.status}` };
    });
  }

  await step('GET /notifications → 403', async () => {
    const r = await call('GET', '/notifications', { auth: token });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('POST /users/location → 403', async () => {
    const r = await call('POST', '/users/location', {
      auth: token, body: { latitude: 53.48, longitude: -2.24 },
    });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('PUT /users/location-consent → 403', async () => {
    const r = await call('PUT', '/users/location-consent', { auth: token, body: { consent: true } });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('POST /sync/queue → 403', async () => {
    const r = await call('POST', '/sync/queue', {
      auth: token,
      body: { actionType: 'save_venue', venueId: venueId || '00000000-0000-0000-0000-000000000000' },
    });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  await step('PUT /users/state → 403', async () => {
    const r = await call('PUT', '/users/state', { auth: token, body: { state: {} } });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  if (venueId) {
    await step('POST /venues/:id/vibe-check → 403', async () => {
      const r = await call('POST', `/venues/${venueId}/vibe-check`, { auth: token, body: { score: 4 } });
      return { ok: r.status === 403, detail: `status=${r.status}` };
    });
  }

  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n━━━ SUMMARY: ${pass}/${results.length} passed, ${fail} failed ━━━`);
  if (fail) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗ ' + r.label + ' — ' + r.detail));
  }
})();
