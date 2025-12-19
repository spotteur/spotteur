CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"base_url" varchar NOT NULL,
	"compare_to_build_id" uuid,
	"identifier" varchar,
	"page_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"build_id" uuid NOT NULL,
	"page_path" varchar NOT NULL,
	"diff_percentage" integer NOT NULL,
	"approval_status" varchar NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"screenshot_media_id" uuid NOT NULL,
	"compare_to_screenshot_media_id" uuid,
	"diff_screenshot_media_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"width" integer,
	"height" integer,
	"path" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);

ALTER TABLE "projects" ALTER COLUMN "name" SET DATA TYPE varchar;
ALTER TABLE "projects" ADD COLUMN "base_url" varchar NOT NULL;
ALTER TABLE "projects" ADD COLUMN "token" varchar NOT NULL;
ALTER TABLE "projects" ADD COLUMN "snapshot_browser" varchar NOT NULL;
ALTER TABLE "projects" ADD COLUMN "snapshot_selector" varchar NOT NULL;
ALTER TABLE "projects" ADD COLUMN "snapshot_width" integer NOT NULL;
ALTER TABLE "projects" ADD COLUMN "snapshot_height" integer NOT NULL;
ALTER TABLE "projects" ADD COLUMN "page_paths" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_screenshot_media_id_media_id_fk" FOREIGN KEY ("screenshot_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_compare_to_screenshot_media_id_media_id_fk" FOREIGN KEY ("compare_to_screenshot_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_diff_screenshot_media_id_media_id_fk" FOREIGN KEY ("diff_screenshot_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_token_unique" UNIQUE("token");