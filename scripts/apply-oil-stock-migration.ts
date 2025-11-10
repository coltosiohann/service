import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

async function applyMigration() {
  try {
    console.log('Applying oil stock migration...');

    // Create enum type
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "oil_movement_type" AS ENUM('INTRARE', 'IESIRE', 'UTILIZARE');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create oil_stocks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "oil_stocks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "org_id" uuid NOT NULL,
        "oil_type" text NOT NULL,
        "brand" text NOT NULL,
        "quantity_liters" numeric(10, 2) DEFAULT '0' NOT NULL,
        "location" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now(),
        CONSTRAINT "oil_stocks_quantity_non_negative" CHECK ("oil_stocks"."quantity_liters" >= 0)
      );
    `);

    // Create oil_stock_movements table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "oil_stock_movements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "stock_id" uuid NOT NULL,
        "org_id" uuid NOT NULL,
        "vehicle_id" uuid,
        "service_event_id" uuid,
        "type" "oil_movement_type" NOT NULL,
        "date" date NOT NULL,
        "quantity_liters" numeric(10, 2) NOT NULL,
        "odometer_km" numeric(12, 2),
        "notes" text,
        "user_id" uuid,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Add foreign keys
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_stock_id_oil_stocks_id_fk"
        FOREIGN KEY ("stock_id") REFERENCES "oil_stocks"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_org_id_organizations_id_fk"
        FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_vehicle_id_vehicles_id_fk"
        FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_service_event_id_service_events_id_fk"
        FOREIGN KEY ("service_event_id") REFERENCES "service_events"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stock_movements" ADD CONSTRAINT "oil_stock_movements_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "oil_stocks" ADD CONSTRAINT "oil_stocks_org_id_organizations_id_fk"
        FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_stock_id_idx" ON "oil_stock_movements" USING btree ("stock_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_org_id_idx" ON "oil_stock_movements" USING btree ("org_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_vehicle_id_idx" ON "oil_stock_movements" USING btree ("vehicle_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_service_event_id_idx" ON "oil_stock_movements" USING btree ("service_event_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_vehicle_date_idx" ON "oil_stock_movements" USING btree ("vehicle_id","date");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stock_movements_stock_date_idx" ON "oil_stock_movements" USING btree ("stock_id","date");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stocks_org_oil_type_brand_idx" ON "oil_stocks" USING btree ("org_id","oil_type","brand");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "oil_stocks_org_id_idx" ON "oil_stocks" USING btree ("org_id");
    `);

    // Add copie conforma check constraint if it doesn't exist
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_truck_copie_conforma_check"
        CHECK ("vehicles"."type" = 'TRUCK' OR ("vehicles"."copie_conforma_start_date" IS NULL AND "vehicles"."copie_conforma_expiry_date" IS NULL));
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
