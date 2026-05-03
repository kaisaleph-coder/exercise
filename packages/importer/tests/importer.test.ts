import { describe, expect, it } from "vitest";
import {
  classifyLogRow,
  convertExcelSerialDate,
  extractSetLogs,
  generateImportWarnings,
  mapSourceMuscleGroup,
  normalizeExerciseAlias,
  parseNoteTags,
  suggestExerciseAliasReview,
  summarizeImportReview
} from "../src/index";

describe("Excel Log importer", () => {
  it("converts Excel date serials using the workbook date system", () => {
    expect(convertExcelSerialDate(45823)).toBe("2025-06-15");
  });

  it("classifies required row types", () => {
    expect(classifyLogRow({ rowNumber: 1, cycle: "Cycle", day: "Day" })).toBe("header");
    expect(classifyLogRow({ rowNumber: 1758, cycle: 35, day: 2, excelDateSerial: 0 })).toBe("deleted_bad_date");
    expect(classifyLogRow({ rowNumber: 2100, exerciseName: "Incline DB Curl" })).toBe("template_ignored");
    expect(classifyLogRow({ rowNumber: 10, cycle: 36, day: 1, excelDateSerial: 45823, muscleOrStatus: "Rest" })).toBe("rest_day");
    expect(classifyLogRow({ rowNumber: 11, cycle: 36, day: 2, excelDateSerial: 45824, muscleOrStatus: "Sick" })).toBe("sick_day");
    expect(classifyLogRow({ rowNumber: 12, cycle: 36, day: 3, excelDateSerial: 45825, exerciseName: "Chest - Total" })).toBe("summary_total");
    expect(classifyLogRow({ rowNumber: 13, cycle: 36, day: 3, excelDateSerial: 45825, exerciseName: "Incline DB Curl", set1Reps: 12, set1Load: 17.5 })).toBe("exercise");
    expect(classifyLogRow({ rowNumber: 14, cycle: 36, day: 3, excelDateSerial: 45825, note: "at home" })).toBe("note_only");
  });

  it("extracts completed set pairs from I:P", () => {
    const sets = extractSetLogs({
      rowNumber: 20,
      set1Reps: 12,
      set1Load: 50,
      set2Reps: 10,
      set2Load: 50,
      set3Reps: undefined,
      set3Load: 50,
      set4Reps: 8,
      set4Load: undefined
    });

    expect(sets).toEqual([
      { setIndex: 1, reps: 12, loadLb: 50, completed: true },
      { setIndex: 2, reps: 10, loadLb: 50, completed: true }
    ]);
  });

  it("normalizes obvious aliases and parses useful note tags", () => {
    expect(normalizeExerciseAlias(" Incline DB curl ")).toBe("incline db curl");
    expect(suggestExerciseAliasReview("Incline DB curl", ["Incline DB Curl"])).toEqual({
      rawName: "Incline DB curl",
      suggestedCanonicalName: "Incline DB Curl",
      confidence: 0.99,
      needsReview: false
    });
    expect(parseNoteTags("Home session. Shoulder pain. Drop set on last set.")).toEqual([
      { type: "home", value: "home", confidence: 0.95, needsReview: false },
      { type: "pain", value: "pain", confidence: 0.85, needsReview: true },
      { type: "drop_set", value: "drop set", confidence: 0.9, needsReview: false }
    ]);
  });

  it("maps source muscle group variants into canonical groups with review flags", () => {
    expect(mapSourceMuscleGroup("Back - Lats")).toEqual({ source: "Back - Lats", canonical: "Back", confidence: 0.95, needsReview: false });
    expect(mapSourceMuscleGroup("Shoulders - Rear Delts")).toEqual({ source: "Shoulders - Rear Delts", canonical: "Shoulders", confidence: 0.9, needsReview: false });
    expect(mapSourceMuscleGroup("Wrists")).toEqual({ source: "Wrists", canonical: "Biceps", confidence: 0.55, needsReview: true });
  });

  it("generates review warnings for volume mismatches and rejected rows", () => {
    const warnings = generateImportWarnings({
      rowNumber: 22,
      rowType: "exercise",
      sourceVolume: 999,
      computedVolume: 600,
      formula: "G21*2",
      isBodyweight: false
    });

    expect(warnings.map((warning) => warning.type)).toContain("volume_mismatch");
    expect(warnings.map((warning) => warning.type)).toContain("formula_mismatch");
  });

  it("keeps import review uncommittable until required warnings are resolved", () => {
    const review = summarizeImportReview([
      { id: "w1", type: "unknown_exercise_alias", severity: "high", resolved: false, message: "Alias needs review" },
      { id: "w2", type: "template_row_ignored", severity: "low", resolved: false, message: "Template preserved" }
    ]);

    expect(review.canCommit).toBe(false);
    expect(review.openRequiredCount).toBe(1);
    expect(review.grouped.unknown_exercise_alias).toHaveLength(1);
  });
});
