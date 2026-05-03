import { describe, expect, it } from "vitest";
import {
  completeExerciseAndStartRest,
  inferSessionDurationSeconds,
  moveItemById,
  shouldShowTimerRibbon
} from "../lib/workout-state";

describe("workout UI state helpers", () => {
  it("shows the persistent timer ribbon only after start when enabled", () => {
    expect(shouldShowTimerRibbon({ startedAt: "2026-05-03T16:00:00.000Z", ribbonEnabled: true })).toBe(true);
    expect(shouldShowTimerRibbon({ startedAt: null, ribbonEnabled: true })).toBe(false);
  });

  it("infers session duration from first completed set to last completed set", () => {
    expect(inferSessionDurationSeconds([
      { startedAt: "2026-05-03T16:00:00.000Z", endedAt: "2026-05-03T16:01:00.000Z" },
      { startedAt: "2026-05-03T16:03:00.000Z", endedAt: "2026-05-03T16:04:30.000Z" }
    ])).toBe(270);
  });

  it("reorders by id for touch-friendly controls", () => {
    expect(moveItemById(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
  });

  it("completes an exercise and starts rest before the next exercise", () => {
    const result = completeExerciseAndStartRest({
      exercises: [{ id: "ex1", completed: false }, { id: "ex2", completed: false }],
      selectedExerciseId: "ex1",
      defaultRestSeconds: 90,
      now: "2026-05-03T16:00:00.000Z"
    }, "ex1");

    expect(result.exercises[0].completed).toBe(true);
    expect(result.selectedExerciseId).toBe("ex2");
    expect(result.activeRest).toMatchObject({ afterExerciseId: "ex1", nextExerciseId: "ex2", durationSeconds: 90 });
  });
});
