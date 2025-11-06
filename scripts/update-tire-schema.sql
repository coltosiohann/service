-- Drop old tire tables if they exist
DROP TABLE IF EXISTS tire_stock_movements CASCADE;
DROP TABLE IF EXISTS tire_stocks CASCADE;
DROP TYPE IF EXISTS tire_movement_type CASCADE;

-- Create new tire_movement_type enum
CREATE TYPE "public"."tire_movement_type" AS ENUM('INTRARE', 'IESIRE', 'MONTARE', 'DEMONTARE');

-- Create new tire_stocks table with updated schema
CREATE TABLE "tire_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"dimension" text NOT NULL,
	"dot" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tire_stocks_quantity_non_negative" CHECK ("tire_stocks"."quantity" >= 0)
);

-- Create new tire_stock_movements table with updated schema
CREATE TABLE "tire_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"type" "tire_movement_type" NOT NULL,
	"date" date NOT NULL,
	"odometer_km" numeric(12, 2),
	"notes" text,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign keys
ALTER TABLE "tire_stocks" ADD CONSTRAINT "tire_stocks_org_id_organizations_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_stock_id_tire_stocks_id_fk"
  FOREIGN KEY ("stock_id") REFERENCES "public"."tire_stocks"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_org_id_organizations_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_vehicle_id_vehicles_id_fk"
  FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes
CREATE INDEX "tire_stocks_org_brand_model_dimension_dot_idx" ON "tire_stocks" USING btree ("org_id","brand","model","dimension","dot");
CREATE INDEX "tire_stocks_org_id_idx" ON "tire_stocks" USING btree ("org_id");
CREATE INDEX "tire_stock_movements_stock_id_idx" ON "tire_stock_movements" USING btree ("stock_id");
CREATE INDEX "tire_stock_movements_org_id_idx" ON "tire_stock_movements" USING btree ("org_id");
CREATE INDEX "tire_stock_movements_vehicle_id_idx" ON "tire_stock_movements" USING btree ("vehicle_id");
CREATE INDEX "tire_stock_movements_vehicle_date_idx" ON "tire_stock_movements" USING btree ("vehicle_id","date");
CREATE INDEX "tire_stock_movements_stock_date_idx" ON "tire_stock_movements" USING btree ("stock_id","date");
