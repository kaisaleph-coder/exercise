import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MUSCLE_GROUPS } from "@workout/shared";

const migration = readFileSync(resolve(process.cwd(), "packages/db/migrations/0001_initial_schema.sql"), "utf8");
const seed = readFileSync(resolve(process.cwd(), "packages/db/schema/seed-demo-exercises.sql"), "utf8");

const userOwnedTables = [
  "bodyweight_logs",
  "exercises",
  "exercise_aliases",
  "programs",
  "program_blocks",
  "cycles",
  "workout_days",
  "workout_exercises",
  "set_logs",
  "notes",
  "note_tags",
  "progression_rules",
  "progression_recommendations",
  "progression_log_entries",
  "import_batches",
  "import_source_rows",
  "import_warnings",
  "import_review_decisions",
  "device_sessions",
  "sync_conflicts"
];

describe("Supabase schema", () => {
  it("keeps every user-owned table protected by user_id and RLS", () => {
    for (const table of userOwnedTables) {
      expect(migration, `${table} should declare user_id`).toContain("user_id uuid not null references user_profiles(id) on delete cascade");
      expect(migration, `${table} should enable RLS`).toContain(`alter table %I enable row level security`);
      expect(migration, `${table} should be included in RLS loop`).toContain(`'${table}'`);
    }
  });

  it("seeds canonical muscle groups in required order", () => {
    for (const [index, group] of MUSCLE_GROUPS.entries()) {
      expect(migration).toContain(`('${group}', ${index + 1})`);
    }
  });

  it("uses indexes for common lookup and sync conflict paths", () => {
    expect(migration).toContain("create index idx_workout_days_user_date");
    expect(migration).toContain("create index idx_set_logs_exercise_order");
    expect(migration).toContain("create index idx_sync_conflicts_user_unresolved");
  });

  it("demo exercise seed requires a user id and excludes bodyweight from resistance volume", () => {
    expect(seed).toContain(":'user_id'::uuid");
    expect(seed).toContain("('Pushups', 'Chest', 'bodyweight', false, true, 0, 15, 25, 3)");
    expect(seed).toContain("seed.is_bodyweight");
  });
});
