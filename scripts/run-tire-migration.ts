import { readFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  console.log('🔄 Reading migration file...');
  const migrationPath = join(__dirname, 'update-tire-schema.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('🗄️  Applying tire schema migration...');

  try {
    // Remove comment lines first
    const sqlWithoutComments = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolon and execute each statement separately
    const statements = sqlWithoutComments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        const preview = statement.replace(/\s+/g, ' ').substring(0, 80);
        console.log(`[${i + 1}/${statements.length}] ${preview}...`);
        await sql.query(statement);
      }
    }

    console.log('✅ Tire schema migration completed successfully!');
    console.log('');
    console.log('New schema:');
    console.log('- tire_stocks: brand, model, dimension, quantity, location');
    console.log('- tire_stock_movements: stockId, orgId, vehicleId, type (INTRARE/IESIRE/MONTARE/DEMONTARE), date, odometerKm, notes, userId');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main().catch(console.error);
