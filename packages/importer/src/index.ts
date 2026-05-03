import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";
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

export interface ImportSourceRowPreview {
  sheetName: string;
  sourceRowNumber: number;
  rawValues: Record<string, string | number | boolean | null>;
  rawFormulas: Record<string, string>;
  rowType: ImportRowType;
  sourceVolume?: number;
  computedVolume?: number;
}

export interface NormalizedWorkoutDayPreview {
  id: string;
  cycleNumber: number;
  dayNumber: number;
  date: string;
  status: "planned" | "rest" | "sick";
  sourceRows: number[];
}

export interface NormalizedWorkoutExercisePreview {
  id: string;
  workoutDayId: string;
  sourceRowNumber: number;
  exerciseName: string;
  muscleGroup?: string;
  orderIndex?: number;
  sourceVolume?: number;
  computedResistanceVolume: number;
  warnings: ImportWarningType[];
}

export interface NormalizedSetLogPreview {
  id: string;
  workoutExerciseId: string;
  sourceRowNumber: number;
  setIndex: number;
  reps: number;
  loadLb: number;
}

export interface WorkoutLogImportPreview {
  sheetName: "Log";
  sourceRows: ImportSourceRowPreview[];
  warnings: ImportWarning[];
  review: ReturnType<typeof summarizeImportReview>;
  summary: Record<ImportRowType, number> & { rowsSeen: number; noteCells: number; formulaCells: number };
  normalized: {
    workoutDays: NormalizedWorkoutDayPreview[];
    workoutExercises: NormalizedWorkoutExercisePreview[];
    setLogs: NormalizedSetLogPreview[];
  };
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

  if ((extractSetLogs(row).length > 0 || isPresentNumber(row.setCount)) && exerciseName.length > 0) {
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

export function suggestExerciseAliasReview(rawName: string, canonicalNames: string[]) {
  const normalizedRaw = normalizeExerciseAlias(rawName);
  const exact = canonicalNames.find((name) => normalizeExerciseAlias(name) === normalizedRaw);

  if (exact) {
    return {
      rawName,
      suggestedCanonicalName: exact,
      confidence: 0.99,
      needsReview: false
    };
  }

  const compactRaw = normalizedRaw.replace(/[^a-z0-9]/g, "");
  const compact = canonicalNames.find((name) => normalizeExerciseAlias(name).replace(/[^a-z0-9]/g, "") === compactRaw);

  return {
    rawName,
    suggestedCanonicalName: compact,
    confidence: compact ? 0.85 : 0,
    needsReview: true
  };
}

export function mapSourceMuscleGroup(source: string) {
  const normalized = source.trim().toLowerCase();

  if (/\bchest\b/.test(normalized)) {
    return { source, canonical: "Chest", confidence: 0.99, needsReview: false };
  }
  if (/\bback\b|\blat\b|\brow\b/.test(normalized)) {
    return { source, canonical: "Back", confidence: 0.95, needsReview: false };
  }
  if (/\bshoulders?\b|\bdelts?\b|\bneck\b/.test(normalized)) {
    return { source, canonical: "Shoulders", confidence: 0.9, needsReview: false };
  }
  if (/\bbiceps?\b|\bcurl\b|\bwrists?\b|\bforearms?\b/.test(normalized)) {
    return { source, canonical: "Biceps", confidence: /\bwrists?\b|\bforearms?\b/.test(normalized) ? 0.55 : 0.99, needsReview: /\bwrists?\b|\bforearms?\b/.test(normalized) };
  }
  if (/\btricep\b|\bdip\b/.test(normalized)) {
    return { source, canonical: "Triceps", confidence: 0.99, needsReview: false };
  }
  if (/\bcore\b|\bab\b|\bcrunch\b|\bplank\b/.test(normalized)) {
    return { source, canonical: "Core", confidence: 0.95, needsReview: false };
  }
  if (/\bleg\b|\bquad\b|\bhamstring\b|\bcalf\b|\bsquat\b|\blunge\b/.test(normalized)) {
    return { source, canonical: "Legs", confidence: 0.95, needsReview: false };
  }

  return { source, canonical: undefined, confidence: 0, needsReview: true };
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

const XLSX_COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"] as const;

type XlsxCellValue = string | number | boolean | null;

interface ParsedXlsxCell {
  value: XlsxCellValue;
  formula?: string;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function decodeXml(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function getTextNode(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(getTextNode).join("");
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (objectValue["#text"] !== undefined) {
      return getTextNode(objectValue["#text"]);
    }
    if (objectValue.t !== undefined) {
      return getTextNode(objectValue.t);
    }
    if (objectValue.r !== undefined) {
      return getTextNode(asArray(objectValue.r).map((run) => (run as Record<string, unknown>).t));
    }
  }
  return "";
}

function parseMaybeNumber(value: string): string | number {
  const trimmed = value.trim();
  if (trimmed !== "" && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return value;
}

function getFormulaText(formulaNode: unknown): string | undefined {
  if (formulaNode === undefined || formulaNode === null) {
    return undefined;
  }
  if (typeof formulaNode === "string" || typeof formulaNode === "number") {
    return String(formulaNode);
  }
  if (typeof formulaNode === "object") {
    const text = getTextNode(formulaNode);
    return text.length > 0 ? text : "[shared-or-empty-formula]";
  }
  return undefined;
}

function splitCellRef(cellRef: string): { column: string; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(cellRef);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }
  return { column: match[1], row: Number(match[2]) };
}

function parseSharedStrings(zipEntries: Record<string, Uint8Array>, parser: XMLParser): string[] {
  const sharedStringsEntry = zipEntries["xl/sharedStrings.xml"];
  if (!sharedStringsEntry) {
    return [];
  }
  const parsed = parser.parse(decodeXml(sharedStringsEntry));
  return asArray(parsed.sst?.si).map((item) => getTextNode(item));
}

function relationshipTargetToPath(target: string): string {
  const normalized = target.replace(/\\/g, "/");
  if (normalized.startsWith("/")) {
    return normalized.slice(1);
  }
  if (normalized.startsWith("xl/")) {
    return normalized;
  }
  return `xl/${normalized}`;
}

function findWorksheetPath(zipEntries: Record<string, Uint8Array>, parser: XMLParser, sheetName: string): string {
  const workbookEntry = zipEntries["xl/workbook.xml"];
  const relsEntry = zipEntries["xl/_rels/workbook.xml.rels"];
  if (!workbookEntry || !relsEntry) {
    throw new Error("Workbook metadata is missing from the .xlsx file.");
  }

  const workbook = parser.parse(decodeXml(workbookEntry));
  const rels = parser.parse(decodeXml(relsEntry));
  const sheet = asArray(workbook.workbook?.sheets?.sheet).find((candidate) => String((candidate as Record<string, unknown>).name) === sheetName) as Record<string, unknown> | undefined;
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" was not found.`);
  }

  const relationshipId = String(sheet["r:id"]);
  const relationship = asArray(rels.Relationships?.Relationship).find((candidate) => String((candidate as Record<string, unknown>).Id) === relationshipId) as Record<string, unknown> | undefined;
  if (!relationship) {
    throw new Error(`Relationship for sheet "${sheetName}" was not found.`);
  }

  return relationshipTargetToPath(String(relationship.Target));
}

function parseWorksheetCells(zipEntries: Record<string, Uint8Array>, parser: XMLParser, worksheetPath: string, sharedStrings: string[]): Map<string, ParsedXlsxCell> {
  const worksheetEntry = zipEntries[worksheetPath];
  if (!worksheetEntry) {
    throw new Error(`Worksheet XML was not found at ${worksheetPath}.`);
  }

  const parsed = parser.parse(decodeXml(worksheetEntry));
  const rows = asArray(parsed.worksheet?.sheetData?.row);
  const cells = new Map<string, ParsedXlsxCell>();

  for (const row of rows) {
    for (const cell of asArray((row as Record<string, unknown>).c)) {
      const cellObject = cell as Record<string, unknown>;
      const ref = String(cellObject.r ?? "");
      if (!ref) {
        continue;
      }
      const type = String(cellObject.t ?? "");
      const rawValue = cellObject.v;
      const formula = getFormulaText(cellObject.f);
      let value: XlsxCellValue = null;

      if (type === "s") {
        value = sharedStrings[Number(rawValue)] ?? "";
      } else if (type === "inlineStr") {
        value = getTextNode(cellObject.is);
      } else if (type === "b") {
        value = String(rawValue) === "1";
      } else if (type === "str") {
        value = getTextNode(rawValue);
      } else if (rawValue !== undefined) {
        value = parseMaybeNumber(getTextNode(rawValue));
      }

      cells.set(ref, { value, formula });
    }
  }

  return cells;
}

function numberFromValue(value: XlsxCellValue): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }
  return undefined;
}

function textFromValue(value: XlsxCellValue): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function logRowFromRaw(rowNumber: number, rawValues: Record<string, XlsxCellValue>): LogRow {
  return {
    rowNumber,
    cycle: rawValues.A ?? undefined,
    day: rawValues.B ?? undefined,
    excelDateSerial: numberFromValue(rawValues.C),
    exerciseOrder: numberFromValue(rawValues.D),
    muscleOrStatus: textFromValue(rawValues.E),
    exerciseName: textFromValue(rawValues.F),
    sourceVolume: numberFromValue(rawValues.G),
    setCount: numberFromValue(rawValues.H),
    set1Reps: numberFromValue(rawValues.I),
    set1Load: numberFromValue(rawValues.J),
    set2Reps: numberFromValue(rawValues.K),
    set2Load: numberFromValue(rawValues.L),
    set3Reps: numberFromValue(rawValues.M),
    set3Load: numberFromValue(rawValues.N),
    set4Reps: numberFromValue(rawValues.O),
    set4Load: numberFromValue(rawValues.P),
    note: textFromValue(rawValues.Q)
  };
}

function canonicalWorkoutStatus(rowType: ImportRowType): "planned" | "rest" | "sick" {
  if (rowType === "rest_day") {
    return "rest";
  }
  if (rowType === "sick_day") {
    return "sick";
  }
  return "planned";
}

function isLikelyBodyweightExercise(name: string): boolean {
  return /\b(push\s*up|pull\s*up|chin\s*up|dip|plank|sit\s*up|calisthenic|bodyweight)\b/i.test(name);
}

function warningKey(warning: ImportWarning): string {
  return `${warning.sourceRowNumber ?? "none"}:${warning.type}:${warning.message}`;
}

function createEmptySummary(): WorkoutLogImportPreview["summary"] {
  return {
    header: 0,
    exercise: 0,
    rest_day: 0,
    sick_day: 0,
    summary_total: 0,
    placeholder: 0,
    note_only: 0,
    template_ignored: 0,
    deleted_bad_date: 0,
    unknown: 0,
    rowsSeen: 0,
    noteCells: 0,
    formulaCells: 0
  };
}

export async function parseWorkoutLogWorkbook(filePath: string, options: { maxRow?: number } = {}): Promise<WorkoutLogImportPreview> {
  const maxRow = options.maxRow ?? 2142;
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false
  });
  const zipEntries = unzipSync(new Uint8Array(await readFile(filePath)));
  const sharedStrings = parseSharedStrings(zipEntries, parser);
  const worksheetPath = findWorksheetPath(zipEntries, parser, "Log");
  const cells = parseWorksheetCells(zipEntries, parser, worksheetPath, sharedStrings);
  const sourceRows: ImportSourceRowPreview[] = [];
  const warningsByKey = new Map<string, ImportWarning>();
  const summary = createEmptySummary();
  const workoutDaysByKey = new Map<string, NormalizedWorkoutDayPreview>();
  const workoutExercises: NormalizedWorkoutExercisePreview[] = [];
  const setLogs: NormalizedSetLogPreview[] = [];

  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const rawValues: Record<string, XlsxCellValue> = {};
    const rawFormulas: Record<string, string> = {};

    for (const column of XLSX_COLUMNS) {
      const cell = cells.get(`${column}${rowNumber}`);
      if (cell?.value !== undefined && cell.value !== null) {
        rawValues[column] = cell.value;
      }
      if (cell?.formula) {
        rawFormulas[column] = cell.formula;
      }
    }

    const logRow = logRowFromRaw(rowNumber, rawValues);
    const rowType = classifyLogRow(logRow);
    const isBodyweight = isLikelyBodyweightExercise(String(logRow.exerciseName ?? ""));
    const computedVolume = rowType === "exercise" ? calculateImportedResistanceVolume(logRow, { isBodyweight }) : undefined;
    const sourceRow: ImportSourceRowPreview = {
      sheetName: "Log",
      sourceRowNumber: rowNumber,
      rawValues,
      rawFormulas,
      rowType,
      sourceVolume: logRow.sourceVolume,
      computedVolume
    };
    sourceRows.push(sourceRow);
    summary.rowsSeen += 1;
    summary[rowType] += 1;
    if (logRow.note) {
      summary.noteCells += 1;
      for (const tag of parseNoteTags(logRow.note)) {
        if (tag.needsReview) {
          const warning: ImportWarning = {
            type: "note_tag_uncertain",
            severity: "medium",
            message: `Review parsed note tag "${tag.type}" from note text.`,
            sourceRowNumber: rowNumber,
            resolved: false
          };
          warningsByKey.set(warningKey(warning), warning);
        }
      }
    }
    summary.formulaCells += Object.keys(rawFormulas).length;

    const generatedWarnings = generateImportWarnings({
      rowNumber,
      rowType,
      sourceVolume: logRow.sourceVolume,
      computedVolume,
      formula: rawFormulas.G,
      isBodyweight
    });
    for (const warning of generatedWarnings) {
      warningsByKey.set(warningKey(warning), warning);
    }

    if (
      rowType !== "header" &&
      rowType !== "template_ignored" &&
      rowType !== "deleted_bad_date" &&
      logRow.excelDateSerial &&
      logRow.cycle !== undefined &&
      logRow.day !== undefined
    ) {
      const cycleNumber = Number(logRow.cycle);
      const dayNumber = Number(logRow.day);
      if (Number.isFinite(cycleNumber) && Number.isFinite(dayNumber)) {
        const date = convertExcelSerialDate(logRow.excelDateSerial);
        const key = `${cycleNumber}:${dayNumber}:${date}`;
        if (!workoutDaysByKey.has(key)) {
          workoutDaysByKey.set(key, {
            id: `wd-${workoutDaysByKey.size + 1}`,
            cycleNumber,
            dayNumber,
            date,
            status: canonicalWorkoutStatus(rowType),
            sourceRows: []
          });
        }
        workoutDaysByKey.get(key)?.sourceRows.push(rowNumber);

        if (rowType === "exercise" && logRow.exerciseName) {
          const workoutDay = workoutDaysByKey.get(key)!;
          const workoutExerciseId = `we-${workoutExercises.length + 1}`;
          const rowWarnings = generatedWarnings.map((warning) => warning.type);
          workoutExercises.push({
            id: workoutExerciseId,
            workoutDayId: workoutDay.id,
            sourceRowNumber: rowNumber,
            exerciseName: logRow.exerciseName,
            muscleGroup: logRow.muscleOrStatus,
            orderIndex: logRow.exerciseOrder,
            sourceVolume: logRow.sourceVolume,
            computedResistanceVolume: computedVolume ?? 0,
            warnings: rowWarnings
          });

          for (const set of extractSetLogs(logRow)) {
            setLogs.push({
              id: `set-${setLogs.length + 1}`,
              workoutExerciseId,
              sourceRowNumber: rowNumber,
              setIndex: set.setIndex,
              reps: set.reps,
              loadLb: set.loadLb
            });
          }
        }
      }
    }
  }

  const warnings = [...warningsByKey.values()].map((warning, index) => ({ ...warning, id: warning.id ?? `warning-${index + 1}` }));

  return {
    sheetName: "Log",
    sourceRows,
    warnings,
    review: summarizeImportReview(warnings),
    summary,
    normalized: {
      workoutDays: [...workoutDaysByKey.values()],
      workoutExercises,
      setLogs
    }
  };
}
