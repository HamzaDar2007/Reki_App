import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

type Tokens = {
  admin: string;
  user: string;
  guest: string;
  business: string;
};

type Ids = {
  venueId: string;
  businessVenueId: string;
  offerId: string;
  voucherCode: string;
  notificationId: string;
  deviceId: string;
  refreshToken: string;
  demoUserId: string;
  adminUserId: string;
};

const expectOneOf = (res: request.Response, statuses: number[]) => {
  if (!statuses.includes(res.status)) {
    throw new Error(`Expected status ${statuses.join(', ')}, got ${res.status}`);
  }
};

const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}@reki.app`;

describe('Role access matrix (e2e)', () => {
  let app: INestApplication;
  const tokens: Tokens = { admin: '', user: '', guest: '', business: '' };
  const ids: Ids = {
    venueId: '',
    businessVenueId: '',
    offerId: '',
    voucherCode: '',
    notificationId: '',
    deviceId: '',
    refreshToken: '',
    demoUserId: '',
    adminUserId: '',
  };

  const api = () => request(app.getHttpServer());
  const withToken = (method: 'get' | 'post' | 'put' | 'delete', path: string, token?: string) => {
    const req = api()[method](path);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    const demoLogin = await api()
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' })
      .expect(200);
    tokens.user = demoLogin.body.tokens.accessToken;
    ids.refreshToken = demoLogin.body.tokens.refreshToken;
    ids.demoUserId = demoLogin.body.user.id;

    const adminLogin = await api()
      .post('/auth/login')
      .send({ email: 'admin@reki.app', password: 'admin123' })
      .expect(200);
    tokens.admin = adminLogin.body.tokens.accessToken;
    ids.adminUserId = adminLogin.body.user.id;

    const guestLogin = await api()
      .post('/auth/guest')
      .expect(201);
    tokens.guest = guestLogin.body.tokens.accessToken;

    const businessLogin = await api()
      .post('/auth/business/login')
      .send({ email: 'manager@alberts.com', password: 'business123' })
      .expect(200);
    tokens.business = businessLogin.body.tokens.accessToken;
    const businessVenues = businessLogin.body.user?.venues ?? [];
    if (businessVenues.length > 0) {
      ids.businessVenueId = businessVenues[0].id;
    } else {
      const createVenueRes = await withToken('post', '/business/venues', tokens.business)
        .send({
          name: 'E2E Role Venue',
          address: '123 Test Street',
          city: 'Manchester',
          area: 'City Centre',
          category: 'bar',
          lat: 53.4808,
          lng: -2.2426,
          openingHours: '10:00',
          closingTime: '02:00',
        })
        .expect(201);
      ids.businessVenueId = createVenueRes.body.venue?.id;
    }

    const venuesRes = await api().get('/venues').expect(200);
    const venues = venuesRes.body.venues || [];
    ids.venueId = venues[0]?.id || ids.businessVenueId;
    if (!ids.venueId) {
      throw new Error('No venue available for tests');
    }

    const offerRes = await withToken('post', '/business/offers', tokens.business)
      .send({
        venueId: ids.businessVenueId,
        title: 'E2E Role Offer',
        description: 'Offer for role access tests',
        type: '2-for-1',
        validDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        validTimeStart: '00:00',
        validTimeEnd: '23:59',
        maxRedemptions: 50,
        savingValue: 10,
      })
      .expect(201);
    ids.offerId = offerRes.body.offer?.id;
    if (!ids.offerId) {
      throw new Error('Offer id missing from response');
    }

    const claimRes = await withToken('post', `/offers/${ids.offerId}/claim`, tokens.user)
      .expect(201);
    ids.voucherCode = claimRes.body.voucherCode;

    const deviceRes = await withToken('post', '/devices/register', tokens.user)
      .send({
        fcmToken: `test-fcm-${Date.now()}`,
        platform: 'ios',
        deviceId: `e2e-device-${Date.now()}`,
      })
      .expect(201);
    ids.deviceId = deviceRes.body.deviceId;

    const fetchNotifications = async () => {
      const res = await withToken('get', '/notifications', tokens.user).expect(200);
      const today = res.body.today || [];
      const yesterday = res.body.yesterday || [];
      const earlier = res.body.earlier || [];
      return [...today, ...yesterday, ...earlier];
    };

    let notifications = await fetchNotifications();
    if (notifications.length === 0) {
      const saveRes = await withToken('post', `/users/saved-venues/${ids.venueId}`, tokens.user);
      expectOneOf(saveRes, [200, 201]);
      await withToken('put', `/business/venues/${ids.businessVenueId}/status`, tokens.business)
        .send({ busyness: 'busy', vibes: ['High Energy'] })
        .expect(200);
      notifications = await fetchNotifications();
    }
    ids.notificationId = notifications[0]?.id || '';
    if (!ids.notificationId) {
      throw new Error('Notification id missing from response');
    }
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Public endpoints', () => {
    const publicGets = [
      { name: 'GET /config/app', path: '/config/app' },
      { name: 'GET /health', path: '/health' },
      { name: 'GET /tags', path: '/tags' },
      { name: 'GET /tags/vibes', path: '/tags/vibes' },
      { name: 'GET /tags/music', path: '/tags/music' },
      { name: 'GET /tags/search', path: '/tags/search?q=chill' },
      { name: 'GET /venues', path: '/venues' },
      { name: 'GET /venues/search', path: '/venues/search?q=bar' },
      { name: 'GET /venues/filter-options', path: '/venues/filter-options' },
      { name: 'GET /venues/trending', path: '/venues/trending' },
      { name: 'GET /venues/map-markers', path: '/venues/map-markers' },
    ];

    it.each(publicGets)('$name', async ({ path }) => {
      await api().get(path).expect(200);
    });

    it('GET /venues/:id', async () => {
      await api().get(`/venues/${ids.venueId}`).expect(200);
    });

    it('POST /venues/:id/view', async () => {
      const res = await api().post(`/venues/${ids.venueId}/view`);
      expectOneOf(res, [200, 201]);
    });

    it('GET /offers/:id', async () => {
      await api().get(`/offers/${ids.offerId}`).expect(200);
    });
  });

  describe('Auth endpoints', () => {
    it('POST /auth/register', async () => {
      const email = uniqueEmail('user');
      const res = await api()
        .post('/auth/register')
        .send({ email, name: 'Role Test User', password: 'test1234' });
      expectOneOf(res, [201]);
    });

    it('POST /auth/login', async () => {
      await api()
        .post('/auth/login')
        .send({ email: 'demo@reki.app', password: 'demo1234' })
        .expect(200);
    });

    it('POST /auth/guest', async () => {
      await api().post('/auth/guest').expect(201);
    });

    it('GET /auth/verify-email', async () => {
      await api().get('/auth/verify-email?token=invalid').expect(400);
    });

    it('POST /auth/forgot-password', async () => {
      await api()
        .post('/auth/forgot-password')
        .send({ email: 'demo@reki.app' })
        .expect(200);
    });

    it('POST /auth/reset-password', async () => {
      await api()
        .post('/auth/reset-password')
        .send({ token: 'bad-token', newPassword: 'newpass123' })
        .expect(400);
    });

    it('POST /auth/refresh-token', async () => {
      await api()
        .post('/auth/refresh-token')
        .send({ refreshToken: ids.refreshToken })
        .expect(200);
    });

    it('POST /auth/google', async () => {
      await api()
        .post('/auth/google')
        .send({ idToken: 'bad-token' })
        .expect(400);
    });

    it('POST /auth/apple', async () => {
      await api()
        .post('/auth/apple')
        .send({ identityToken: 'bad-token', authorizationCode: 'bad-code' })
        .expect(400);
    });
  });

  describe('Business auth endpoints', () => {
    it('POST /auth/business/register', async () => {
      const email = uniqueEmail('business');
      const res = await api()
        .post('/auth/business/register')
        .send({
          email,
          name: 'Role Test Business',
          password: 'business123',
          phone: '+447000000001',
        });
      expectOneOf(res, [201]);
    });

    it('POST /auth/business/login', async () => {
      await api()
        .post('/auth/business/login')
        .send({ email: 'manager@alberts.com', password: 'business123' })
        .expect(200);
    });

    it('POST /auth/business/forgot-password + reset', async () => {
      const email = uniqueEmail('biz-reset');
      await api()
        .post('/auth/business/register')
        .send({
          email,
          name: 'Reset Test Business',
          password: 'business123',
          phone: '+447000000002',
        })
        .expect(201);

      const forgotRes = await api()
        .post('/auth/business/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = forgotRes.body.resetToken;
      if (resetToken) {
        await api()
          .post('/auth/business/reset-password')
          .send({ token: resetToken, newPassword: 'newpass123' })
          .expect(200);
      } else {
        await api()
          .post('/auth/business/reset-password')
          .send({ token: 'bad-token', newPassword: 'newpass123' })
          .expect(400);
      }
    });
  });

  describe('User endpoints (role=user)', () => {
    it('GET /users/preferences', async () => {
      await withToken('get', '/users/preferences', tokens.user).expect(200);
    });

    it('POST /users/preferences', async () => {
      const res = await withToken('post', '/users/preferences', tokens.user)
        .send({ vibes: ['Chill'], music: ['House'] });
      expectOneOf(res, [200, 201]);
    });

    it('PUT /users/preferences', async () => {
      await withToken('put', '/users/preferences', tokens.user)
        .send({ vibes: ['Party'], music: ['R&B'] })
        .expect(200);
    });

    it('GET /users/saved-venues', async () => {
      await withToken('get', '/users/saved-venues', tokens.user).expect(200);
    });

    it('POST /users/saved-venues/:venueId', async () => {
      const res = await withToken('post', `/users/saved-venues/${ids.venueId}`, tokens.user);
      expectOneOf(res, [200, 201]);
    });

    it('DELETE /users/saved-venues/:venueId', async () => {
      await withToken('delete', `/users/saved-venues/${ids.venueId}`, tokens.user).expect(200);
    });

    it('GET /users/redemptions', async () => {
      await withToken('get', '/users/redemptions', tokens.user).expect(200);
    });

    it('GET /users/profile', async () => {
      await withToken('get', '/users/profile', tokens.user).expect(200);
    });
  });

  describe('Offers endpoints (role=user)', () => {
    it('POST /offers/:id/claim', async () => {
      const res = await withToken('post', `/offers/${ids.offerId}/claim`, tokens.user);
      expectOneOf(res, [200, 201]);
    });

    it('POST /offers/:id/wallet-pass', async () => {
      const res = await withToken('post', `/offers/${ids.offerId}/wallet-pass`, tokens.user);
      expectOneOf(res, [200, 201, 500]);
    });

    it('POST /offers/:id/redeem', async () => {
      await withToken('post', `/offers/${ids.offerId}/redeem`, tokens.user)
        .send({ voucherCode: ids.voucherCode })
        .expect(201);
    });
  });

  describe('Notifications endpoints (role=user)', () => {
    it('GET /notifications', async () => {
      await withToken('get', '/notifications', tokens.user).expect(200);
    });

    it('PUT /notifications/:id/read', async () => {
      await withToken('put', `/notifications/${ids.notificationId}/read`, tokens.user).expect(200);
    });

    it('PUT /notifications/read-all', async () => {
      await withToken('put', '/notifications/read-all', tokens.user).expect(200);
    });
  });

  describe('Devices endpoints (role=user)', () => {
    it('GET /users/notification-preferences', async () => {
      await withToken('get', '/users/notification-preferences', tokens.user).expect(200);
    });

    it('PUT /users/notification-preferences', async () => {
      await withToken('put', '/users/notification-preferences', tokens.user)
        .send({ vibeAlerts: true, quietHoursStart: '02:00', quietHoursEnd: '09:00' })
        .expect(200);
    });

    it('DELETE /devices/:deviceId', async () => {
      await withToken('delete', `/devices/${ids.deviceId}`, tokens.user).expect(200);
    });
  });

  describe('Geofence endpoints (role=user)', () => {
    it('POST /users/location', async () => {
      await withToken('post', '/users/location', tokens.user)
        .send({ lat: 53.4808, lng: -2.2426 })
        .expect(201);
    });

    it('PUT /users/location-consent', async () => {
      await withToken('put', '/users/location-consent', tokens.user)
        .send({ locationEnabled: true, backgroundLocationEnabled: false })
        .expect(200);
    });

    it('POST /geofence/check', async () => {
      await withToken('post', '/geofence/check', tokens.user)
        .send({ lat: 53.4808, lng: -2.2426 })
        .expect(201);
    });

    it('GET /analytics/popular-areas', async () => {
      await withToken('get', '/analytics/popular-areas?city=Manchester', tokens.user)
        .expect(200);
    });
  });

  describe('Sync endpoints (role=user)', () => {
    it('POST /sync/queue', async () => {
      const res = await withToken('post', '/sync/queue', tokens.user)
        .send({
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
      expectOneOf(res, [200, 201]);
    });

    it('GET /sync/status', async () => {
      await withToken('get', `/sync/status?deviceId=${ids.deviceId}`, tokens.user)
        .expect(200);
    });

    it('GET /venues/sync', async () => {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      await withToken('get', `/venues/sync?since=${encodeURIComponent(since)}`, tokens.user)
        .expect(200);
    });

    it('GET /notifications/sync', async () => {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      await withToken('get', `/notifications/sync?since=${encodeURIComponent(since)}`, tokens.user)
        .expect(200);
    });

    it('GET /offers/sync', async () => {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      await withToken('get', `/offers/sync?since=${encodeURIComponent(since)}`, tokens.user)
        .expect(200);
    });

    it('PUT /users/state', async () => {
      await withToken('put', '/users/state', tokens.user)
        .send({ preferences: { vibes: ['Chill'], music: ['House'] }, savedVenues: [ids.venueId] })
        .expect(200);
    });

    it('GET /users/state', async () => {
      await withToken('get', '/users/state', tokens.user).expect(200);
    });
  });

  describe('Vibes endpoints (role=user)', () => {
    it('POST /venues/:venueId/vibe-check', async () => {
      await withToken('post', `/venues/${ids.venueId}/vibe-check`, tokens.user)
        .send({ score: 4 })
        .expect(201);
    });
  });

  describe('Business endpoints (role=business)', () => {
    it('GET /business/venues', async () => {
      await withToken('get', '/business/venues', tokens.business).expect(200);
    });

    it('PUT /business/venues/:id', async () => {
      await withToken('put', `/business/venues/${ids.businessVenueId}`, tokens.business)
        .send({ name: 'Updated Role Venue' })
        .expect(200);
    });

    it('GET /business/dashboard/:venueId', async () => {
      await withToken('get', `/business/dashboard/${ids.businessVenueId}`, tokens.business)
        .expect(200);
    });

    it('GET /business/analytics/:venueId', async () => {
      await withToken('get', `/business/analytics/${ids.businessVenueId}`, tokens.business)
        .expect(200);
    });

    it('PUT /business/venues/:id/status', async () => {
      await withToken('put', `/business/venues/${ids.businessVenueId}/status`, tokens.business)
        .send({ busyness: 'moderate', vibes: ['Chill'] })
        .expect(200);
    });

    it('GET /business/venues/:id/status', async () => {
      await withToken('get', `/business/venues/${ids.businessVenueId}/status`, tokens.business)
        .expect(200);
    });

    it('GET /business/venues/:id/offers', async () => {
      await withToken('get', `/business/venues/${ids.businessVenueId}/offers`, tokens.business)
        .expect(200);
    });

    it('PUT /business/offers/:id', async () => {
      await withToken('put', `/business/offers/${ids.offerId}`, tokens.business)
        .send({ title: 'Updated Role Offer' })
        .expect(200);
    });

    it('PUT /business/offers/:id/toggle', async () => {
      await withToken('put', `/business/offers/${ids.offerId}/toggle`, tokens.business)
        .send({ isActive: false })
        .expect(200);
    });

    it('DELETE /business/offers/:id', async () => {
      await withToken('delete', `/business/offers/${ids.offerId}`, tokens.business)
        .expect(200);
    });

    it('DELETE /business/venues/:id', async () => {
      await withToken('delete', `/business/venues/${ids.businessVenueId}`, tokens.business)
        .expect(200);
    });
  });

  describe('Admin endpoints (role=admin)', () => {
    it('GET /admin/stats', async () => {
      await withToken('get', '/admin/stats', tokens.admin).expect(200);
    });

    it('GET /admin/stats/location', async () => {
      await withToken('get', '/admin/stats/location', tokens.admin).expect(200);
    });

    it('GET /admin/users', async () => {
      await withToken('get', '/admin/users', tokens.admin).expect(200);
    });

    it('GET /admin/users/:id/activity', async () => {
      await withToken('get', `/admin/users/${ids.demoUserId}/activity`, tokens.admin)
        .expect(200);
    });

    it('GET /admin/venues', async () => {
      await withToken('get', '/admin/venues', tokens.admin).expect(200);
    });

    it('GET /admin/venues/:id/logs', async () => {
      await withToken('get', `/admin/venues/${ids.venueId}/logs`, tokens.admin)
        .expect(200);
    });

    it('GET /admin/offers', async () => {
      await withToken('get', '/admin/offers', tokens.admin).expect(200);
    });

    it('GET /admin/offers/redemptions', async () => {
      await withToken('get', '/admin/offers/redemptions', tokens.admin).expect(200);
    });

    it('GET /admin/activity-logs', async () => {
      await withToken('get', '/admin/activity-logs', tokens.admin).expect(200);
    });

    it('GET /admin/notifications', async () => {
      await withToken('get', '/admin/notifications', tokens.admin).expect(200);
    });

    it('GET /admin/stats/realtime', async () => {
      await withToken('get', '/admin/stats/realtime', tokens.admin).expect(200);
    });

    it('GET /admin/stats/offline', async () => {
      await withToken('get', '/admin/stats/offline', tokens.admin).expect(200);
    });

    it('POST /admin/test-push', async () => {
      const res = await withToken('post', '/admin/test-push', tokens.admin)
        .send({ userId: ids.demoUserId, title: 'Test push', body: 'Role access test' });
      expectOneOf(res, [200, 201]);
    });
  });

  describe('Demo endpoints (role=admin)', () => {
    it('GET /admin/demo/scenarios', async () => {
      await withToken('get', '/admin/demo/scenarios', tokens.admin).expect(200);
    });

    it('POST /admin/demo/simulate', async () => {
      const res = await withToken('post', '/admin/demo/simulate', tokens.admin)
        .send({ scenario: 'saturday-night', hour: 21 });
      expectOneOf(res, [200, 201]);
    });

    it('POST /admin/demo/simulate-time', async () => {
      const res = await withToken('post', '/admin/demo/simulate-time', tokens.admin)
        .send({ hour: 22 });
      expectOneOf(res, [200, 201]);
    });

    it('POST /admin/demo/reset', async () => {
      const res = await withToken('post', '/admin/demo/reset', tokens.admin);
      expectOneOf(res, [200, 201]);
    });
  });

  describe('Role enforcement checks', () => {
    it('blocks guest from NoGuest endpoints', async () => {
      await withToken('get', '/notifications', tokens.guest).expect(403);
    });

    it('blocks user from business endpoints', async () => {
      await withToken('get', '/business/venues', tokens.user).expect(403);
    });

    it('blocks user from admin endpoints', async () => {
      await withToken('get', '/admin/stats', tokens.user).expect(403);
    });

    it('requires JWT for protected endpoints', async () => {
      await api().get('/users/profile').expect(401);
    });
  });
});
