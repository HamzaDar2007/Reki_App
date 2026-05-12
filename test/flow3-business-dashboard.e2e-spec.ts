import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 3: Business Login → View Dashboard → Update Status → Verify Feed Updated
 */
describe('Flow 3: Business Dashboard & Status Update (e2e)', () => {
  let app: INestApplication;
  let businessToken: string;
  let venueId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/business/login — should login as business user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/business/login')
      .send({ email: 'manager@alberts.com', password: 'business123' })
      .expect(200);

    expect(res.body).toHaveProperty('tokens');
    expect(res.body.user).toHaveProperty('venues');
    businessToken = res.body.tokens.accessToken;
    const venues = res.body.user.venues ?? [];
    if (venues.length > 0) {
      venueId = venues[0].id;
      return;
    }

    const createRes = await request(app.getHttpServer())
      .post('/business/venues')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        name: 'E2E Test Venue',
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

    venueId = createRes.body.venue.id;
  });

  it('GET /business/dashboard/:venueId — should return dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get(`/business/dashboard/${venueId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('venue');
    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('weather');
  });

  it('PUT /business/venues/:id/status — should update venue status', async () => {
    const res = await request(app.getHttpServer())
      .put(`/business/venues/${venueId}/status`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({ busyness: 'busy', vibes: ['High Energy', 'Packed'] })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.venue.busyness.level).toBe('busy');
    expect(res.body.venue.busyness.percentage).toBe(85);
  });

  it('GET /venues/:id — user feed should reflect business update', async () => {
    const res = await request(app.getHttpServer())
      .get(`/venues/${venueId}`)
      .expect(200);

    const venue = res.body.venue ?? res.body;
    expect(venue.busyness.level).toBe('busy');
  });

  it('GET /business/venues/:id/status — should return updated status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/business/venues/${venueId}/status`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(res.body.busyness.level).toBe('busy');
  });
});
