import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { env } from '@/lib/env';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __db__: NeonHttpDatabase<typeof schema> | undefined;
}

function createClient(): NeonHttpDatabase<typeof schema> {
  const connection = neon(env.NEON_POOLER_URL ?? env.DATABASE_URL);
  return drizzle(connection, { schema });
}

export const db = global.__db__ ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  global.__db__ = db;
}

export * from './schema';
