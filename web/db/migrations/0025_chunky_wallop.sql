CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"public_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"secret" varchar(64) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "events_public_id_unique" UNIQUE("public_id")
);

CREATE INDEX "type_idx" ON "events" USING btree ("type");