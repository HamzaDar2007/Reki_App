// Debug the 7 failing endpoints
const http = require('http');
const BASE = 'http://localhost:3000';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  // Login
  const login = await req('POST', '/auth/login', { email: 'demo@reki.app', password: 'demo1234' });
  const token = JSON.parse(login.body).tokens.accessToken;
  console.log('Token OK:', !!token);

  console.log('\n=== 1. POST /devices/register ===');
  let r = await req('POST', '/devices/register', { deviceId: 'dbg-001', platform: 'ios', fcmToken: 'fake-fcm' }, token);
  console.log('Status:', r.status);
  console.log('Body:', r.body.substring(0, 500));

  console.log('\n=== 2. GET /venues/sync ===');
  r = await req('GET', '/venues/sync?since=2026-04-17T00:00:00.000Z', null, token);
  console.log('Status:', r.status);
  console.log('Body:', r.body.substring(0, 500));

  console.log('\n=== 3. GET /offers/sync ===');
  r = await req('GET', '/offers/sync?since=2026-04-17T00:00:00.000Z', null, token);
  console.log('Status:', r.status);
  console.log('Body:', r.body.substring(0, 500));

  console.log('\n=== 4. PUT /users/location-consent ===');
  r = await req('PUT', '/users/location-consent', { locationEnabled: true }, token);
  console.log('Status:', r.status);
  console.log('Body:', r.body.substring(0, 500));
}

run().catch(console.error);
