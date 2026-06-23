-- Adds per-day-type macro targets to the settings table.
-- Idempotent and additive — safe to run on an existing database that was created
-- with 0000_init.sql before these columns existed.

ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "training_protein" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "training_carbs" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "training_fat" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "rest_protein" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "rest_carbs" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "rest_fat" integer;
