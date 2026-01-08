ALTER TABLE "projects" RENAME COLUMN "snapshot_browser" TO "snapshot_browsers";
ALTER TABLE "projects" ADD COLUMN "viewports" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "projects" DROP COLUMN "snapshot_width";
ALTER TABLE "projects" DROP COLUMN "snapshot_height";
