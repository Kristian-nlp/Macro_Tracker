-- Multi-user upgrade: adds the users table and scopes existing data by username.
-- Idempotent and additive. Existing rows are assigned to username 'me' — sign in
-- as 'me' (with a new PIN) to access data created before multi-user support.

CREATE TABLE IF NOT EXISTS "users" (
  "username" text PRIMARY KEY NOT NULL,
  "pin_salt" text NOT NULL,
  "pin_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "username" text;
UPDATE "entries" SET "username" = 'me' WHERE "username" IS NULL;
ALTER TABLE "entries" ALTER COLUMN "username" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "entries_user_date_idx" ON "entries" ("username", "date");

ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "username" text;
UPDATE "templates" SET "username" = 'me' WHERE "username" IS NULL;
ALTER TABLE "templates" ALTER COLUMN "username" SET NOT NULL;

CREATE SEQUENCE IF NOT EXISTS "settings_id_seq";
SELECT setval('settings_id_seq', GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "settings"), 1));
ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT nextval('settings_id_seq');
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "username" text;
UPDATE "settings" SET "username" = 'me' WHERE "username" IS NULL;
ALTER TABLE "settings" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "settings_username_uniq" ON "settings" ("username");
