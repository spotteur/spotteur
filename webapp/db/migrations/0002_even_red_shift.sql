ALTER TABLE "builds" RENAME COLUMN "compare_to_build_id" TO "baseline_build_id";
ALTER TABLE "snapshots" RENAME COLUMN "compare_to_screenshot_media_id" TO "baseline_screenshot_media_id";
ALTER TABLE "snapshots" DROP CONSTRAINT "snapshots_compare_to_screenshot_media_id_media_id_fk";

ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_baseline_screenshot_media_id_media_id_fk" FOREIGN KEY ("baseline_screenshot_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;