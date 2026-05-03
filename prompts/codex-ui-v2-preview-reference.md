# Codex UI implementation prompt — v2 preview changes

Apply the v2 interactive preview behavior to the production Workout Logger PWA implementation.

Reference file: `prototype/index.html` from the v2 preview package.

Required UI/UX behavior:

- Show a persistent time ribbon once a workout starts. It must remain visible across app screens and show session time, active rest time/status, selected exercise, set progress, and logger shortcut.
- Workout screen:
  - User can select an exercise.
  - User can drag exercises to reorder the workout.
  - Exercise card color theme corresponds to canonical muscle group.
  - Workout-specific notes are editable and tag-parsed.
  - Exercises, set details, completed sets, and completed exercises are collapsible/hideable.
  - Completing an exercise completes remaining sets, starts a rest period, and transitions context to the following exercise.
- Program screen:
  - User can drag days into a new order.
  - Day contents are edited using structured fields.
  - Day preview allows exercise selection and drag reorder after recommendations are generated.
- Progression screen:
  - Add global cycle-level skip progression option.
  - Even when skipped, all recommendations must be written to a detailed progression log.
  - The progression log must be usable by analytics and future recommendation logic.
  - User can edit recommendation values before accepting them as future defaults.
- Analytics screen:
  - Add selectable cycle lookback.
  - Add per-exercise tracker.
  - Include progression log visibility and future hooks for recommendation analysis.
- Settings screen:
  - Add advanced user configuration for theme, accent, UI density, button size/layout, font scale, persistent timer ribbon, and timer behavior.
  - Add exercise database grouped by Chest, Back, Shoulders, Biceps, Triceps, Core, and Legs.
  - User can add new exercises and edit exercise metadata.

Preserve core product rules from the existing Codex package: Android/browser PWA, login, single-user, offline-first, Supabase/Postgres, PowerSync/local SQLite, Excel import/export, cleaner volume calculations, unilateral 2x volume, bodyweight excluded from resistance volume, and fully customizable progression.
