DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'vehicle_type' AND e.enumlabel = 'TRAILER'
  ) THEN
    ALTER TYPE "vehicle_type" ADD VALUE 'TRAILER';
  END IF;
END $$;
