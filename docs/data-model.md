# Data Model

## What Was Built

The migration includes:

1. User profile and preferences.
2. Bodyweight logs.
3. Canonical muscle groups.
4. Exercises and aliases.
5. Programs, blocks, cycles, workout days, workout exercises, and set logs.
6. Notes and note tags.
7. Progression rules, recommendations, and log entries.
8. Import batches, source rows, warnings, and review decisions.
9. Device sessions and sync conflicts.

Every user-owned table has `user_id`.

## How To Run It

Run `packages/db/migrations/0001_initial_schema.sql` in Supabase SQL Editor.

## How To Test It

After running the migration, confirm the canonical muscle groups exist:

```sql
select name from muscle_groups order by sort_order;
```

## What To Review

Check that bodyweight exercises use `is_bodyweight=true` and `exclude_from_resistance_volume=true`.

## Common Errors And Fixes

If RLS blocks data, confirm you are logged in and inserted rows with your own Supabase Auth user id.
