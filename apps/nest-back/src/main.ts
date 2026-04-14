import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

loadEnv({ path: '../../.env' });
loadEnv({ path: './.env', override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
