CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "membership_role" AS ENUM ('OWNER', 'ADMIN', 'MECHANIC', 'VIEWER');
CREATE TYPE "vehicle_type" AS ENUM ('CAR', 'TRUCK');
CREATE TYPE "vehicle_status" AS ENUM ('OK', 'DUE_SOON', 'OVERDUE');
CREATE TYPE "service_event_type" AS ENUM ('OIL_CHANGE', 'REVISION', 'REPAIR', 'INSPECTION', 'OTHER');
CREATE TYPE "odometer_source" AS ENUM ('MANUAL', 'IMPORT');
CREATE TYPE "document_kind" AS ENUM ('INSURANCE', 'ITP', 'REGISTRATION', 'PHOTO', 'OTHER');
CREATE TYPE "reminder_kind" AS ENUM ('DATE', 'ODOMETER');
CREATE TYPE "reminder_status" AS ENUM ('PENDING', 'SENT', 'DISMISSED');
CREATE TYPE "reminder_channel" AS ENUM ('EMAIL', 'IN_APP');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text,
  "email" text NOT NULL UNIQUE,
  "image" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "accounts" (
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
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
  PRIMARY KEY ("provider", "provider_account_id")
);
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");

CREATE TABLE "sessions" (
  "session_token" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "expires" timestamptz NOT NULL
);
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamptz NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "role" membership_role NOT NULL DEFAULT 'VIEWER',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "memberships_org_user_unique" ON "memberships" ("org_id", "user_id");

CREATE TABLE "vehicles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "type" vehicle_type NOT NULL,
  "make" text NOT NULL,
  "model" text NOT NULL,
  "year" integer NOT NULL,
  "vin" text,
  "license_plate" text NOT NULL,
  "current_odometer_km" numeric(12, 2) NOT NULL DEFAULT 0,
  "last_oil_change_date" date,
  "last_revision_date" date,
  "next_revision_at_km" numeric(12, 2),
  "next_revision_date" date,
  "insurance_provider" text,
  "insurance_policy_number" text,
  "insurance_end_date" date,
  "has_heavy_tonnage_authorization" boolean,
  "tachograph_check_date" date,
  "status" vehicle_status NOT NULL DEFAULT 'OK',
  "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "vehicles_truck_authorization_check" CHECK (type = 'TRUCK' OR has_heavy_tonnage_authorization IS NULL),
  CONSTRAINT "vehicles_truck_tachograph_check" CHECK (type = 'TRUCK' OR tachograph_check_date IS NULL)
);

CREATE UNIQUE INDEX "vehicles_org_license_plate_unique" ON "vehicles" ("org_id", "license_plate");
CREATE UNIQUE INDEX "vehicles_vin_unique" ON "vehicles" ("vin") WHERE vin IS NOT NULL;
CREATE INDEX "vehicles_truck_authorization_idx" ON "vehicles" ("type", "has_heavy_tonnage_authorization") WHERE type = 'TRUCK';
CREATE INDEX "vehicles_truck_tachograph_idx" ON "vehicles" ("type", "tachograph_check_date") WHERE type = 'TRUCK';
CREATE INDEX "vehicles_insurance_end_date_idx" ON "vehicles" ("insurance_end_date");

CREATE TABLE "service_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles" ("id") ON DELETE CASCADE,
  "type" service_event_type NOT NULL,
  "date" date NOT NULL,
  "odometer_km" numeric(12, 2),
  "next_due_km" numeric(12, 2),
  "next_due_date" date,
  "notes" text,
  "cost_currency" text DEFAULT 'RON',
  "cost_amount" numeric(10, 2),
  "created_by" uuid NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "service_events_vehicle_date_idx" ON "service_events" ("vehicle_id", "date" DESC);

CREATE TABLE "odometer_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles" ("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "value_km" numeric(12, 2) NOT NULL,
  "source" odometer_source NOT NULL DEFAULT 'MANUAL',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "odometer_logs_vehicle_date_idx" ON "odometer_logs" ("vehicle_id", "date");

CREATE TABLE "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles" ("id") ON DELETE CASCADE,
  "kind" document_kind NOT NULL,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "uploaded_by" uuid NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "uploaded_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" date
);

CREATE INDEX "documents_vehicle_kind_idx" ON "documents" ("vehicle_id", "kind");

CREATE TABLE "reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles" ("id") ON DELETE CASCADE,
  "service_event_id" uuid REFERENCES "service_events" ("id") ON DELETE SET NULL,
  "kind" reminder_kind NOT NULL,
  "due_date" date,
  "due_km" numeric(12, 2),
  "lead_km" integer NOT NULL DEFAULT 1000,
  "lead_days" integer NOT NULL DEFAULT 30,
  "status" reminder_status NOT NULL DEFAULT 'PENDING',
  "channel" reminder_channel NOT NULL DEFAULT 'EMAIL',
  "last_notified_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "reminders_due_date_idx" ON "reminders" ("due_date");
CREATE INDEX "reminders_due_km_idx" ON "reminders" ("due_km");

CREATE TABLE "tire_stocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "size" text NOT NULL,
  "brand" text,
  "notes" text,
  "quantity" integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  "min_quantity" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "tire_stocks_org_id_size_unique" ON "tire_stocks" ("org_id", "size");
CREATE INDEX "tire_stocks_org_id_idx" ON "tire_stocks" ("org_id");

CREATE TABLE "tire_stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "stock_id" uuid NOT NULL REFERENCES "tire_stocks" ("id") ON DELETE CASCADE,
  "org_id" uuid NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
  "vehicle_id" uuid REFERENCES "vehicles" ("id") ON DELETE SET NULL,
  "change" integer NOT NULL,
  "reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "tire_stock_movements_stock_id_idx" ON "tire_stock_movements" ("stock_id");
CREATE INDEX "tire_stock_movements_org_id_idx" ON "tire_stock_movements" ("org_id");
CREATE INDEX "tire_stock_movements_vehicle_id_idx" ON "tire_stock_movements" ("vehicle_id");

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "link_url" text,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
