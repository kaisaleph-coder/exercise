# Product Specification — Workout Logger PWA

## Purpose

Replace the user's spreadsheet workout log with a faster Android/web PWA that supports workout logging, cycle programming, analytics, Excel import/export, and progressive overload recommendations.

## Target user

Single user. Personal app. Novice technical skill level.

## Primary workflows

1. Log today's workout quickly on phone.
2. Review generated progression recommendation.
3. Edit recommendations before accepting them.
4. View cycle-to-cycle analytics.
5. Track per-exercise progress.
6. Export clean Excel reports.
7. Import historical Excel data with review/audit.
8. Use offline and sync later.
9. Avoid conflicts when phone and browser are both open.

## Required screens

- Login
- Dashboard
- Workout Logger
- Program Builder
- Progression
- Import Review
- Analytics
- Devices/Conflicts
- Settings
- Exercise Database

## Must-have UI behavior

- Persistent timer ribbon after workout starts.
- Exercise selection.
- Exercise drag/reorder.
- Muscle-group color themes.
- Workout-specific notes.
- Collapsible exercises and sets.
- Hide completed sets/exercises.
- Complete exercise and transition to rest before next exercise.
- Program day drag/reorder.
- Structured day editor.
- Editable recommendations.
- Progression skip for cycle.
- Selectable analytics lookback.
- Per-exercise tracker.
- Advanced theme/UI/button settings.
- Exercise database grouped by muscle group.
# Current Implementation Status

Phase 1 foundation is implemented with a working Next.js PWA shell, tested domain modules, Supabase migration, local mock adapters, and beginner setup docs. The app is not yet connected to live Supabase or PowerSync.
