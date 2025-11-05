import { Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';

import { env } from '@/lib/env';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __db__: NeonDatabase<typeof schema> | undefined;
}

function createClient(): NeonDatabase<typeof schema> {
  const connection = new Pool({ connectionString: env.NEON_POOLER_URL ?? env.DATABASE_URL });
  return drizzle(connection, { schema });
}

export const db = global.__db__ ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  global.__db__ = db;
}

export * from './schema';
