CREATE TABLE IF NOT EXISTS "users" (
  "username" text PRIMARY KEY NOT NULL,
  "pin_salt" text NOT NULL,
  "pin_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "entries" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "label" text NOT NULL,
  "kcal" integer NOT NULL,
  "protein" integer DEFAULT 0 NOT NULL,
  "carbs" integer DEFAULT 0 NOT NULL,
  "fat" integer DEFAULT 0 NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "entries_user_date_idx" ON "entries" ("username", "date");

CREATE SEQUENCE IF NOT EXISTS "settings_id_seq";

CREATE TABLE IF NOT EXISTS "settings" (
  "id" integer PRIMARY KEY DEFAULT nextval('settings_id_seq'),
  "username" text NOT NULL,
  "target" integer,
  "training_protein" integer,
  "training_carbs" integer,
  "training_fat" integer,
  "rest_target" integer,
  "rest_protein" integer,
  "rest_carbs" integer,
  "rest_fat" integer,
  "training_days" jsonb DEFAULT '[1,3,5,0]'::jsonb NOT NULL,
  "overrides" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "settings_username_uniq" ON "settings" ("username");

CREATE TABLE IF NOT EXISTS "templates" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "name" text NOT NULL,
  "kcal" integer NOT NULL,
  "protein" integer DEFAULT 0 NOT NULL,
  "carbs" integer DEFAULT 0 NOT NULL,
  "fat" integer DEFAULT 0 NOT NULL
);
