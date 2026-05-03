# Test Plan

## Importer tests

- Excel date conversion.
- Row classification.
- Date serial 0 rejection.
- Template rows ignored.
- Rest/sick rows.
- Summary totals skipped.
- Set extraction.
- Volume mismatch detection.
- Bodyweight exclusion.
- Unilateral doubling.
- Alias normalization.
- Note parsing.

## Progression tests

- Rep-first recommendation.
- Double progression load increase.
- Bodyweight reps-only progression.
- Pain/injury deload warning.
- Low adherence warning.
- Failed progression repeat/deload.
- Skip progression cycle behavior.
- Edit/accept recommendation behavior.

## Analytics tests

- Cycle comparison.
- Lookback selection.
- Volume by group.
- Sets by group.
- Per-exercise tracker.
- PR detection.
- Progression log analytics.

## UI/e2e tests

- Login route.
- Dashboard route.
- Workout logging.
- Exercise reorder.
- Persistent timer ribbon.
- Complete exercise starts rest.
- Program day reorder.
- Import review flow.
- Conflict resolver.
- Settings exercise database.

## Export tests

- Required sheets exist.
- Source audit references preserved.
- App calculations exported.
# Current Test Status

Run:

```powershell
npm.cmd test
```

Current coverage includes importer rules, volume/analytics, progression recommendations, sync conflicts, export sheet modeling, and workout state helpers.

Phase 2 adds coverage for shared Zod schemas, seed data, local mock records, and SQL migration/RLS audit checks.

Phase 3 adds coverage for the actual workbook import preview. If the private workbook is missing, those workbook-specific tests are skipped; when present locally, they verify `Log` sheet parsing, raw/formula preservation, row classification, review-blocking warnings, and normalized preview records.
