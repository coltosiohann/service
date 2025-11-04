import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new Pool({ connectionString: process.env.NEON_POOLER_URL || process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle', '0000_initial.sql'),
      'utf-8'
    );

    console.log('Executing migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('All database tables have been created.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
