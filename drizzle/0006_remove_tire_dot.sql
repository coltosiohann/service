ALTER TABLE "tire_stocks" DROP COLUMN IF EXISTS "dot";
DROP INDEX IF EXISTS "tire_stocks_org_brand_model_dimension_dot_idx";
CREATE INDEX IF NOT EXISTS "tire_stocks_org_brand_model_dimension_idx"
  ON "tire_stocks" ("org_id", "brand", "model", "dimension");
