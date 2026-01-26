ALTER TABLE "snapshots" ADD COLUMN "viewport_width" double precision NOT NULL;
ALTER TABLE "snapshots" ADD COLUMN "viewport_height" double precision NOT NULL;
ALTER TABLE "snapshots" ADD COLUMN "browser" varchar NOT NULL;