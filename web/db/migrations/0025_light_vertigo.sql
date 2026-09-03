ALTER TABLE "accounts" ADD COLUMN "issuer" text;

UPDATE "accounts" 
SET "issuer" = 'local:credential' 
WHERE "provider_id" = 'credential' AND "issuer" IS NULL;