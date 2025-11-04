import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyTireTablesMigration() {
  const connectionString = process.env.NEON_POOLER_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL or NEON_POOLER_URL trebuie configurat.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Reading tire tables migration...');
    const migrationSql = readFileSync(
      join(process.cwd(), 'drizzle', '0001_add_tire_tables.sql'),
      'utf-8',
    );

    console.log('Applying tire tables migration...');
    await client.query(migrationSql);
    console.log('✅ Tire tables created or already existed.');
  } catch (error) {
    console.error('❌ Tire tables migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyTireTablesMigration();
