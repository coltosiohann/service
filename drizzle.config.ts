import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.NEON_POOLER_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL sau NEON_POOLER_URL trebuie setate pentru Drizzle.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
  schemaFilter: ['public'],
  casing: 'snake_case',
  strict: true,
});
