# SINGLE CODEX MASTER PROMPT — Workout Logger PWA

You are Codex. Build a production-grade workout logging, programming, analytics, and progressive overload web app to replace an existing Excel workout workbook. Treat the user as a novice technical user: all setup instructions, status notes, README content, command explanations, and troubleshooting guidance must be step-by-step, plain-language, and explicit.

This prompt is the complete implementation brief. Do not ask the user for additional product clarification unless there is a true blocker. Make reasonable implementation choices where needed, document them, and continue.

---

## 0. Project goal

Build a single-user, login-protected, Android-installable, browser-accessible, mobile-optimized PWA that replaces the user's current spreadsheet-based workout log. The app must support fast workout logging, offline use, Excel import/export, cycle programming, analytics, progress tracking, bodyweight/calisthenics tracking, device conflict handling, and customizable progressive overload recommendations.

The user currently tracks workouts in an Excel workbook and almost exclusively uses a `Log` sheet. The app should import that history, preserve audit data, clean up the structure, and then become the primary logging/programming system.

---

## 1. User technical level

The user is a novice technical user.

Implement and document accordingly:

- Every setup step must be numbered.
- Include exact terminal commands.
- Explain where commands should be run.
- Include `.env.example` and explain each variable.
- Include screenshots placeholders or descriptive UI instructions where possible.
- Include troubleshooting sections for common beginner issues.
- Avoid assuming the user knows Git, Node, Supabase, PWA installation, database migrations, or environment variables.
- Add a `START_HERE_FOR_NOVICE.md` file at repo root.
- Add a `README.md` that is beginner-friendly but still technically complete.
- After each major build phase, update docs with “What is done,” “How to test it,” and “What to review.”

---

## 2. Non-negotiable product decisions

Build the following:

- Platform: Android + web browser through a PWA.
- App type: mobile-optimized PWA, not native Android.
- User model: single-user personal app, but all data should still include `user_id`.
- Authentication: login required.
- Offline: required; workouts must be loggable offline and sync later.
- Database: use a real relational database as the system of record.
- Storage/backup: Google Drive or OneDrive may be used only for backup/export; do not use them as the primary database or sync engine.
- Conflict handling: warn when phone and browser are both active; allow the user to terminate one active session from the other; if both edit before syncing, ask the user to select which version to keep.
- Excel export: required.
- Import review: required before committing imported spreadsheet data.
- Deployment target: self-hosted or private-cloud style.

---

## 3. Required technical stack

Use this stack unless there is a hard technical blocker:

- Monorepo structure.
- Frontend/PWA: Next.js App Router + TypeScript.
- Styling/UI: Tailwind CSS + shadcn/ui or equivalent accessible component system.
- Backend/database: Supabase Postgres + Supabase Auth + Row Level Security.
- Offline sync: PowerSync JavaScript Web SDK with local SQLite syncing to Postgres.
- Excel import/export: ExcelJS or SheetJS/xlsx. Prefer ExcelJS if it gives better audit/export control.
- Unit testing: Vitest.
- End-to-end testing: Playwright.
- Validation: Zod where helpful.
- Drag/reorder behavior: use a touch-friendly approach suitable for Android PWA. Browser-native drag-and-drop is not enough for production mobile.

If Supabase, PowerSync, or any external service cannot be fully configured inside the coding environment, create typed adapters, local mocks, setup instructions, and integration placeholders that are ready for the user to connect later. Do not leave vague placeholders.

---

## 4. Required repository structure

Create this structure:

```text
workout-pwa/
  AGENTS.md
  README.md
  START_HERE_FOR_NOVICE.md
  .env.example
  package.json
  pnpm-workspace.yaml or equivalent
  apps/
    web/
      app/
      components/
      hooks/
      lib/
      public/
      tests/
  packages/
    db/
      schema/
      migrations/
      types/
      rls/
    importer/
      src/
      tests/
    analytics/
      src/
      tests/
    progression/
      src/
      tests/
    sync/
      src/
      tests/
    export/
      src/
      tests/
    shared/
      src/
  scripts/
    import-log.ts
    seed-dev.ts
    export-excel.ts
  data/
    source/
      README.md
    exports/
      README.md
  docs/
    product-spec.md
    architecture.md
    novice-setup-guide.md
    import-rules.md
    progression-rules.md
    analytics-export.md
    data-model.md
    ui-requirements.md
    test-plan.md
    troubleshooting.md
```

---

## 5. Source spreadsheet facts

The source workbook has a `Log` sheet. The meaningful content is `A1:Q2142`.

Rows:

- Rows 1–2 are headers.
- Rows 2093–2142 lack cycle/day/date and should be treated as prior templates and disregarded.
- A row with Excel date serial `0` should be deleted/rejected from active import. Optionally preserve it only as rejected audit data.

Columns:

```text
A: cycle
B: day
C: Excel date serial
D: exercise order
E: muscle group / day status / total label
F: exercise name
G: source volume, usually formula-driven
H: set count
I:J: set 1 reps / weight
K:L: set 2 reps / weight
M:N: set 3 reps / weight
O:P: set 4 reps / weight
Q: free-text note
```

Known import facts:

- Dated source range is approximately June 15, 2025 through May 3, 2026, excluding bad date serials.
- Cycles represented: 36.
- Training/rest/sick/activity days: about 320.
- Training days with exercise rows: about 180.
- Actual exercise rows with usable logged data: about 948.
- Summary total rows: about 427.
- Placeholder rows: about 523.
- Note cells: about 804.
- The sheet contains many formulas in volume column G.
- Some volume formulas are fragile or wrong.
- Some source volume values intentionally or accidentally differ from direct set calculation.
- Total rows sometimes multiply unilateral movements by 2.
- Bodyweight/calisthenics are inconsistently represented in source with `150`, `1`, or blank values.

The app must not reproduce the spreadsheet structure directly. It must normalize the data.

---

## 6. Import requirements

### 6.1 Row classification

Classify each Log row as one of:

```text
header
exercise
rest_day
sick_day
summary_total
placeholder
note_only
template_ignored
deleted_bad_date
unknown
```

### 6.2 Import rules

1. Parse only the `Log` sheet.
2. Read only meaningful columns `A:Q`.
3. Ignore rows 1–2 as headers.
4. Ignore/disregard rows 2093–2142 and any similar rows lacking cycle/day/date that are prior templates.
5. Reject rows with Excel date serial `0`.
6. Create one `workout_day` per unique valid cycle/day/date.
7. Convert `Rest` rows into rest days.
8. Convert `Sick` rows into sick/recovery days.
9. Skip `- Total` rows as primary records, but preserve source/audit records.
10. Skip placeholder rows as primary records, but preserve audit if helpful.
11. Convert each exercise row into a `workout_exercise` and one or more `set_logs`.
12. Preserve source row number, raw values, source formulas, and source volume.
13. Recompute app volume with cleaner logic.
14. Flag all volume mismatches.
15. Parse notes into raw notes plus candidate tags.
16. Merge aliases automatically only when confidence is high.
17. Flag uncertain aliases, muscle groups, unilateral flags, bodyweight classifications, formula issues, and note tags for review.
18. Do not commit imported workout data until the import review is approved.

### 6.3 Import review screen

Before committing imported data, show a review screen with:

- Exercise aliases to merge.
- Uncertain exercise matches.
- Muscle group mappings.
- Unilateral exercise flags.
- Bodyweight/calisthenics exclusions.
- Volume mismatches.
- Formula mismatches.
- Deleted bad-date rows.
- Ignored template rows.
- Parsed note tags.

The user should be able to approve, reject, or edit mappings before import commit.

---

## 7. Canonical training model

### 7.1 Muscle groups

Canonical groups:

```text
Chest
Back
Shoulders
Biceps
Triceps
Core
Legs
```

Each exercise belongs primarily to one of those groups. Historical source names like rear delts, side delts, lats, wrists, neck, etc. should be mapped into the nearest canonical group and flagged for review if uncertain.

### 7.2 Exercise aliases

Automatically merge obvious aliases, for example capitalization and minor spelling differences. Flag uncertain merges.

Examples to handle:

- `Incline DB Curl` vs `Incline DB curl`
- shoulder/rear delt naming variants
- calisthenics misspellings
- Bayesian curl variants

### 7.3 Bodyweight/calisthenics

Rules:

- Track bodyweight/calisthenics separately from resistance volume.
- Exclude bodyweight/calisthenics from resistance volume totals.
- Track bodyweight/calisthenics by reps, sets, density, session history, and PRs.
- Initial bodyweight seed: 150 lb.
- Track bodyweight over time.
- Bodyweight exercise progression is reps-only by default.
- Do not count source `150` or `1` substitutions as resistance volume.

### 7.4 Unilateral exercises

Rules:

- Store set load exactly as logged.
- Double unilateral resistance volume in analytics.
- Do not double the set's load value.
- User can edit unilateral flag per exercise in Exercise Database.

### 7.5 Warmups and special sets

- Do not track warmup sets separately.
- Support special set markers:
  - myoreps
  - drop set
  - partials
  - failure
- RIR/RPE are optional.

---

## 8. Volume and metrics rules

Resistance volume:

```text
sum(reps * load_lb for completed sets) * unilateral_multiplier
```

Where:

```text
unilateral_multiplier = 2 if exercise.is_unilateral else 1
```

Bodyweight/calisthenics:

```text
excluded from resistance volume
tracked using reps, sets, density, bodyweight at workout date, and PRs
```

Set count:

```text
completed working sets only
```

PR categories:

- Best load for reps.
- Best reps at load.
- Best total exercise resistance volume.
- Best session volume by muscle group.
- Best bodyweight reps.
- Best density where timing exists.

---

## 9. Program and cycle model

Keep the app close to the user's existing cycle/day structure, but allow custom and suggested programs.

Required program behavior:

- Cycles remain first-class.
- Days remain first-class.
- Program blocks are supported.
- User can reorder days by drag/press-and-hold.
- User can edit each day in a structured way.
- Day preview lets the user select each exercise.
- Day preview lets the user drag exercises to change order after recommendations are generated.
- User can add/remove exercises from a day.
- User can accept generated recommendations or manually edit them.

---

## 10. Progression engine

Progression must be fully customizable.

### 10.1 Scope

Progression rules can exist at:

- global level
- program-block level
- exercise level

Exercise and program-block rules are most important.

### 10.2 Default progression model

Default is hybrid rep-first + double progression:

1. Keep the same load while increasing reps toward the target range.
2. Once all working sets hit the top target, increase load by configured increment.
3. After increasing load, reset reps to lower/middle target.
4. Recommendations are advisory only; never enforce changes.

### 10.3 Default target inference

For each exercise, infer defaults from the last 3 imported cycles:

- common set count
- practical low/high rep targets
- recent working load
- equipment-based increment
- bodyweight/calisthenics mode if applicable

Flag exercises with insufficient or inconsistent data.

### 10.4 Load increments

```text
dumbbell: 2.5 lb
barbell: 5 lb
cable: 2.5 lb
machine: 2.5 lb
bodyweight: reps only
```

### 10.5 Deload/repeat triggers

Default triggers:

- failed progression
- pain/injury notes
- low adherence

Other deload triggers should be configurable.

### 10.6 Cycle-level skip progression

Add a global option to skip progression for a cycle. When enabled:

- Do not apply new recommendations as defaults.
- Still generate recommendations.
- Still log every recommendation in a detailed progression log.
- Analytics must be able to use the progression log.
- Future recommendations must be able to reference skipped/logged recommendations.

### 10.7 Recommendation editing

User must be able to edit recommendations before they become future defaults.

Each recommendation should include:

- recommended sets
- target low reps
- target high reps
- recommended load where applicable
- progression mode
- rationale
- warning level
- fallback if missed
- log-only option
- accept-as-default option
- user override JSON/details

---

## 11. Timing requirements

Display time persistently in a ribbon once a workout has started.

### 11.1 Persistent timer ribbon

Once workout starts, show a persistent ribbon across app screens with:

- session elapsed time
- active rest timer or status
- selected/current exercise
- completed sets / total sets
- quick link back to workout logger

The user can disable or configure this ribbon in Settings, but default is on.

### 11.2 Session timing

Default session duration:

```text
session_start = timestamp of first completed set
session_end = timestamp of last completed set
session_duration = session_end - session_start
```

Also support:

- manual start/stop timer
- manual duration override
- rest/break time between sets

### 11.3 Set and rest timing

When set starts:

```text
set_started_at = now
```

When set completes:

```text
set_ended_at = now
set_duration_seconds = set_ended_at - set_started_at
auto-start rest timer
```

When next set starts:

```text
previous_set.rest_after_seconds = next_set.started_at - previous_set.ended_at
```

### 11.4 Exercise timing

Infer exercise duration:

```text
exercise_duration = last set end - first set start
```

Prioritize:

- set duration
- rest duration
- total session duration

---

## 12. UI/UX requirements from interactive preview v2

A static prototype is included in the handoff package at `prototype/index.html`. Use it as a reference for layout, interaction model, and data behaviors. Do not copy it blindly as production code; implement the same behavior with production-quality components and state management.

### 12.1 Global

- Persistent timer ribbon after workout start.
- Session/rest status visible across screens.
- Mobile-first Android PWA layout.
- Desktop browser layout supported.
- Light/dark mode.
- Configurable UI density, button size, font scale, and button layout.

### 12.2 Dashboard

Dashboard should summarize:

- active workout or next workout
- current cycle/day
- recent volume
- sets by group
- PRs
- bodyweight/calisthenics summary
- progression warnings
- import/review status if unresolved

### 12.3 Workout logger

Required behaviors:

- User can select each exercise.
- User can reorder exercises with touch-friendly drag/press-and-hold controls.
- Each exercise's color theme corresponds to muscle group.
- Add workout-specific notes.
- Parse workout notes into tags.
- Exercise cards are collapsible.
- Set details are collapsible.
- Completed sets can be hidden.
- Completed exercises can be hidden.
- User can complete an exercise and automatically transition to a rest period before the following exercise.
- Selected exercise detail panel.
- Exercise-level notes with tag parsing.
- Quick controls for reps/load.
- Add set.
- Copy previous set.
- Complete set.
- Mark failure.
- Mark partials.
- Mark drop set.
- Mark myorep.
- Optional RIR/RPE.
- Skip/substitute exercise.
- Rest timer.
- Session timer.

### 12.4 Program builder

Required behaviors:

- User can drag/reorder days.
- User can edit day contents in a structured way.
- Day preview lets the user select each exercise.
- Day preview lets the user drag/reorder exercises after recommendation generation.
- Add/remove exercises.
- Generate suggested order.
- Manual reorder always allowed.

### 12.5 Progression screen

Required behaviors:

- Global option to skip progression for cycle.
- Progressions still logged when skipped.
- Detailed progression log.
- Editable recommendation values before accepting them as defaults.
- Accept-as-default action.
- Log-only action.
- User override tracking.

### 12.6 Import review

Required behaviors:

- Group warnings by type.
- Resolve alias mappings.
- Resolve muscle group mappings.
- Resolve unilateral flags.
- Resolve bodyweight/calisthenics classifications.
- Review volume/formula mismatches.
- Approve import only after required issues are resolved.

### 12.7 Analytics

Required behaviors:

- User-selectable cycle lookback.
- Cycle comparison.
- Volume by group.
- Sets by group.
- PRs.
- Bodyweight/calisthenics tracker.
- Per-exercise tracker.
- Progression log visible in analytics.
- Use progression history in future recommendations.

### 12.8 Devices

Required behaviors:

- Active session list.
- Warn when phone and browser are both active.
- Terminate one active session from the other.
- Conflict simulation in dev/demo mode.
- Conflict resolver showing mobile/browser versions.
- User chooses mobile version, browser version, or manual merge where implemented.

### 12.9 Settings

Required behaviors:

- Theme mode.
- Accent color.
- UI density.
- Button size.
- Font scale.
- Button layout.
- Persistent timer ribbon toggle.
- Timing/export configuration.
- Exercise database grouped by Chest, Back, Shoulders, Biceps, Triceps, Core, Legs.
- Add/edit/delete exercises.
- Exercise metadata editing: group, equipment, unilateral, bodyweight/calisthenics, increments, rep targets, active/inactive.

---

## 13. Database schema requirements

Create migrations for these tables and enums. Include `created_at` and `updated_at` where useful. Include `user_id` on user-owned records. Add sensible indexes and foreign keys. Add RLS policies for user-owned data.

### 13.1 Users and preferences

- `user_profiles`
- `user_preferences`
- `bodyweight_logs`

### 13.2 Exercise library

- `muscle_groups`
- `exercises`
- `exercise_aliases`

Required exercise fields:

- canonical name
- primary muscle group
- equipment type
- unilateral flag
- bodyweight/calisthenics flag
- excluded-from-resistance-volume flag
- default increment
- default rep targets
- default sets
- active flag

### 13.3 Programming and workouts

- `programs`
- `program_blocks`
- `cycles`
- `workout_days`
- `workout_exercises`
- `set_logs`

Workout statuses:

```text
planned
in_progress
completed
rest
sick
skipped
draft
deleted_import_row
```

Set types:

```text
standard
myorep_activation
myorep_cluster
drop
partial
failure
```

### 13.4 Notes and tags

- `notes`
- `note_tags`

Tag types:

```text
location
equipment
pain
injury
form
failure
myorep
drop_set
partial
cable_machine
home
gym
adherence
```

### 13.5 Progression

- `progression_rules`
- `progression_recommendations`
- `progression_log_entries`

Rule scopes:

```text
global
program_block
exercise
```

Progression modes:

```text
rep_first
double_progression
load_first
volume_first
set_first
custom
```

### 13.6 Import audit

- `import_batches`
- `import_source_rows`
- `import_warnings`
- `import_review_decisions`

Warning types:

```text
missing_date
date_serial_zero
unknown_exercise_alias
unknown_muscle_group
volume_mismatch
formula_mismatch
uncertain_unilateral
bodyweight_volume_excluded
note_tag_uncertain
template_row_ignored
```

### 13.7 Device sessions and conflicts

- `device_sessions`
- `sync_conflicts`

Device session statuses:

```text
active
idle
terminated
expired
```

Conflict resolution values:

```text
use_mobile
use_browser
manual_merge
```

---

## 14. Analytics requirements

Implement typed functions and tests for:

- cycle-to-cycle comparison
- user-selectable cycle lookback
- resistance volume by muscle group
- unilateral-adjusted volume
- completed sets by muscle group
- completed vs planned sets
- PR tracking
- bodyweight/calisthenics performance
- per-exercise tracker
- adherence
- pain/injury flag summaries
- progression wins/fails
- progression log analysis
- skipped progression analysis
- recommendation accuracy over time

---

## 15. Excel export requirements

Export a clean `.xlsx` workbook with these sheets:

```text
Workout Log
Set Log
Cycle Summary
Exercise Summary
Muscle Group Volume
PRs
Progression Recommendations
Progression Log
Exercise Tracker
Bodyweight History
Import Audit
Import Warnings
```

Use app-calculated totals, not old spreadsheet formulas. Preserve source row references and audit details.

---

## 16. Device/session behavior

Implement a device-session heartbeat model.

Required:

- Device label.
- Device type: phone, browser, unknown.
- Last seen timestamp.
- Active workout being edited.
- Active/idle/terminated/expired state.
- Warning when another active session is editing the same workout.
- Ability to terminate another session.
- Conflict resolver when offline edits collide.

Conflict resolver should present:

- mobile version
- browser version
- timestamps
- changed fields
- choose mobile
- choose browser
- manual merge placeholder if not fully implemented

---

## 17. PWA requirements

Implement:

- Web app manifest.
- Installable Android PWA basics.
- Service worker or appropriate Next.js PWA integration.
- Offline app shell.
- Offline workout logging.
- Sync status indicator.
- Clear offline/online banner.
- Basic icon assets or placeholders.
- Beginner instructions for installing the app on Android.

---

## 18. Implementation phases

Proceed in disciplined phases. Create working code and tests. Keep the user-facing docs updated after each phase.

### Phase 1 — Foundation

Implement:

1. Monorepo scaffold.
2. Next.js App Router TypeScript app.
3. Tailwind/component setup.
4. Basic PWA manifest/service worker registration.
5. Supabase client setup.
6. Login route and authenticated app shell.
7. `.env.example`.
8. Beginner README.
9. Root `START_HERE_FOR_NOVICE.md`.
10. Placeholder routes:
    - `/login`
    - `/dashboard`
    - `/workout/today`
    - `/program`
    - `/progression`
    - `/import`
    - `/analytics`
    - `/devices`
    - `/settings`
11. Vitest setup.
12. Playwright setup.

### Phase 2 — Database and shared types

Implement:

1. SQL schema and migrations.
2. RLS policies.
3. Shared TypeScript types.
4. Seed data for canonical muscle groups.
5. Seed demo exercise database.
6. Local mocks where needed.

### Phase 3 — Importer

Implement:

1. Excel Log parser.
2. Row classifier.
3. Excel date converter.
4. Set extractor.
5. Source formula/raw-value preservation.
6. Alias normalizer.
7. Muscle-group mapper.
8. Note tag parser.
9. Volume calculator.
10. Import warning generator.
11. Import review state model.
12. Importer unit tests.

### Phase 4 — Workout logger

Implement:

1. Today’s workout route.
2. Exercise cards.
3. Exercise selection.
4. Touch-friendly reordering.
5. Muscle-group color themes.
6. Workout-specific notes.
7. Collapsible exercises/sets/completed items.
8. Set logging.
9. Special set markers.
10. Optional RIR/RPE.
11. Timers and persistent ribbon.
12. Complete exercise and auto-rest-to-next-exercise behavior.
13. Offline-friendly local state.

### Phase 5 — Program builder

Implement:

1. Cycle/day structure.
2. Day drag/reorder.
3. Structured day editor.
4. Day preview.
5. Exercise drag/reorder in day preview.
6. Add/remove exercises.
7. Suggested program generation hooks.

### Phase 6 — Progression engine

Implement:

1. Rule model.
2. Default inference from last 3 imported cycles.
3. Hybrid rep-first/double-progression recommendation engine.
4. Bodyweight reps-only progression.
5. Deload/repeat triggers.
6. Cycle skip progression option.
7. Detailed progression log.
8. Editable recommendations.
9. Accept-as-default/log-only behavior.
10. Tests.

### Phase 7 — Analytics and export

Implement:

1. Cycle comparison.
2. Selectable lookback.
3. Volume by group.
4. Sets by group.
5. PRs.
6. Bodyweight/calisthenics tracker.
7. Per-exercise tracker.
8. Progression log analytics.
9. Excel export with required sheets.
10. Tests.

### Phase 8 — Devices/conflicts

Implement:

1. Device heartbeat.
2. Active session warning.
3. Terminate session controls.
4. Conflict detection.
5. Conflict resolver.
6. Tests.

### Phase 9 — Polish and review

Implement:

1. Settings UI.
2. Exercise database grouped by canonical muscle group.
3. Advanced theme/UI/button configuration.
4. Android PWA install instructions.
5. Full user guide.
6. Final acceptance checklist.

---

## 19. Testing requirements

Create tests for:

- Excel date conversion.
- Log row classification.
- rest/sick/summary/placeholder/template/bad-date handling.
- Exercise set extraction from I:P.
- Volume calculation.
- Unilateral volume doubling.
- Bodyweight exclusion from resistance volume.
- Alias normalization.
- Note-tag parsing.
- Import warning generation.
- Import review state.
- Progression recommendation cases.
- Cycle skip progression behavior.
- Editable recommendation behavior.
- Progression log creation.
- Cycle comparison.
- Selectable lookback.
- Per-exercise tracker.
- PR detection.
- Session timing inference.
- Rest timing inference.
- Persistent timer ribbon state.
- Exercise reorder behavior.
- Program day reorder behavior.
- Device session conflict resolution.
- Excel export sheet generation.

---

## 20. Acceptance criteria

The project is acceptable when:

1. The repo installs cleanly.
2. Unit tests run.
3. E2E test scaffolding runs.
4. PWA manifest/service worker basics exist.
5. Login page and authenticated shell exist.
6. Database schema covers all listed entities.
7. RLS policies exist for user-owned data.
8. Import parser can classify Log rows and generate warnings.
9. Import review can approve/edit/resolve mappings before commit.
10. Volume calculator correctly handles resistance, unilateral exercises, and bodyweight/calisthenics exclusion.
11. Workout logger supports exercise selection, reorder, set logging, special sets, notes, collapse/hide behavior, and complete-exercise-to-rest transition.
12. Persistent timer ribbon appears after workout start.
13. Program builder supports day reorder and structured day editing.
14. Progression engine returns advisory recommendations with rationale.
15. User can skip progression for a cycle while preserving a detailed progression log.
16. User can edit recommendations before accepting them as defaults.
17. Analytics include cycle comparison, lookback selector, volume, sets, PRs, per-exercise tracker, and progression log.
18. Export package generates `.xlsx` with all required sheets.
19. Device/session warning and conflict resolver exist.
20. Settings include advanced UI configuration and exercise database grouped by muscle group.
21. README and novice setup guide are clear enough for a nontechnical user.

---

## 21. Work method

Work in small, testable increments. Prefer typed, tested modules over large untested UI. If there is a choice between visual polish and correctness, prioritize the data model, import logic, progression logic, sync model, and tests first.

Never discard audit data. Never treat old spreadsheet formulas as authoritative. Never include bodyweight/calisthenics in resistance volume. Never enforce progression recommendations without user acceptance. Never require the user to understand technical details without documentation.

At the end of each phase, update:

- `README.md`
- `START_HERE_FOR_NOVICE.md` if setup changed
- relevant docs in `/docs`
- tests
- acceptance checklist

Begin by creating Phase 1 foundation and all documentation scaffolding, then continue through the phases as much as possible.
