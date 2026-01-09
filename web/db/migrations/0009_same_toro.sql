CREATE TABLE "page_rules" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"snapshot_browsers" text[] DEFAULT '{}'::text[] NOT NULL,
	"viewports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"page_path" varchar NOT NULL,
	"media_reset" boolean DEFAULT true NOT NULL,
	"reduce_motion" boolean DEFAULT true NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "projects" RENAME COLUMN "snapshot_browser" TO "snapshot_browsers";
ALTER TABLE "projects" ADD COLUMN "viewports" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "page_rules" ADD CONSTRAINT "page_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "projects" DROP COLUMN "snapshot_width";
ALTER TABLE "projects" DROP COLUMN "snapshot_height";