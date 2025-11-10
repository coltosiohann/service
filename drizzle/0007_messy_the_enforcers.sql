ALTER TYPE "public"."vehicle_type" ADD VALUE 'TRAILER';--> statement-breakpoint
ALTER TABLE "service_events" DROP CONSTRAINT "service_events_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tire_stock_movements" DROP CONSTRAINT "tire_stock_movements_stock_id_tire_stocks_id_fk";
--> statement-breakpoint
DROP INDEX "tire_stocks_org_brand_model_dimension_dot_idx";--> statement-breakpoint
ALTER TABLE "service_events" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD COLUMN "driver_name" text;--> statement-breakpoint
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_stock_id_tire_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."tire_stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tire_stocks_org_brand_model_dimension_idx" ON "tire_stocks" USING btree ("org_id","brand","model","dimension");--> statement-breakpoint
ALTER TABLE "service_events" DROP COLUMN "cost_currency";--> statement-breakpoint
ALTER TABLE "service_events" DROP COLUMN "cost_amount";--> statement-breakpoint
ALTER TABLE "tire_stocks" DROP COLUMN "dot";