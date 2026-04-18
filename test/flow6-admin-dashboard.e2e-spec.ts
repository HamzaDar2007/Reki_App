import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 6: Admin Login → View Stats → View User/Venue/Offer Logs
 */
describe('Flow 6: Admin Dashboard & Logs (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login as admin
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@reki.app', password: 'admin123' });
    adminToken = res.body.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin/stats — should return platform stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalVenues');
    expect(res.body).toHaveProperty('activeOffers');
  });

  it('GET /admin/users — should return user list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /admin/venues — should return venue list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/venues')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /admin/offers — should return offers list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
  });

  it('GET /admin/activity-logs — should return activity logs', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/activity-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
  });

  it('GET /admin/notifications — should return notification logs', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('notifications');
  });

  it('should deny access to non-admin users', async () => {
    // Login as regular user
    const userRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' });
    const userToken = userRes.body.tokens.accessToken;

    await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
