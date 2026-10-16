CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"eid" varchar NOT NULL,
	"build_id" uuid NOT NULL,
	"trace_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"secret" varchar(64) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "webhook_events_eid_unique" UNIQUE("eid"),
	CONSTRAINT "webhook_events_trace_id_unique" UNIQUE("trace_id")
);

ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "type_idx" ON "webhook_events" USING btree ("type");