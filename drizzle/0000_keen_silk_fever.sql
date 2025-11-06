CREATE TYPE "public"."document_kind" AS ENUM('INSURANCE', 'ITP', 'REGISTRATION', 'PHOTO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('OWNER', 'ADMIN', 'MECHANIC', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."odometer_source" AS ENUM('MANUAL', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."reminder_channel" AS ENUM('EMAIL', 'IN_APP');--> statement-breakpoint
CREATE TYPE "public"."reminder_kind" AS ENUM('DATE', 'ODOMETER');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('PENDING', 'SENT', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."service_event_type" AS ENUM('OIL_CHANGE', 'REVISION', 'REPAIR', 'INSPECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tire_movement_type" AS ENUM('INTRARE', 'IESIRE', 'MONTARE', 'DEMONTARE');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('OK', 'DUE_SOON', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('CAR', 'TRUCK', 'EQUIPMENT');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" date
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odometer_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value_km" numeric(12, 2) NOT NULL,
	"source" "odometer_source" DEFAULT 'MANUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"service_event_id" uuid,
	"kind" "reminder_kind" NOT NULL,
	"due_date" date,
	"due_km" numeric(12, 2),
	"lead_km" integer DEFAULT 1000 NOT NULL,
	"lead_days" integer DEFAULT 30 NOT NULL,
	"status" "reminder_status" DEFAULT 'PENDING' NOT NULL,
	"channel" "reminder_channel" DEFAULT 'EMAIL' NOT NULL,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"type" "service_event_type" NOT NULL,
	"date" date NOT NULL,
	"odometer_km" numeric(12, 2),
	"next_due_km" numeric(12, 2),
	"next_due_date" date,
	"notes" text,
	"cost_currency" text DEFAULT 'RON',
	"cost_amount" numeric(10, 2),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"vin" text,
	"license_plate" text NOT NULL,
	"current_odometer_km" numeric(12, 2) DEFAULT '0' NOT NULL,
	"last_oil_change_date" date,
	"last_revision_date" date,
	"next_revision_at_km" numeric(12, 2),
	"next_revision_date" date,
	"insurance_provider" text,
	"insurance_policy_number" text,
	"insurance_start_date" date,
	"insurance_end_date" date,
	"copie_conforma_start_date" date,
	"copie_conforma_expiry_date" date,
	"has_heavy_tonnage_authorization" boolean,
	"tachograph_check_date" date,
	"status" "vehicle_status" DEFAULT 'OK' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vehicles_truck_authorization_check" CHECK ("vehicles"."type" = 'TRUCK' OR "vehicles"."has_heavy_tonnage_authorization" IS NULL),
	CONSTRAINT "vehicles_truck_tachograph_check" CHECK ("vehicles"."type" = 'TRUCK' OR "vehicles"."tachograph_check_date" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_logs" ADD CONSTRAINT "odometer_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_service_event_id_service_events_id_fk" FOREIGN KEY ("service_event_id") REFERENCES "public"."service_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_stock_id_tire_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."tire_stocks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stock_movements" ADD CONSTRAINT "tire_stock_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_stocks" ADD CONSTRAINT "tire_stocks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_vehicle_kind_idx" ON "documents" USING btree ("vehicle_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_unique" ON "memberships" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "odometer_logs_vehicle_date_idx" ON "odometer_logs" USING btree ("vehicle_id","date");--> statement-breakpoint
CREATE INDEX "reminders_due_date_idx" ON "reminders" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "reminders_due_km_idx" ON "reminders" USING btree ("due_km");--> statement-breakpoint
CREATE INDEX "service_events_vehicle_date_idx" ON "service_events" USING btree ("vehicle_id","date");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tire_stock_movements_stock_id_idx" ON "tire_stock_movements" USING btree ("stock_id");--> statement-breakpoint
CREATE INDEX "tire_stock_movements_org_id_idx" ON "tire_stock_movements" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tire_stock_movements_vehicle_id_idx" ON "tire_stock_movements" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "tire_stock_movements_vehicle_date_idx" ON "tire_stock_movements" USING btree ("vehicle_id","date");--> statement-breakpoint
CREATE INDEX "tire_stock_movements_stock_date_idx" ON "tire_stock_movements" USING btree ("stock_id","date");--> statement-breakpoint
CREATE INDEX "tire_stocks_org_brand_model_dimension_dot_idx" ON "tire_stocks" USING btree ("org_id","brand","model","dimension","dot");--> statement-breakpoint
CREATE INDEX "tire_stocks_org_id_idx" ON "tire_stocks" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_org_license_plate_unique" ON "vehicles" USING btree ("org_id","license_plate");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_vin_unique" ON "vehicles" USING btree ("vin") WHERE "vehicles"."vin" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "vehicles_truck_authorization_idx" ON "vehicles" USING btree ("type","has_heavy_tonnage_authorization") WHERE "vehicles"."type" = 'TRUCK';--> statement-breakpoint
CREATE INDEX "vehicles_truck_tachograph_idx" ON "vehicles" USING btree ("type","tachograph_check_date") WHERE "vehicles"."type" = 'TRUCK';--> statement-breakpoint
CREATE INDEX "vehicles_insurance_end_date_idx" ON "vehicles" USING btree ("insurance_end_date");