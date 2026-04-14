import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: '../../.env' });
// loadEnv({ path: '../../apps/nest-back/.env' });

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
  },
});
