import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4000);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Swagger UI requires inline scripts to bootstrap
          'script-src': ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );

  app.enableCors({
    origin: configService.get<string>('corsOrigin', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ── Swagger UI assets (swagger-ui-dist, shipped with @nestjs/swagger) ──────
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerUiAssetsPath: string = require('swagger-ui-dist').absolutePath();
  app.use('/swagger-ui-assets', express.static(swaggerUiAssetsPath));

  await app.listen(port);
  logger.log(`API Gateway running on port ${port}`);
  logger.log(`Swagger  → http://localhost:${port}/api/docs`);
  logger.log(
    `Upstream → ${configService.get('services.jobApply.url')}`,
  );
}
bootstrap();
