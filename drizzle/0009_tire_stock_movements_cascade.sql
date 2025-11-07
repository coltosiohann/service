ALTER TABLE "tire_stock_movements" DROP CONSTRAINT IF EXISTS "tire_stock_movements_stock_id_tire_stocks_id_fk";
ALTER TABLE "tire_stock_movements"
  ADD CONSTRAINT "tire_stock_movements_stock_id_tire_stocks_id_fk"
  FOREIGN KEY ("stock_id") REFERENCES "tire_stocks"("id") ON DELETE CASCADE;
