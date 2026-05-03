export const REQUIRED_EXPORT_SHEETS = [
  "Workout Log",
  "Set Log",
  "Cycle Summary",
  "Exercise Summary",
  "Muscle Group Volume",
  "PRs",
  "Progression Recommendations",
  "Progression Log",
  "Exercise Tracker",
  "Bodyweight History",
  "Import Audit",
  "Import Warnings"
] as const;

export interface WorkbookSheet {
  name: (typeof REQUIRED_EXPORT_SHEETS)[number];
  rows: Record<string, unknown>[];
}

export interface WorkbookModel {
  generatedAt: string;
  sheets: WorkbookSheet[];
}

export function buildWorkbookModel(input: {
  workoutLog?: Record<string, unknown>[];
  setLog?: Record<string, unknown>[];
  cycleSummary?: Record<string, unknown>[];
  exerciseSummary?: Record<string, unknown>[];
  muscleGroupVolume?: Record<string, unknown>[];
  prs?: Record<string, unknown>[];
  progressionRecommendations?: Record<string, unknown>[];
  progressionLog?: Record<string, unknown>[];
  exerciseTracker?: Record<string, unknown>[];
  bodyweightHistory?: Record<string, unknown>[];
  importAudit?: Record<string, unknown>[];
  importWarnings?: Record<string, unknown>[];
}): WorkbookModel {
  const rowsBySheet: Record<(typeof REQUIRED_EXPORT_SHEETS)[number], Record<string, unknown>[]> = {
    "Workout Log": input.workoutLog ?? [],
    "Set Log": input.setLog ?? [],
    "Cycle Summary": input.cycleSummary ?? [],
    "Exercise Summary": input.exerciseSummary ?? [],
    "Muscle Group Volume": input.muscleGroupVolume ?? [],
    PRs: input.prs ?? [],
    "Progression Recommendations": input.progressionRecommendations ?? [],
    "Progression Log": input.progressionLog ?? [],
    "Exercise Tracker": input.exerciseTracker ?? [],
    "Bodyweight History": input.bodyweightHistory ?? [],
    "Import Audit": input.importAudit ?? [],
    "Import Warnings": input.importWarnings ?? []
  };

  return {
    generatedAt: new Date().toISOString(),
    sheets: REQUIRED_EXPORT_SHEETS.map((name) => ({ name, rows: rowsBySheet[name] }))
  };
}
