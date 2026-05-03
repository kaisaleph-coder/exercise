import { isPresentNumber, resistanceVolumeForSets } from "@workout/shared";

export type ImportRowType =
  | "header"
  | "exercise"
  | "rest_day"
  | "sick_day"
  | "summary_total"
  | "placeholder"
  | "note_only"
  | "template_ignored"
  | "deleted_bad_date"
  | "unknown";

export type ImportWarningType =
  | "missing_date"
  | "date_serial_zero"
  | "unknown_exercise_alias"
  | "unknown_muscle_group"
  | "volume_mismatch"
  | "formula_mismatch"
  | "uncertain_unilateral"
  | "bodyweight_volume_excluded"
  | "note_tag_uncertain"
  | "template_row_ignored";

export interface LogRow {
  rowNumber: number;
  cycle?: number | string;
  day?: number | string;
  excelDateSerial?: number;
  exerciseOrder?: number;
  muscleOrStatus?: string;
  exerciseName?: string;
  sourceVolume?: number;
  setCount?: number;
  set1Reps?: number;
  set1Load?: number;
  set2Reps?: number;
  set2Load?: number;
  set3Reps?: number;
  set3Load?: number;
  set4Reps?: number;
  set4Load?: number;
  note?: string;
}

export interface ExtractedSetLog {
  setIndex: number;
  reps: number;
  loadLb: number;
  completed: true;
}

export interface ParsedNoteTag {
  type: "location" | "equipment" | "pain" | "injury" | "form" | "failure" | "myorep" | "drop_set" | "partial" | "cable_machine" | "home" | "gym" | "adherence";
  value: string;
  confidence: number;
  needsReview: boolean;
}

export interface ImportWarning {
  id?: string;
  type: ImportWarningType;
  severity: "low" | "medium" | "high";
  message: string;
  sourceRowNumber?: number;
  resolved?: boolean;
}

export function convertExcelSerialDate(serial: number): string {
  if (!Number.isFinite(serial) || serial <= 0) {
    throw new Error("Excel date serial must be a positive number.");
  }

  const millisPerDay = 24 * 60 * 60 * 1000;
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + serial * millisPerDay).toISOString().slice(0, 10);
}

export function classifyLogRow(row: LogRow): ImportRowType {
  if (row.rowNumber <= 2) {
    return "header";
  }

  const hasDate = isPresentNumber(row.excelDateSerial);
  const hasCycle = row.cycle !== undefined && row.cycle !== "";
  const hasDay = row.day !== undefined && row.day !== "";

  if (hasDate && row.excelDateSerial === 0) {
    return "deleted_bad_date";
  }

  if (row.rowNumber >= 2093 || (!hasCycle && !hasDay && !hasDate && !!row.exerciseName)) {
    return "template_ignored";
  }

  if ((hasCycle || hasDay) && !hasDate) {
    return "unknown";
  }

  const status = String(row.muscleOrStatus ?? "").trim().toLowerCase();
  const exerciseName = String(row.exerciseName ?? "").trim();

  if (status === "rest" || exerciseName.toLowerCase() === "rest") {
    return "rest_day";
  }

  if (status === "sick" || exerciseName.toLowerCase() === "sick") {
    return "sick_day";
  }

  if (exerciseName.toLowerCase().includes("total") || status.includes("total")) {
    return "summary_total";
  }

  if (extractSetLogs(row).length > 0 && exerciseName.length > 0) {
    return "exercise";
  }

  if (exerciseName.length > 0 || isPresentNumber(row.exerciseOrder)) {
    return "placeholder";
  }

  if (String(row.note ?? "").trim().length > 0) {
    return "note_only";
  }

  return "unknown";
}

export function extractSetLogs(row: LogRow): ExtractedSetLog[] {
  const pairs = [
    [row.set1Reps, row.set1Load],
    [row.set2Reps, row.set2Load],
    [row.set3Reps, row.set3Load],
    [row.set4Reps, row.set4Load]
  ];

  return pairs.flatMap(([reps, load], index) => {
    if (!isPresentNumber(reps) || !isPresentNumber(load)) {
      return [];
    }

    return [{ setIndex: index + 1, reps, loadLb: load, completed: true as const }];
  });
}

export function normalizeExerciseAlias(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseNoteTags(note: string): ParsedNoteTag[] {
  const lower = note.toLowerCase();
  const tags: ParsedNoteTag[] = [];

  if (/\bhome\b/.test(lower)) {
    tags.push({ type: "home", value: "home", confidence: 0.95, needsReview: false });
  }
  if (/\bgym\b/.test(lower)) {
    tags.push({ type: "gym", value: "gym", confidence: 0.95, needsReview: false });
  }
  if (/\bpain\b/.test(lower)) {
    tags.push({ type: "pain", value: "pain", confidence: 0.85, needsReview: true });
  }
  if (/\binjur/.test(lower)) {
    tags.push({ type: "injury", value: "injury", confidence: 0.9, needsReview: true });
  }
  if (/\bdrop\s*set\b/.test(lower)) {
    tags.push({ type: "drop_set", value: "drop set", confidence: 0.9, needsReview: false });
  }
  if (/\bpartial/.test(lower)) {
    tags.push({ type: "partial", value: "partials", confidence: 0.9, needsReview: false });
  }
  if (/\bmyo/.test(lower)) {
    tags.push({ type: "myorep", value: "myorep", confidence: 0.9, needsReview: false });
  }
  if (/\bfail/.test(lower)) {
    tags.push({ type: "failure", value: "failure", confidence: 0.85, needsReview: false });
  }
  if (/\bcable\b|\bmachine\b/.test(lower)) {
    tags.push({ type: "cable_machine", value: "cable/machine", confidence: 0.8, needsReview: true });
  }

  return tags;
}

export function calculateImportedResistanceVolume(row: LogRow, options: { isUnilateral?: boolean; isBodyweight?: boolean } = {}): number {
  return resistanceVolumeForSets(extractSetLogs(row), options);
}

export function generateImportWarnings(input: {
  rowNumber: number;
  rowType: ImportRowType;
  sourceVolume?: number;
  computedVolume?: number;
  formula?: string;
  isBodyweight?: boolean;
}): ImportWarning[] {
  const warnings: ImportWarning[] = [];

  if (input.rowType === "deleted_bad_date") {
    warnings.push({ type: "date_serial_zero", severity: "high", message: "Date serial 0 was rejected from active import.", sourceRowNumber: input.rowNumber, resolved: false });
  }

  if (input.rowType === "template_ignored") {
    warnings.push({ type: "template_row_ignored", severity: "low", message: "Template row was ignored for primary import but preserved for audit.", sourceRowNumber: input.rowNumber, resolved: true });
  }

  if (input.isBodyweight && input.sourceVolume && input.sourceVolume > 0) {
    warnings.push({ type: "bodyweight_volume_excluded", severity: "medium", message: "Bodyweight/calisthenics volume was excluded from resistance totals.", sourceRowNumber: input.rowNumber, resolved: false });
  }

  if (isPresentNumber(input.sourceVolume) && isPresentNumber(input.computedVolume) && Math.abs(input.sourceVolume - input.computedVolume) > 0.01) {
    warnings.push({ type: "volume_mismatch", severity: "medium", message: "Source volume differs from app-calculated volume.", sourceRowNumber: input.rowNumber, resolved: false });
  }

  if (input.formula && /[A-Z]+\d+/.test(input.formula)) {
    warnings.push({ type: "formula_mismatch", severity: "medium", message: "Source formula is preserved for audit but is not authoritative.", sourceRowNumber: input.rowNumber, resolved: false });
  }

  return warnings;
}

const REQUIRED_WARNING_TYPES: ImportWarningType[] = [
  "date_serial_zero",
  "unknown_exercise_alias",
  "unknown_muscle_group",
  "volume_mismatch",
  "formula_mismatch",
  "uncertain_unilateral",
  "bodyweight_volume_excluded",
  "note_tag_uncertain"
];

export function summarizeImportReview(warnings: ImportWarning[]) {
  const grouped = warnings.reduce<Record<string, ImportWarning[]>>((groups, warning) => {
    groups[warning.type] ??= [];
    groups[warning.type].push(warning);
    return groups;
  }, {});
  const openRequiredCount = warnings.filter((warning) => REQUIRED_WARNING_TYPES.includes(warning.type) && !warning.resolved).length;

  return {
    canCommit: openRequiredCount === 0,
    openRequiredCount,
    grouped
  };
}
