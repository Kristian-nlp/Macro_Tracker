import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Accounts: username + a hashed 4-digit PIN. */
export const users = pgTable("users", {
  username: text("username").primaryKey(),
  pinSalt: text("pin_salt").notNull(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per logged meal, scoped to a user. */
export const entries = pgTable(
  "entries",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD (user-local)
    time: text("time").notNull(), // HH:MM (user-local)
    label: text("label").notNull(),
    kcal: integer("kcal").notNull(),
    protein: integer("protein").notNull().default(0),
    carbs: integer("carbs").notNull().default(0),
    fat: integer("fat").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDateIdx: index("entries_user_date_idx").on(t.username, t.date),
  }),
);

/** One settings row per user (keyed by username; a surrogate `id` exists in the
 * table with a sequence default but is not modeled here). */
export const settings = pgTable("settings", {
  username: text("username").primaryKey(),
  // Training-day targets (all nullable: set in app, no hardcoded targets)
  target: integer("target"), // training-day kcal target
  trainingProtein: integer("training_protein"),
  trainingCarbs: integer("training_carbs"),
  trainingFat: integer("training_fat"),
  // Rest-day targets
  restTarget: integer("rest_target"), // rest-day kcal target
  restProtein: integer("rest_protein"),
  restCarbs: integer("rest_carbs"),
  restFat: integer("rest_fat"),
  // Weekday numbers, 0 = Sunday. Default training days: Mon/Wed/Fri/Sun.
  trainingDays: jsonb("training_days").$type<number[]>().notNull().default([1, 3, 5, 0]),
  // Per-date day-type overrides: { "YYYY-MM-DD": "training" | "rest" }.
  overrides: jsonb("overrides").$type<Record<string, string>>().notNull().default({}),
});

/** Favourites for one-tap logging, scoped to a user. */
export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  kcal: integer("kcal").notNull(),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  fat: integer("fat").notNull().default(0),
});
