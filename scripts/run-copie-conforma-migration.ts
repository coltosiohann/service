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
      join(process.cwd(), 'drizzle', '0002_add_copie_conforma_fields.sql'),
      'utf-8'
    );

    console.log('Executing Copie Conforma migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('Copie Conforma fields have been added to the vehicles table.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
