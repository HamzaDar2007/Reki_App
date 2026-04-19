import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 2: Filter Venues → View Detail → Claim Offer → Redeem Offer
 */
describe('Flow 2: Filter → Detail → Claim → Redeem (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let venueId: string;
  let offerId: string;
  let voucherCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login as demo user
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' });
    accessToken = loginRes.body.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /venues — should filter venues by category', async () => {
    const res = await request(app.getHttpServer())
      .get('/venues?city=manchester&category=bar')
      .expect(200);

    expect(res.body).toHaveProperty('venues');
    expect(res.body.count).toBeGreaterThan(0);
    venueId = res.body.venues[0].id;
  });

  it('GET /venues/:id — should return venue detail with offers', async () => {
    const res = await request(app.getHttpServer())
      .get(`/venues/${venueId}`)
      .expect(200);

    expect(res.body).toHaveProperty('venue');
    expect(res.body.venue).toHaveProperty('name');
    expect(res.body.venue).toHaveProperty('busyness');
    if (res.body.venue.offers && res.body.venue.offers.length > 0) {
      offerId = res.body.venue.offers[0].id;
    }
  });

  it('GET /offers/:id — should return offer detail', async () => {
    if (!offerId) return;
    const res = await request(app.getHttpServer())
      .get(`/offers/${offerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('offer');
    expect(res.body.offer).toHaveProperty('title');
  });

  it('POST /offers/:id/claim — should claim offer and get voucher', async () => {
    if (!offerId) return;
    const res = await request(app.getHttpServer())
      .post(`/offers/${offerId}/claim`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('voucherCode');
    expect(res.body).toHaveProperty('transactionId');
    voucherCode = res.body.voucherCode;
  });

  it('POST /offers/:id/redeem — should redeem claimed offer', async () => {
    if (!offerId || !voucherCode) return;
    const res = await request(app.getHttpServer())
      .post(`/offers/${offerId}/redeem`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ voucherCode })
      .expect(201);

    expect(res.body).toHaveProperty('status', 'redeemed');
    expect(res.body).toHaveProperty('transactionId');
  });
});
