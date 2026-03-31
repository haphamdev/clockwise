import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/exceptions/app-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationException } from './common/exceptions/validation.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(cookieParser());
  const logger = new Logger('Bootstrap');

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global interceptors & filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AppExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new ValidationException(errors),
    }),
  );

  // CORS
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173'],
    credentials: true,
  });

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Clockwise API')
      .setDescription('Time tracking application API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Clockwise API running on http://localhost:${port}/api/v1`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
