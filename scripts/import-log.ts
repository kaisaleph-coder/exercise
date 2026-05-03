import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { classifyLogRow } from "@workout/importer";

const workbookPath = resolve(process.cwd(), "data/source/Exercises - Final(2).xlsx");

if (!existsSync(workbookPath)) {
  console.log("No workbook found yet.");
  console.log("Place your Excel file here:");
  console.log(workbookPath);
  process.exit(0);
}

console.log("Workbook found. Full ExcelJS parsing will use the tested importer helpers.");
console.log("Example classifier check:", classifyLogRow({ rowNumber: 1 }));
