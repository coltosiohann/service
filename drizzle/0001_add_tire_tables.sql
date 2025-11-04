CREATE TABLE IF NOT EXISTS "tire_stocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "size" text NOT NULL,
  "brand" text,
  "notes" text,
  "quantity" integer NOT NULL DEFAULT 0 CHECK ("quantity" >= 0),
  "min_quantity" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tire_stocks_org_id_size_unique" ON "tire_stocks" ("org_id", "size");
CREATE INDEX IF NOT EXISTS "tire_stocks_org_id_idx" ON "tire_stocks" ("org_id");

CREATE TABLE IF NOT EXISTS "tire_stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "stock_id" uuid NOT NULL REFERENCES "tire_stocks" ("id") ON DELETE CASCADE,
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "vehicle_id" uuid REFERENCES "vehicles" ("id") ON DELETE SET NULL,
  "change" integer NOT NULL,
  "reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tire_stock_movements_stock_id_idx" ON "tire_stock_movements" ("stock_id");
CREATE INDEX IF NOT EXISTS "tire_stock_movements_org_id_idx" ON "tire_stock_movements" ("org_id");
CREATE INDEX IF NOT EXISTS "tire_stock_movements_vehicle_id_idx" ON "tire_stock_movements" ("vehicle_id");
