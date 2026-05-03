# AGENTS.md — Workout Logger PWA

## Role

You are building a personal workout logging PWA for a novice technical user. Prioritize correctness, clarity, auditability, and step-by-step documentation.

## Persistent project rules

- Android + web PWA, not native Android.
- Single-user personal app, but every user-owned table must use `user_id`.
- Login required.
- Offline logging required.
- Supabase Postgres/Auth/RLS is the system of record.
- PowerSync/local SQLite is the offline-first sync layer.
- Drive/OneDrive are backup/export targets only, not primary storage.
- Excel import/export required.
- Imported spreadsheet formulas are not authoritative.
- Preserve source rows, raw values, formulas, and source volume for audit.
- Bodyweight/calisthenics are excluded from resistance volume and tracked separately.
- Unilateral resistance volume is doubled in analytics.
- Progression recommendations are advisory only.
- User can edit recommendations before accepting them as future defaults.
- User can skip progression for a cycle while still logging recommendations.
- Include beginner-friendly setup and testing instructions.

## Canonical muscle groups

Chest, Back, Shoulders, Biceps, Triceps, Core, Legs.

## Important UI requirements

- Persistent workout timer ribbon once workout starts.
- Workout exercises selectable, draggable/reorderable, color-coded by muscle group, collapsible.
- Sets collapsible; completed sets/exercises can be hidden.
- Complete exercise should transition to rest before next exercise.
- Program days and day exercises reorderable.
- Analytics include selectable lookback and per-exercise tracker.
- Settings include advanced UI/theme/button configuration and exercise database grouped by muscle group.

## Documentation style

The user is a novice. Every major task must include:

1. What was built.
2. How to run it.
3. How to test it.
4. What the user should review.
5. Common errors and fixes.
