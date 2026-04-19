// Detailed debug - capture server error details
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

  // 1. Devices register - try with proper enum value
  console.log('=== POST /devices/register ===');
  let r = await req('POST', '/devices/register', {
    fcmToken: 'debug-fcm-token-' + Date.now(),
    platform: 'ios',
    deviceId: 'debug-device-' + Date.now()
  }, token);
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body}`);

  // 2. Check if table exists by querying DB directly via admin endpoint
  console.log('\n=== GET /venues/sync (no since param) ===');
  r = await req('GET', '/venues/sync', null, token);
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body}`);

  console.log('\n=== GET /venues/sync (with since) ===');
  r = await req('GET', '/venues/sync?since=2026-04-17T00:00:00.000Z', null, token);
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body}`);
  
  console.log('\n=== GET /offers/sync (with since) ===');
  r = await req('GET', '/offers/sync?since=2026-04-17T00:00:00.000Z', null, token);
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body}`);

  // 3. Get /users/notification-preferences
  console.log('\n=== GET /users/notification-preferences ===');
  r = await req('GET', '/users/notification-preferences', null, token);
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body}`);
}

run().catch(console.error);
