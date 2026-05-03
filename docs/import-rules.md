# Import Rules

## Source sheet

Parse only `Log`, range `A:Q`.

## Column mapping

```text
A cycle
B day
C Excel date serial
D order
E muscle group/status/total label
F exercise name
G source volume/formula
H set count
I:J set 1 reps/weight
K:L set 2 reps/weight
M:N set 3 reps/weight
O:P set 4 reps/weight
Q note
```

## Row classes

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

## Rules

- Ignore headers.
- Ignore prior templates without cycle/day/date.
- Reject date serial `0`.
- Skip `- Total` rows as primary data.
- Preserve audit records.
- Convert valid exercise rows into workout exercise and set logs.
- Preserve raw values/formulas/source volume.
- Recalculate app volume.
- Flag volume mismatches.
- Parse notes into candidate tags.
- Require import review before commit.
# Current Implementation Status

The first importer helpers are implemented in `packages/importer/src/index.ts` and tested in `packages/importer/tests/importer.test.ts`.

They currently cover Excel date conversion, row classification, set extraction, alias normalization, note-tag parsing, warning generation, and review commit gating.

## Phase 3 Workbook Preview

The actual uploaded workbook is:

```text
data/source/Exercises - Final.xlsx
```

The importer now reads the `Log` sheet `A:Q` through row `2142`, preserves raw cell values and formulas, and creates a preview only. It does not commit workout data.

Latest local preview:

```text
rows seen: 2142
exercise candidates: 926
rest days: 128
sick days: 5
summary totals preserved for audit: 423
placeholders preserved for audit/review: 478
template rows ignored: 50
bad date rows rejected: 1
note cells: 804
formula cells in A:Q: 1392
workout days: 320
workout exercises: 926
set logs: 2589
warnings generated: 1239
review can commit now: no
```

Run the preview with:

```powershell
npm.cmd run import:log
```

## What To Review

Before committing imported data in a later phase, review:

1. Alias suggestions.
2. Muscle group mappings.
3. Bodyweight/calisthenics exclusions.
4. Unilateral flags.
5. Volume mismatches.
6. Formula mismatches.
7. Deleted bad-date rows.
8. Ignored template rows.
