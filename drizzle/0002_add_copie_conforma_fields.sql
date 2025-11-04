-- Add Copie Conforma fields to vehicles table
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "copie_conforma_start_date" date;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "copie_conforma_expiry_date" date;

-- Add check constraint to ensure Copie Conforma fields are only for trucks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_truck_copie_conforma_check'
  ) THEN
    ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_truck_copie_conforma_check"
      CHECK ("type" = 'TRUCK' OR ("copie_conforma_start_date" IS NULL AND "copie_conforma_expiry_date" IS NULL));
  END IF;
END $$;

-- Add index for Copie Conforma expiry date for trucks
CREATE INDEX IF NOT EXISTS "vehicles_truck_copie_conforma_idx" ON "vehicles" ("type", "copie_conforma_expiry_date")
  WHERE "type" = 'TRUCK';
