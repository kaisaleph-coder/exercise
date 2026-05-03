import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseWorkoutLogWorkbook } from "../src/index";

const workbookPath = resolve(process.cwd(), "data/source/Exercises - Final.xlsx");
const maybeIt = existsSync(workbookPath) ? it : it.skip;

describe("actual workbook import preview", () => {
  maybeIt("reads the Log sheet A:Q range and preserves raw values and formulas", async () => {
    const preview = await parseWorkoutLogWorkbook(workbookPath);

    expect(preview.sheetName).toBe("Log");
    expect(preview.sourceRows).toHaveLength(2142);
    expect(preview.sourceRows[0].rowType).toBe("header");
    expect(preview.sourceRows[0].rawValues).toHaveProperty("A");
    expect(preview.sourceRows.some((row) => Object.keys(row.rawFormulas).includes("G"))).toBe(true);
  });

  maybeIt("classifies workbook rows into the required review buckets", async () => {
    const preview = await parseWorkoutLogWorkbook(workbookPath);

    expect(preview.summary.header).toBe(2);
    expect(preview.summary.template_ignored).toBe(50);
    expect(preview.summary.deleted_bad_date).toBeGreaterThanOrEqual(1);
    expect(preview.summary.exercise).toBeGreaterThan(900);
    expect(preview.summary.summary_total).toBeGreaterThan(350);
    expect(preview.summary.placeholder).toBeGreaterThan(400);
    expect(preview.summary.noteCells).toBeGreaterThan(750);
  });

  maybeIt("creates an import review that blocks commit until required warnings are resolved", async () => {
    const preview = await parseWorkoutLogWorkbook(workbookPath);

    expect(preview.review.canCommit).toBe(false);
    expect(preview.warnings.some((warning) => warning.type === "date_serial_zero")).toBe(true);
    expect(preview.warnings.some((warning) => warning.type === "template_row_ignored")).toBe(true);
    expect(preview.warnings.some((warning) => warning.type === "volume_mismatch")).toBe(true);
    expect(preview.warnings.some((warning) => warning.type === "formula_mismatch")).toBe(true);
  });

  maybeIt("builds normalized workout-day and set-log previews without committing them", async () => {
    const preview = await parseWorkoutLogWorkbook(workbookPath);

    expect(preview.normalized.workoutDays.length).toBeGreaterThan(250);
    expect(preview.normalized.workoutExercises.length).toBeGreaterThan(900);
    expect(preview.normalized.setLogs.length).toBeGreaterThan(2000);
    expect(preview.normalized.workoutExercises.some((exercise) => exercise.sourceRowNumber > 0 && exercise.computedResistanceVolume >= 0)).toBe(true);
  });
});
