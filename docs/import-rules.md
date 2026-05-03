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
