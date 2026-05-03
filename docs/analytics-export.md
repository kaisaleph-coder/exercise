# Analytics and Export Requirements

## Analytics

Required:

- Cycle-to-cycle comparison.
- Selectable cycle lookback.
- Resistance volume by muscle group.
- Sets by muscle group.
- PR tracking.
- Bodyweight/calisthenics tracker.
- Per-exercise tracker.
- Progression log analytics.
- Adherence.
- Pain/injury flags.

## Export

Export `.xlsx` with sheets:

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

Use app-calculated values, not spreadsheet formulas.
# Current Implementation Status

Analytics helpers are implemented in `packages/analytics/src/index.ts`.

Export workbook sheet modeling is implemented in `packages/export/src/index.ts`.

The actual ExcelJS `.xlsx` writer is still a follow-up step. ExcelJS is intentionally not installed in the current foundation because its latest release currently pulls a vulnerable transitive `uuid` dependency and the app does not use ExcelJS code yet.
