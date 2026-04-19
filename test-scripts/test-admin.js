// Test ADMIN role endpoints
const BASE = 'http://localhost:3000';
const results = [];
let token = null;
let sampleUserId = null;
let sampleVenueId = null;

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
  console.log('\n━━━ ADMIN ENDPOINT TESTS ━━━\n');

  console.log('─── Auth ───');
  await step('POST /auth/login (admin@reki.app)', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'admin@reki.app', password: 'admin123' } });
    if (r.ok) token = r.data.tokens?.accessToken;
    return { ok: r.ok && !!token, detail: `role=${r.data?.user?.role}` };
  });
  if (!token) { console.log('No admin token'); return; }

  console.log('\n─── Stats ───');
  await step('GET /admin/stats', async () => {
    const r = await call('GET', '/admin/stats', { auth: token });
    return { ok: r.ok, detail: `users=${r.data?.users?.total ?? r.data?.totalUsers} venues=${r.data?.venues?.total ?? r.data?.totalVenues}` };
  });
  await step('GET /admin/stats/location', async () => {
    const r = await call('GET', '/admin/stats/location', { auth: token });
    return { ok: r.ok, detail: `keys=${Object.keys(r.data || {}).slice(0,4).join(',')}` };
  });
  await step('GET /admin/stats/realtime', async () => {
    const r = await call('GET', '/admin/stats/realtime', { auth: token });
    return { ok: r.ok, detail: `keys=${Object.keys(r.data || {}).slice(0,4).join(',')}` };
  });
  await step('GET /admin/stats/offline', async () => {
    const r = await call('GET', '/admin/stats/offline', { auth: token });
    return { ok: r.ok, detail: `keys=${Object.keys(r.data || {}).slice(0,4).join(',')}` };
  });

  console.log('\n─── Users ───');
  await step('GET /admin/users', async () => {
    const r = await call('GET', '/admin/users?page=1&limit=5', { auth: token });
    const list = r.data?.data || r.data?.users || r.data;
    sampleUserId = Array.isArray(list) ? list[0]?.id : list?.[0]?.id;
    if (!sampleUserId && r.data?.data) sampleUserId = r.data.data[0]?.id;
    return { ok: r.ok, detail: `count=${Array.isArray(list) ? list.length : r.data?.data?.length ?? 0} total=${r.data?.total}` };
  });
  if (sampleUserId) {
    await step('GET /admin/users/:id/activity', async () => {
      const r = await call('GET', `/admin/users/${sampleUserId}/activity`, { auth: token });
      return { ok: r.ok, detail: `logins=${r.data?.totalLogins ?? r.data?.loginHistory?.length ?? 0}` };
    });
  }

  console.log('\n─── Venues ───');
  await step('GET /admin/venues', async () => {
    const r = await call('GET', '/admin/venues?page=1&limit=5', { auth: token });
    const list = r.data?.venues || r.data?.data || [];
    sampleVenueId = list[0]?.id;
    return { ok: r.ok, detail: `count=${list.length} total=${r.data?.total}` };
  });
  if (sampleVenueId) {
    await step('GET /admin/venues/:id/logs', async () => {
      const r = await call('GET', `/admin/venues/${sampleVenueId}/logs`, { auth: token });
      return { ok: r.ok, detail: `logs=${r.data?.length ?? r.data?.logs?.length ?? 0}` };
    });
  }

  console.log('\n─── Offers ───');
  await step('GET /admin/offers', async () => {
    const r = await call('GET', '/admin/offers?page=1&limit=5', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.data?.length ?? 0} total=${r.data?.total}` };
  });
  await step('GET /admin/offers/redemptions', async () => {
    const r = await call('GET', '/admin/offers/redemptions?page=1&limit=5', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.data?.length ?? 0}` };
  });

  console.log('\n─── Logs / Notifications ───');
  await step('GET /admin/activity-logs', async () => {
    const r = await call('GET', '/admin/activity-logs?page=1&limit=5', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.data?.length ?? 0}` };
  });
  await step('GET /admin/notifications', async () => {
    const r = await call('GET', '/admin/notifications?page=1&limit=5', { auth: token });
    return { ok: r.ok, detail: `count=${r.data?.data?.length ?? 0}` };
  });

  console.log('\n─── Demo ───');
  await step('GET /admin/demo/scenarios', async () => {
    const r = await call('GET', '/admin/demo/scenarios', { auth: token });
    return { ok: r.ok, detail: `scenarios=${r.data?.length ?? r.data?.scenarios?.length ?? 0}` };
  });
  await step('POST /admin/demo/simulate', async () => {
    const r = await call('POST', '/admin/demo/simulate', { auth: token, body: { scenario: 'saturday-night', hour: 22 } });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('POST /admin/demo/simulate-time', async () => {
    const r = await call('POST', '/admin/demo/simulate-time', { auth: token, body: { hour: 21 } });
    return { ok: r.ok, detail: `status=${r.status}` };
  });
  await step('POST /admin/demo/reset', async () => {
    const r = await call('POST', '/admin/demo/reset', { auth: token });
    return { ok: r.ok, detail: `status=${r.status}` };
  });

  console.log('\n─── Test Push ───');
  if (sampleUserId) {
    await step('POST /admin/test-push', async () => {
      const r = await call('POST', '/admin/test-push', {
        auth: token,
        body: { userId: sampleUserId, title: 'Admin test', body: 'From admin test script' },
      });
      return { ok: r.ok, detail: `sent=${r.data?.sent ?? r.data?.success ?? r.status}` };
    });
  }

  console.log('\n─── Security (role isolation) ───');
  // Non-admin user should get 403
  const userLogin = await call('POST', '/auth/login', { body: { email: 'demo@reki.app', password: 'demo1234' } });
  const userToken = userLogin.data?.tokens?.accessToken;
  await step('GET /admin/stats with USER token → 403', async () => {
    const r = await call('GET', '/admin/stats', { auth: userToken });
    return { ok: r.status === 403, detail: `status=${r.status}` };
  });

  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n━━━ SUMMARY: ${pass}/${results.length} passed, ${fail} failed ━━━`);
  if (fail) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.log('  ✗ ' + r.label + ' — ' + r.detail));
  }
})();
