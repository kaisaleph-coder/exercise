import { describe, expect, it } from "vitest";
import { REQUIRED_EXPORT_SHEETS, buildWorkbookModel } from "../src/index";

describe("Excel export model", () => {
  it("declares every required export sheet", () => {
    expect(REQUIRED_EXPORT_SHEETS).toEqual([
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
    ]);
  });

  it("builds a workbook model using app-calculated totals", () => {
    const workbook = buildWorkbookModel({
      workoutLog: [{ date: "2026-05-03", exercise: "Incline DB Curl", appVolume: 480, sourceRow: 12 }],
      setLog: [{ exercise: "Incline DB Curl", reps: 12, loadLb: 20 }],
      importWarnings: [{ sourceRowNumber: 12, type: "volume_mismatch", message: "Source formula differed." }]
    });

    expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(REQUIRED_EXPORT_SHEETS);
    expect(workbook.sheets[0].rows[0]).toMatchObject({ appVolume: 480 });
  });
});
