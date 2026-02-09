ALTER TABLE "sessions" ADD COLUMN "impersonated_by" uuid;
ALTER TABLE "users" ADD COLUMN "role" varchar DEFAULT 'user' NOT NULL;
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "ban_reason" text;
ALTER TABLE "users" ADD COLUMN "ban_expires" numeric;