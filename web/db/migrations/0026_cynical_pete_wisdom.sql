ALTER TABLE "events" RENAME TO "webhook_events";
ALTER TABLE "webhook_events" DROP CONSTRAINT "events_public_id_unique";
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_public_id_unique" UNIQUE("public_id");