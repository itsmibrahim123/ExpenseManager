import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists (absolute path for production safety)
  const uploadsDir = resolve(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static assets with caching headers and CORS allowance
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    maxAge: 86400000,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });

  // Dynamic CORS configuration for Vercel, Render, and local development
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOrigins.includes('*') ||
        corsOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS policy: ${origin}`);
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global HTTP Request Logger
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    logger.log(`--> INCOMING: ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
      logger.log(`<-- OUTGOING: ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    res.on('close', () => {
      if (!res.writableEnded) {
        logger.error(`<!- CONNECTION CLOSED EARLY: ${req.method} ${req.originalUrl} after ${Date.now() - start}ms`);
      }
    });
    next();
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('ExpenseManager SaaS ERP Backend API')
    .setDescription(
      'Multi-tenant SaaS ERP Backend running on NestJS + TypeScript with RBAC, POS checkout calculations, and daily register accounting workflows.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' }, 'X-Tenant-Id')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 ExpenseManager NestJS Backend running on: http://0.0.0.0:${port}`);
  logger.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
