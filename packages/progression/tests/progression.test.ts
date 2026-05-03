import { describe, expect, it } from "vitest";
import {
  acceptRecommendation,
  createProgressionLogEntry,
  generateRecommendation,
  inferDefaultsFromCycles,
  toggleCycleSkipProgression
} from "../src/index";

describe("progression engine", () => {
  it("infers defaults from recent cycles", () => {
    const defaults = inferDefaultsFromCycles([
      { cycleNumber: 34, sets: [{ reps: 10, loadLb: 20 }, { reps: 9, loadLb: 20 }] },
      { cycleNumber: 35, sets: [{ reps: 11, loadLb: 20 }, { reps: 10, loadLb: 20 }] },
      { cycleNumber: 36, sets: [{ reps: 12, loadLb: 20 }, { reps: 12, loadLb: 20 }] }
    ], { equipment: "dumbbell", isBodyweight: false });

    expect(defaults).toMatchObject({ setCount: 2, lowRepTarget: 10, highRepTarget: 12, recentLoadLb: 20, incrementLb: 2.5 });
  });

  it("uses hybrid rep-first plus double progression for resistance work", () => {
    const recommendation = generateRecommendation({
      exerciseId: "curl",
      exerciseName: "Incline DB Curl",
      equipment: "dumbbell",
      isBodyweight: false,
      defaultSets: 2,
      lowRepTarget: 10,
      highRepTarget: 12,
      incrementLb: 2.5,
      recentSets: [{ reps: 12, loadLb: 20 }, { reps: 12, loadLb: 20 }]
    });

    expect(recommendation.recommendedLoadLb).toBe(22.5);
    expect(recommendation.recommendedLowReps).toBe(10);
    expect(recommendation.rationale).toContain("All working sets reached the top target");
  });

  it("keeps bodyweight progression reps-only", () => {
    const recommendation = generateRecommendation({
      exerciseId: "pushup",
      exerciseName: "Pushups",
      equipment: "bodyweight",
      isBodyweight: true,
      defaultSets: 3,
      lowRepTarget: 15,
      highRepTarget: 25,
      incrementLb: 0,
      recentSets: [{ reps: 20 }, { reps: 18 }]
    });

    expect(recommendation.recommendedLoadLb).toBeUndefined();
    expect(recommendation.progressionMode).toBe("rep_first");
  });

  it("allows skip progression while preserving a log entry", () => {
    const state = toggleCycleSkipProgression(false, 37);
    const entry = createProgressionLogEntry({ cycleNumber: 37, exerciseName: "All exercises", action: state.skipProgression ? "skip_enabled" : "skip_disabled", detail: "Cycle-level progression option changed." });

    expect(state.skipProgression).toBe(true);
    expect(entry.usedInAnalytics).toBe(true);
  });

  it("tracks user edits before accepting a recommendation", () => {
    const accepted = acceptRecommendation({
      id: "rec1",
      exerciseId: "curl",
      recommendedSets: 3,
      recommendedLowReps: 10,
      recommendedHighReps: 12,
      recommendedLoadLb: 22.5,
      progressionMode: "double_progression",
      rationale: "Ready to increase load.",
      warningLevel: "none",
      acceptedAsDefault: false,
      logOnly: false
    }, { recommendedLoadLb: 20, reason: "User wants one repeat week." });

    expect(accepted.acceptedAsDefault).toBe(true);
    expect(accepted.userOverrideJson).toEqual({ recommendedLoadLb: 20, reason: "User wants one repeat week." });
  });
});
