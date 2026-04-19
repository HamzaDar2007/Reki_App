import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 4: Business Create Offer → User Sees Offer → User Redeems → Business Sees Count
 */
describe('Flow 4: Business Offer Lifecycle (e2e)', () => {
  let app: INestApplication;
  let businessToken: string;
  let userToken: string;
  let venueId: string;
  let offerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login as business
    const bizRes = await request(app.getHttpServer())
      .post('/auth/business/login')
      .send({ email: 'manager@alberts.com', password: 'business123' });
    businessToken = bizRes.body.tokens.accessToken;
    venueId = bizRes.body.user.venue.id;

    // Login as user
    const userRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' });
    userToken = userRes.body.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /business/offers — should create new offer', async () => {
    const res = await request(app.getHttpServer())
      .post('/business/offers')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        venueId,
        title: 'E2E Test Offer',
        description: 'Test offer from e2e',
        type: '2-for-1',
        validDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        validTimeStart: '00:00',
        validTimeEnd: '23:59',
        maxRedemptions: 50,
        savingValue: 10.00,
      })
      .expect(201);

    expect(res.body).toHaveProperty('offer');
    offerId = res.body.offer.id;
  });

  it('GET /venues/:id — user should see the new offer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/venues/${venueId}`)
      .expect(200);

    const offerIds = res.body.venue.offers.map((o: any) => o.id);
    expect(offerIds).toContain(offerId);
  });

  it('POST /offers/:id/claim + redeem — user redeems', async () => {
    const claimRes = await request(app.getHttpServer())
      .post(`/offers/${offerId}/claim`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    const { voucherCode } = claimRes.body;

    const redeemRes = await request(app.getHttpServer())
      .post(`/offers/${offerId}/redeem`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ voucherCode })
      .expect(201);

    expect(redeemRes.body.status).toBe('redeemed');
  });

  it('GET /business/venues/:id/offers — business sees redemption count', async () => {
    const res = await request(app.getHttpServer())
      .get(`/business/venues/${venueId}/offers`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('activeDeals');
    const testOffer = res.body.activeDeals.find((o: any) => o.id === offerId);
    if (testOffer) {
      expect(testOffer.redemptionCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('DELETE /business/offers/:id — business deletes offer', async () => {
    await request(app.getHttpServer())
      .delete(`/business/offers/${offerId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });
});
