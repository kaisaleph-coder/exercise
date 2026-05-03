import { describe, expect, it } from "vitest";
import { createLocalMockStore } from "../src/index";

describe("local mock store", () => {
  it("seeds canonical groups, exercises, preferences, and today's workout", () => {
    const store = createLocalMockStore("user-1");

    expect(store.userId).toBe("user-1");
    expect(store.muscleGroups).toHaveLength(7);
    expect(store.preferences.defaultBodyweightLb).toBe(150);
    expect(store.exercises.find((exercise) => exercise.canonicalName === "Pushups")?.excludeFromResistanceVolume).toBe(true);
    expect(store.workoutDays[0]).toMatchObject({ cycleNumber: 37, dayNumber: 1, status: "planned" });
  });

  it("keeps user-owned mock records scoped to the chosen user id", () => {
    const store = createLocalMockStore("abc-user");

    expect(store.exercises.every((exercise) => exercise.userId === "abc-user")).toBe(true);
    expect(store.workoutDays.every((day) => day.userId === "abc-user")).toBe(true);
  });
});
