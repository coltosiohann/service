ALTER TABLE "service_events" DROP COLUMN IF EXISTS "cost_currency";
ALTER TABLE "service_events" DROP COLUMN IF EXISTS "cost_amount";
ALTER TABLE "service_events" DROP CONSTRAINT IF EXISTS "service_events_created_by_users_id_fk";
ALTER TABLE "service_events" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "service_events"
  ADD CONSTRAINT "service_events_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
