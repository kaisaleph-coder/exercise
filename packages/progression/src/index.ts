import type { EquipmentType, ProgressionMode } from "@workout/shared";

export interface HistoricalCycleExercise {
  cycleNumber: number;
  sets: { reps: number; loadLb?: number }[];
}

export interface RecommendationInput {
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType;
  isBodyweight: boolean;
  defaultSets: number;
  lowRepTarget: number;
  highRepTarget: number;
  incrementLb: number;
  recentSets: { reps: number; loadLb?: number }[];
}

export interface ProgressionRecommendation {
  id?: string;
  exerciseId: string;
  recommendedSets: number;
  recommendedLowReps: number;
  recommendedHighReps: number;
  recommendedLoadLb?: number;
  progressionMode: ProgressionMode;
  rationale: string;
  warningLevel: "none" | "info" | "warning";
  fallbackIfMissed?: string;
  acceptedAsDefault: boolean;
  logOnly: boolean;
  userOverrideJson?: Record<string, unknown>;
}

const INCREMENTS: Record<EquipmentType, number> = {
  dumbbell: 2.5,
  barbell: 5,
  cable: 2.5,
  machine: 2.5,
  bodyweight: 0,
  other: 2.5
};

export function inferDefaultsFromCycles(history: HistoricalCycleExercise[], exercise: { equipment: EquipmentType; isBodyweight: boolean }) {
  const recent = [...history].sort((a, b) => b.cycleNumber - a.cycleNumber).slice(0, 3);
  const allSets = recent.flatMap((cycle) => cycle.sets);
  const reps = allSets.map((set) => set.reps).filter(Number.isFinite).sort((a, b) => a - b);
  const loads = allSets.map((set) => set.loadLb).filter((load): load is number => typeof load === "number" && Number.isFinite(load));
  const lowRepIndex = Math.min(reps.length - 1, Math.max(0, Math.floor(reps.length * 0.25)));

  return {
    setCount: Math.round(recent.reduce((total, cycle) => total + cycle.sets.length, 0) / Math.max(1, recent.length)),
    lowRepTarget: reps.length ? reps[lowRepIndex] : 8,
    highRepTarget: reps.length ? Math.max(...reps) : 12,
    recentLoadLb: loads.at(-1) ?? loads[0],
    incrementLb: exercise.isBodyweight ? 0 : INCREMENTS[exercise.equipment]
  };
}

export function generateRecommendation(input: RecommendationInput): ProgressionRecommendation {
  const allAtTop = input.recentSets.length > 0 && input.recentSets.every((set) => set.reps >= input.highRepTarget);
  const recentLoad = [...input.recentSets].reverse().find((set) => typeof set.loadLb === "number")?.loadLb;

  if (input.isBodyweight) {
    const nextLow = Math.min(input.highRepTarget, Math.max(input.lowRepTarget, Math.min(...input.recentSets.map((set) => set.reps)) + 1));
    return {
      exerciseId: input.exerciseId,
      recommendedSets: input.defaultSets,
      recommendedLowReps: nextLow,
      recommendedHighReps: input.highRepTarget,
      progressionMode: "rep_first",
      rationale: "Bodyweight/calisthenics use reps-only progression and stay out of resistance volume.",
      warningLevel: "none",
      fallbackIfMissed: "Repeat the same rep target next time.",
      acceptedAsDefault: false,
      logOnly: false
    };
  }

  if (allAtTop && typeof recentLoad === "number") {
    return {
      exerciseId: input.exerciseId,
      recommendedSets: input.defaultSets,
      recommendedLowReps: input.lowRepTarget,
      recommendedHighReps: input.highRepTarget,
      recommendedLoadLb: recentLoad + input.incrementLb,
      progressionMode: "double_progression",
      rationale: "All working sets reached the top target, so increase load and reset reps to the lower target.",
      warningLevel: "none",
      fallbackIfMissed: "Repeat the load until all sets return to the target range.",
      acceptedAsDefault: false,
      logOnly: false
    };
  }

  return {
    exerciseId: input.exerciseId,
    recommendedSets: input.defaultSets,
    recommendedLowReps: input.lowRepTarget,
    recommendedHighReps: input.highRepTarget,
    recommendedLoadLb: recentLoad,
    progressionMode: "double_progression",
    rationale: "Rep-first progression: keep load steady while raising reps toward the top target.",
    warningLevel: "info",
    fallbackIfMissed: "Repeat the current load and target the lowest missed set.",
    acceptedAsDefault: false,
    logOnly: false
  };
}

export function toggleCycleSkipProgression(current: boolean, cycleNumber: number) {
  return {
    cycleNumber,
    skipProgression: !current
  };
}

export function createProgressionLogEntry(input: { cycleNumber: number; exerciseName: string; action: string; detail: string }) {
  return {
    at: new Date().toISOString().slice(0, 10),
    cycleNumber: input.cycleNumber,
    exerciseName: input.exerciseName,
    action: input.action,
    detail: input.detail,
    usedInAnalytics: true
  };
}

export function acceptRecommendation(recommendation: ProgressionRecommendation, override?: Record<string, unknown>): ProgressionRecommendation {
  return {
    ...recommendation,
    ...override,
    acceptedAsDefault: true,
    logOnly: false,
    userOverrideJson: override
  };
}
