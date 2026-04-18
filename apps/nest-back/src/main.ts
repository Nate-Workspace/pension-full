import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

loadEnv({ path: '../../.env' });
loadEnv({ path: './.env', override: true });

function parseAllowedOrigins(): string[] {
  const configured = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (configured.length > 0) {
    return [...new Set(configured)];
  }

  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = parseAllowedOrigins();

  app.use(cookieParser());
  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
