import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseWorkoutLogWorkbook } from "@workout/importer";

const candidates = [
  resolve(process.cwd(), "data/source/Exercises - Final.xlsx"),
  resolve(process.cwd(), "data/source/Exercises - Final(2).xlsx")
];
const workbookPath = candidates.find((candidate) => existsSync(candidate));

if (!workbookPath) {
  console.log("No workbook found yet.");
  console.log("Place your Excel file in one of these paths:");
  for (const candidate of candidates) {
    console.log(candidate);
  }
  process.exit(0);
}

async function main() {
  const preview = await parseWorkoutLogWorkbook(workbookPath);

  console.log(`Workbook found: ${workbookPath}`);
  console.log("Import preview created. No data was committed.");
  console.log("");
  console.log("Row summary:");
  console.log(`- rows seen: ${preview.summary.rowsSeen}`);
  console.log(`- exercise candidates: ${preview.summary.exercise}`);
  console.log(`- rest days: ${preview.summary.rest_day}`);
  console.log(`- sick days: ${preview.summary.sick_day}`);
  console.log(`- summary totals preserved for audit: ${preview.summary.summary_total}`);
  console.log(`- placeholders preserved for audit/review: ${preview.summary.placeholder}`);
  console.log(`- template rows ignored: ${preview.summary.template_ignored}`);
  console.log(`- bad date rows rejected: ${preview.summary.deleted_bad_date}`);
  console.log(`- note cells: ${preview.summary.noteCells}`);
  console.log(`- formula cells in A:Q: ${preview.summary.formulaCells}`);
  console.log("");
  console.log("Normalized preview:");
  console.log(`- workout days: ${preview.normalized.workoutDays.length}`);
  console.log(`- workout exercises: ${preview.normalized.workoutExercises.length}`);
  console.log(`- set logs: ${preview.normalized.setLogs.length}`);
  console.log("");
  console.log(`Review can commit now: ${preview.review.canCommit ? "yes" : "no, required review items remain"}`);
  console.log(`Warnings generated: ${preview.warnings.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
