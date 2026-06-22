CREATE TABLE IF NOT EXISTS "entries" (
  "id" text PRIMARY KEY NOT NULL,
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

CREATE INDEX IF NOT EXISTS "entries_date_idx" ON "entries" ("date");

CREATE TABLE IF NOT EXISTS "settings" (
  "id" integer PRIMARY KEY NOT NULL,
  "target" integer,
  "rest_target" integer,
  "protein_target" integer,
  "training_days" jsonb DEFAULT '[1,3,5,0]'::jsonb NOT NULL,
  "overrides" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "templates" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "kcal" integer NOT NULL,
  "protein" integer DEFAULT 0 NOT NULL,
  "carbs" integer DEFAULT 0 NOT NULL,
  "fat" integer DEFAULT 0 NOT NULL
);

INSERT INTO "settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
