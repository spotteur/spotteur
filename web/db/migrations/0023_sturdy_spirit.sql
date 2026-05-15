ALTER TABLE "projects" ADD COLUMN "diff_tolerance_percentage" double precision DEFAULT 0 NOT NULL;
ALTER TABLE "builds" ADD COLUMN "diff_tolerance_percentage" double precision DEFAULT 0 NOT NULL;
