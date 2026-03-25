ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "itp_expiry_date" date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_equipment_itp_check'
  ) THEN
    ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_equipment_itp_check"
      CHECK ("type" <> 'EQUIPMENT' OR "itp_expiry_date" IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "vehicles_itp_expiry_date_idx" ON "vehicles" ("itp_expiry_date");
