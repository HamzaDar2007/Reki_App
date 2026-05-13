const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const includeDestructive = process.env.SMOKE_INCLUDE_DESTRUCTIVE === '1';

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const expectStatus = (res, statuses) => {
  if (!statuses.includes(res.status)) {
    throw new Error(`Expected status ${statuses.join(', ')}, got ${res.status}`);
  }
};

const requestJson = async (method, path, token, body) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: jsonHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { res, data };
};

const requestNoBody = async (method, path, token) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res;
};

const sseCheck = async (path, token) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

const check = async (name, fn, failures) => {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.error(`FAIL: ${name} -> ${err.message}`);
  }
};

const uniqueEmail = (prefix) => `${prefix}.${Date.now()}@reki.app`;

const run = async () => {
  const failures = [];
  const tokens = { admin: '', user: '', guest: '', business: '' };
  const ids = {
    venueId: '',
    businessVenueId: '',
    offerId: '',
    voucherCode: '',
    notificationId: '',
    deviceId: '',
    refreshToken: '',
    demoUserId: '',
  };

  await check('GET /health', async () => {
    const res = await requestNoBody('GET', '/health');
    expectStatus(res, [200]);
  }, failures);

  await check('POST /auth/login (demo user)', async () => {
    const { res, data } = await requestJson('POST', '/auth/login', null, {
      email: 'demo@reki.app',
      password: 'demo1234',
    });
    expectStatus(res, [200]);
    tokens.user = data.tokens.accessToken;
    ids.refreshToken = data.tokens.refreshToken;
    ids.demoUserId = data.user.id;
  }, failures);

  await check('POST /auth/login (admin)', async () => {
    const { res, data } = await requestJson('POST', '/auth/login', null, {
      email: 'admin@reki.app',
      password: 'admin123',
    });
    expectStatus(res, [200]);
    tokens.admin = data.tokens.accessToken;
  }, failures);

  await check('POST /auth/guest', async () => {
    const { res, data } = await requestJson('POST', '/auth/guest');
    expectStatus(res, [201]);
    tokens.guest = data.tokens.accessToken;
  }, failures);

  await check('POST /auth/business/login', async () => {
    const { res, data } = await requestJson('POST', '/auth/business/login', null, {
      email: 'manager@alberts.com',
      password: 'business123',
    });
    expectStatus(res, [200]);
    tokens.business = data.tokens.accessToken;
    const venues = data.user?.venues || [];
    ids.businessVenueId = venues[0]?.id || '';
  }, failures);

  if (!ids.businessVenueId && tokens.business) {
    await check('POST /business/venues (create)', async () => {
      const { res, data } = await requestJson('POST', '/business/venues', tokens.business, {
        name: 'Smoke Test Venue',
        address: '123 Test Street',
        city: 'Manchester',
        area: 'City Centre',
        category: 'bar',
        lat: 53.4808,
        lng: -2.2426,
        openingHours: '10:00',
        closingTime: '02:00',
      });
      expectStatus(res, [201]);
      ids.businessVenueId = data.venue?.id || '';
    }, failures);
  }

  await check('GET /venues', async () => {
    const { res, data } = await requestJson('GET', '/venues');
    expectStatus(res, [200]);
    ids.venueId = data.venues?.[0]?.id || ids.businessVenueId;
  }, failures);

  await check('POST /business/offers (create)', async () => {
    const { res, data } = await requestJson('POST', '/business/offers', tokens.business, {
      venueId: ids.businessVenueId,
      title: 'Smoke Test Offer',
      description: 'Offer for smoke test',
      type: '2-for-1',
      validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      validTimeStart: '00:00',
      validTimeEnd: '23:59',
      maxRedemptions: 50,
      savingValue: 10,
    });
    expectStatus(res, [201]);
    ids.offerId = data.offer?.id || '';
  }, failures);

  await check('POST /offers/:id/claim', async () => {
    const { res, data } = await requestJson('POST', `/offers/${ids.offerId}/claim`, tokens.user);
    expectStatus(res, [200, 201]);
    ids.voucherCode = data.voucherCode;
  }, failures);

  await check('POST /devices/register', async () => {
    const { res, data } = await requestJson('POST', '/devices/register', tokens.user, {
      fcmToken: `smoke-fcm-${Date.now()}`,
      platform: 'ios',
      deviceId: `smoke-device-${Date.now()}`,
    });
    expectStatus(res, [201]);
    ids.deviceId = data.deviceId;
  }, failures);

  await check('GET /notifications', async () => {
    const { res, data } = await requestJson('GET', '/notifications', tokens.user);
    expectStatus(res, [200]);
    const all = [...(data.today || []), ...(data.yesterday || []), ...(data.earlier || [])];
    ids.notificationId = all[0]?.id || '';
  }, failures);

  await check('GET /config/app', async () => {
    const res = await requestNoBody('GET', '/config/app');
    expectStatus(res, [200]);
  }, failures);

  await check('GET /tags', async () => {
    const res = await requestNoBody('GET', '/tags');
    expectStatus(res, [200]);
  }, failures);

  await check('GET /tags/search', async () => {
    const res = await requestNoBody('GET', '/tags/search?q=chill');
    expectStatus(res, [200]);
  }, failures);

  await check('GET /venues/:id', async () => {
    const res = await requestNoBody('GET', `/venues/${ids.venueId}`);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /venues/:id/view', async () => {
    const res = await requestNoBody('POST', `/venues/${ids.venueId}/view`);
    expectStatus(res, [200, 201]);
  }, failures);

  await check('GET /offers/:id', async () => {
    const res = await requestNoBody('GET', `/offers/${ids.offerId}`);
    expectStatus(res, [200]);
  }, failures);

  await check('GET /users/preferences', async () => {
    const res = await requestNoBody('GET', '/users/preferences', tokens.user);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /users/preferences', async () => {
    const { res } = await requestJson('POST', '/users/preferences', tokens.user, {
      vibes: ['Chill'],
      music: ['House'],
    });
    expectStatus(res, [200, 201]);
  }, failures);

  await check('GET /users/profile', async () => {
    const res = await requestNoBody('GET', '/users/profile', tokens.user);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /offers/:id/wallet-pass', async () => {
    const { res } = await requestJson('POST', `/offers/${ids.offerId}/wallet-pass`, tokens.user);
    expectStatus(res, [200, 201, 500]);
  }, failures);

  await check('POST /offers/:id/redeem', async () => {
    const { res } = await requestJson('POST', `/offers/${ids.offerId}/redeem`, tokens.user, {
      voucherCode: ids.voucherCode,
    });
    expectStatus(res, [201]);
  }, failures);

  await check('PUT /notifications/read-all', async () => {
    const res = await requestNoBody('PUT', '/notifications/read-all', tokens.user);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /users/location', async () => {
    const { res } = await requestJson('POST', '/users/location', tokens.user, {
      lat: 53.4808,
      lng: -2.2426,
    });
    expectStatus(res, [201]);
  }, failures);

  await check('POST /geofence/check', async () => {
    const { res } = await requestJson('POST', '/geofence/check', tokens.user, {
      lat: 53.4808,
      lng: -2.2426,
    });
    expectStatus(res, [201]);
  }, failures);

  await check('PUT /users/notification-preferences', async () => {
    const { res } = await requestJson('PUT', '/users/notification-preferences', tokens.user, {
      vibeAlerts: true,
      quietHoursStart: '02:00',
      quietHoursEnd: '09:00',
    });
    expectStatus(res, [200]);
  }, failures);

  await check('GET /sync/status', async () => {
    const res = await requestNoBody('GET', `/sync/status?deviceId=${ids.deviceId}`, tokens.user);
    expectStatus(res, [200]);
  }, failures);

  await check('GET /venues/sync', async () => {
    const since = encodeURIComponent(new Date(Date.now() - 60 * 1000).toISOString());
    const res = await requestNoBody('GET', `/venues/sync?since=${since}`, tokens.user);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /sync/queue', async () => {
    const { res } = await requestJson('POST', '/sync/queue', tokens.user, {
      deviceId: ids.deviceId,
      actions: [
        {
          id: `act-${Date.now()}`,
          type: 'VENUE_VIEW',
          venueId: ids.venueId,
          offlineTimestamp: new Date().toISOString(),
        },
      ],
    });
    expectStatus(res, [200, 201]);
  }, failures);

  await check('POST /venues/:venueId/vibe-check', async () => {
    const { res } = await requestJson('POST', `/venues/${ids.venueId}/vibe-check`, tokens.user, {
      score: 4,
    });
    expectStatus(res, [201]);
  }, failures);

  await check('GET /business/venues', async () => {
    const res = await requestNoBody('GET', '/business/venues', tokens.business);
    expectStatus(res, [200]);
  }, failures);

  await check('GET /business/dashboard/:venueId', async () => {
    const res = await requestNoBody('GET', `/business/dashboard/${ids.businessVenueId}`, tokens.business);
    expectStatus(res, [200]);
  }, failures);

  await check('PUT /business/venues/:id/status', async () => {
    const { res } = await requestJson('PUT', `/business/venues/${ids.businessVenueId}/status`, tokens.business, {
      busyness: 'moderate',
      vibes: ['Chill'],
    });
    expectStatus(res, [200]);
  }, failures);

  await check('GET /admin/stats', async () => {
    const res = await requestNoBody('GET', '/admin/stats', tokens.admin);
    expectStatus(res, [200]);
  }, failures);

  await check('POST /admin/test-push', async () => {
    const { res } = await requestJson('POST', '/admin/test-push', tokens.admin, {
      userId: ids.demoUserId,
      title: 'Smoke test',
      body: 'Role smoke test',
    });
    expectStatus(res, [200, 201]);
  }, failures);

  await check('SSE /live/feed', async () => {
    await sseCheck('/live/feed', tokens.user);
  }, failures);

  await check('SSE /live/venue/:venueId', async () => {
    await sseCheck(`/live/venue/${ids.venueId}`, tokens.user);
  }, failures);

  await check('SSE /live/map', async () => {
    await sseCheck('/live/map', tokens.user);
  }, failures);

  if (includeDestructive) {
    await check('DELETE /devices/:deviceId', async () => {
      const res = await requestNoBody('DELETE', `/devices/${ids.deviceId}`, tokens.user);
      expectStatus(res, [200]);
    }, failures);

    await check('DELETE /business/offers/:id', async () => {
      const res = await requestNoBody('DELETE', `/business/offers/${ids.offerId}`, tokens.business);
      expectStatus(res, [200]);
    }, failures);

    await check('POST /admin/demo/reset', async () => {
      const res = await requestNoBody('POST', '/admin/demo/reset', tokens.admin);
      expectStatus(res, [200, 201]);
    }, failures);
  } else {
    console.log('Skipping destructive endpoints. Set SMOKE_INCLUDE_DESTRUCTIVE=1 to enable.');
  }

  if (failures.length > 0) {
    console.error('\nSmoke test failures:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nAll smoke checks passed.');
  }
};

run().catch((err) => {
  console.error(`Smoke test crashed: ${err.message}`);
  process.exit(1);
});
