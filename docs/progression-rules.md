# Progression Rules

## Default model

Hybrid rep-first + double progression.

1. Increase reps first within target range.
2. When all sets reach high target, increase load.
3. Reset target reps after load increase.
4. Recommendation is advisory only.

## Customization

Rules can be set at:

- global level
- program-block level
- exercise level

## Skip progression for cycle

If enabled:

- Generate recommendations.
- Log recommendations.
- Do not apply them as future defaults unless user accepts.
- Use skipped progression data in analytics.

## User editing

User can edit recommendations before accepting them as future defaults.

## Deload triggers

Default triggers:

- failed progression
- pain/injury notes
- low adherence

## Equipment increments

```text
dumbbell 2.5 lb
barbell 5 lb
cable 2.5 lb
machine 2.5 lb
bodyweight reps only
```
# Current Implementation Status

The first progression engine is implemented in `packages/progression/src/index.ts` and tested in `packages/progression/tests/progression.test.ts`.

It supports inferred defaults, rep-first/double progression, bodyweight reps-only recommendations, cycle skip state, log entries, and editable recommendation acceptance.
