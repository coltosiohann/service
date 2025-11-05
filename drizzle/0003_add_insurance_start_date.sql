-- Add insurance start date field to vehicles table
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "insurance_start_date" date;
