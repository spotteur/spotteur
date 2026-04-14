CREATE TABLE "build_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"build_id" uuid,
	"snapshot_id" varchar,
	"level" varchar,
	"message" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "build_logs" ADD CONSTRAINT "build_logs_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;