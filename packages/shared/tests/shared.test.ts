import { describe, expect, it } from "vitest";
import {
  CANONICAL_MUSCLE_GROUP_SEEDS,
  DEMO_EXERCISE_SEEDS,
  exerciseSchema,
  MUSCLE_GROUPS,
  userPreferencesSchema
} from "../src/index";

describe("shared Phase 2 types and seeds", () => {
  it("exports canonical muscle group seeds in the required order", () => {
    expect(CANONICAL_MUSCLE_GROUP_SEEDS.map((group) => group.name)).toEqual(MUSCLE_GROUPS);
    expect(CANONICAL_MUSCLE_GROUP_SEEDS.map((group) => group.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("exports demo exercise seeds with bodyweight and unilateral metadata", () => {
    expect(DEMO_EXERCISE_SEEDS).toContainEqual(expect.objectContaining({ canonicalName: "Pushups", isBodyweight: true, excludeFromResistanceVolume: true }));
    expect(DEMO_EXERCISE_SEEDS).toContainEqual(expect.objectContaining({ canonicalName: "Bayesian Cable Curl", isUnilateral: true }));
  });

  it("validates exercise records with zod", () => {
    const parsed = exerciseSchema.parse(DEMO_EXERCISE_SEEDS[0]);
    expect(parsed.canonicalName).toBe("Incline DB Press");
  });

  it("defaults beginner preferences safely", () => {
    expect(userPreferencesSchema.parse({}).defaultBodyweightLb).toBe(150);
    expect(userPreferencesSchema.parse({}).persistentTimerRibbon).toBe(true);
  });
});
