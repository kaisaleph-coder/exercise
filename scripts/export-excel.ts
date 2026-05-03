import { buildWorkbookModel } from "@workout/export";

const workbook = buildWorkbookModel({
  workoutLog: [{ note: "Demo export model. Full ExcelJS writing is the next export implementation step." }]
});

console.log(`Prepared workbook model with ${workbook.sheets.length} sheets:`);
for (const sheet of workbook.sheets) {
  console.log(`- ${sheet.name}`);
}
