import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

/**
 * E2E Flow 1: User Registration → Login → Set Preferences → Browse Feed
 */
describe('Flow 1: User Registration → Login → Preferences → Feed (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

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

  it('POST /auth/register — should register a new user', async () => {
    const uniqueEmail = `e2e-flow1-${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'Test1234', name: 'E2E User' })
      .expect(201);

    expect(res.body).toHaveProperty('tokens');
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
    accessToken = res.body.tokens.accessToken;
    refreshToken = res.body.tokens.refreshToken;
  });

  it('POST /auth/login — should login with registered credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'demo@reki.app', password: 'demo1234' })
      .expect(200);

    expect(res.body).toHaveProperty('tokens');
    accessToken = res.body.tokens.accessToken;
  });

  it('POST /users/preferences — should save user preferences', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ vibes: ['Chill', 'Party'], music: ['House'] })
      .expect(201);

    expect(res.body).toHaveProperty('preferences');
    expect(res.body.preferences.vibes).toContain('Chill');
  });

  it('GET /users/preferences — should return saved preferences', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('preferences');
    expect(res.body.hasPreferences).toBe(true);
  });

  it('GET /venues — should return venue feed', async () => {
    const res = await request(app.getHttpServer())
      .get('/venues?city=manchester&page=1&limit=5')
      .expect(200);

    expect(res.body).toHaveProperty('venues');
    expect(res.body).toHaveProperty('count');
    expect(res.body.venues.length).toBeGreaterThan(0);
  });
});
