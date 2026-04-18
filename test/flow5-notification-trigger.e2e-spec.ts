import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 5: Busyness Update → Auto Notification → User Receives Notification
 */
describe('Flow 5: Busyness → Notification Trigger (e2e)', () => {
  let app: INestApplication;
  let businessToken: string;
  let userToken: string;
  let venueId: string;

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

    // Login as demo user  
    const userRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' });
    userToken = userRes.body.tokens.accessToken;

    // Save the venue so user gets notifications
    await request(app.getHttpServer())
      .post(`/users/saved-venues/${venueId}`)
      .set('Authorization', `Bearer ${userToken}`);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('PUT /business/venues/:id/status — update busyness to 85% (triggers alert)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/business/venues/${venueId}/status`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({ busyness: 'busy', vibes: ['High Energy', 'Packed'] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.venue.busyness.percentage).toBe(85);
  });

  it('GET /notifications — user should have vibe alert notification', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const allNotifications = [
      ...res.body.today,
      ...res.body.yesterday,
      ...res.body.earlier,
    ];
    expect(allNotifications.length).toBeGreaterThan(0);
  });

  it('PUT /notifications/read-all — should mark all as read', async () => {
    await request(app.getHttpServer())
      .put('/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });
});
