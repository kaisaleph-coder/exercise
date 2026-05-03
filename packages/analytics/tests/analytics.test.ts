import { describe, expect, it } from "vitest";
import {
  calculateAdherence,
  cycleComparison,
  detectPersonalRecords,
  filterCyclesByLookback,
  perExerciseTracker,
  resistanceVolumeByMuscleGroup
} from "../src/index";

const workouts = [
  {
    cycleNumber: 35,
    status: "completed" as const,
    exercises: [
      { exerciseId: "curl", exerciseName: "Incline DB Curl", muscleGroup: "Biceps", isUnilateral: false, isBodyweight: false, plannedSets: 3, sets: [{ reps: 10, loadLb: 20, completed: true }, { reps: 10, loadLb: 20, completed: true }] },
      { exerciseId: "pushup", exerciseName: "Pushups", muscleGroup: "Chest", isUnilateral: false, isBodyweight: true, plannedSets: 3, sets: [{ reps: 20, loadLb: 150, completed: true }] }
    ]
  },
  {
    cycleNumber: 36,
    status: "completed" as const,
    exercises: [
      { exerciseId: "curl", exerciseName: "Incline DB Curl", muscleGroup: "Biceps", isUnilateral: false, isBodyweight: false, plannedSets: 3, sets: [{ reps: 12, loadLb: 20, completed: true }, { reps: 12, loadLb: 20, completed: true }] },
      { exerciseId: "split", exerciseName: "Bulgarian Split Squat", muscleGroup: "Legs", isUnilateral: true, isBodyweight: false, plannedSets: 2, sets: [{ reps: 10, loadLb: 25, completed: true }] }
    ]
  }
];

describe("analytics", () => {
  it("excludes bodyweight and doubles unilateral resistance volume", () => {
    expect(resistanceVolumeByMuscleGroup(workouts)).toEqual({
      Biceps: 880,
      Legs: 500
    });
  });

  it("filters cycles by user-selected lookback", () => {
    expect(filterCyclesByLookback(workouts, 1).map((workout) => workout.cycleNumber)).toEqual([36]);
  });

  it("compares cycle resistance volume", () => {
    expect(cycleComparison(workouts)).toEqual([
      { cycleNumber: 35, resistanceVolume: 400, completedSets: 3 },
      { cycleNumber: 36, resistanceVolume: 980, completedSets: 3 }
    ]);
  });

  it("tracks per-exercise history and PRs", () => {
    expect(perExerciseTracker(workouts, "curl").map((row) => row.totalVolume)).toEqual([400, 480]);
    expect(detectPersonalRecords(workouts)).toContainEqual({ exerciseId: "curl", exerciseName: "Incline DB Curl", category: "best_total_exercise_resistance_volume", value: 480, cycleNumber: 36 });
  });

  it("calculates completed versus planned adherence", () => {
    expect(calculateAdherence(workouts)).toEqual({ completedSets: 6, plannedSets: 11, percent: 55 });
  });
});
