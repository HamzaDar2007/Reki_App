import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled for Swagger UI
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global request logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS
  app.enableCors();

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('REKI API')
    .setDescription('REKI - Manchester Nightlife Discovery App Backend API')
    .setVersion('1.0.4')
    .addBearerAuth()
    .addTag('App', 'App config & health check')
    .addTag('Auth', 'User authentication (email, Google, Apple, guest)')
    .addTag('Users', 'User profile & preferences')
    .addTag('Venues', 'Venue discovery, detail, map markers')
    .addTag('Offers', 'Offer details, claim, redeem, Apple Wallet')
    .addTag('Notifications', 'User notifications')
    .addTag('Tags', 'Vibe & music tags')
    .addTag('Business', 'Business portal (dashboard, status, offers)')
    .addTag('Admin', 'Admin view-only APIs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 REKI Backend running on http://localhost:${port}`);
  logger.log(`📄 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
