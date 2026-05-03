import { MUSCLE_GROUPS } from "@workout/shared";

console.log("Development seed preview");
console.log("Canonical muscle groups:");
for (const group of MUSCLE_GROUPS) {
  console.log(`- ${group}`);
}
console.log("");
console.log("For Supabase, run packages/db/migrations/0001_initial_schema.sql first.");
console.log("Then run packages/db/schema/seed-demo-exercises.sql after replacing :user_id.");
