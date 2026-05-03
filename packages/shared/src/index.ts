import { z } from "zod";

export const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type EquipmentType = "dumbbell" | "barbell" | "cable" | "machine" | "bodyweight" | "other";

export type SetType = "standard" | "myorep_activation" | "myorep_cluster" | "drop" | "partial" | "failure";

export type WorkoutStatus = "planned" | "in_progress" | "completed" | "rest" | "sick" | "skipped" | "draft" | "deleted_import_row";

export type ProgressionMode = "rep_first" | "double_progression" | "load_first" | "volume_first" | "set_first" | "custom";

export type DeviceSessionStatus = "active" | "idle" | "terminated" | "expired";

export type ConflictResolution = "use_mobile" | "use_browser" | "manual_merge";

export const equipmentTypeSchema = z.enum(["dumbbell", "barbell", "cable", "machine", "bodyweight", "other"]);
export const muscleGroupSchema = z.enum(MUSCLE_GROUPS);

export const userPreferencesSchema = z.object({
  defaultBodyweightLb: z.number().positive().default(150),
  unitSystem: z.enum(["imperial", "metric"]).default("imperial"),
  persistentTimerRibbon: z.boolean().default(true),
  uiDensity: z.enum(["compact", "comfortable", "large logging controls"]).default("comfortable"),
  buttonSize: z.enum(["small", "medium", "large"]).default("medium"),
  fontScale: z.number().min(0.8).max(1.4).default(1),
  themeMode: z.enum(["light", "dark", "system"]).default("system"),
  accentColor: z.string().default("#0f9f8a"),
  buttonLayout: z.enum(["compact", "balanced", "large logging controls"]).default("balanced"),
  defaultProgressionMode: z.enum(["rep_first", "double_progression", "load_first", "volume_first", "set_first", "custom"]).default("double_progression"),
  defaultRestSeconds: z.number().int().positive().default(90),
  autoTrackRest: z.boolean().default(true)
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const exerciseSchema = z.object({
  canonicalName: z.string().min(1),
  primaryMuscleGroup: muscleGroupSchema,
  equipment: equipmentTypeSchema,
  isUnilateral: z.boolean(),
  isBodyweight: z.boolean(),
  excludeFromResistanceVolume: z.boolean(),
  defaultIncrementLb: z.number().min(0),
  defaultLowRepTarget: z.number().int().positive(),
  defaultHighRepTarget: z.number().int().positive(),
  defaultSetCount: z.number().int().positive(),
  active: z.boolean().default(true)
}).refine((exercise) => exercise.defaultHighRepTarget >= exercise.defaultLowRepTarget, {
  message: "High rep target must be greater than or equal to low rep target.",
  path: ["defaultHighRepTarget"]
});

export type ExerciseSeed = z.infer<typeof exerciseSchema>;

export const CANONICAL_MUSCLE_GROUP_SEEDS = MUSCLE_GROUPS.map((name, index) => ({
  name,
  sortOrder: index + 1
}));

export const DEMO_EXERCISE_SEEDS = [
  {
    canonicalName: "Incline DB Press",
    primaryMuscleGroup: "Chest",
    equipment: "dumbbell",
    isUnilateral: false,
    isBodyweight: false,
    excludeFromResistanceVolume: false,
    defaultIncrementLb: 2.5,
    defaultLowRepTarget: 8,
    defaultHighRepTarget: 12,
    defaultSetCount: 3,
    active: true
  },
  {
    canonicalName: "Pushups",
    primaryMuscleGroup: "Chest",
    equipment: "bodyweight",
    isUnilateral: false,
    isBodyweight: true,
    excludeFromResistanceVolume: true,
    defaultIncrementLb: 0,
    defaultLowRepTarget: 15,
    defaultHighRepTarget: 25,
    defaultSetCount: 3,
    active: true
  },
  {
    canonicalName: "Incline DB Curl",
    primaryMuscleGroup: "Biceps",
    equipment: "dumbbell",
    isUnilateral: false,
    isBodyweight: false,
    excludeFromResistanceVolume: false,
    defaultIncrementLb: 2.5,
    defaultLowRepTarget: 10,
    defaultHighRepTarget: 14,
    defaultSetCount: 4,
    active: true
  },
  {
    canonicalName: "Bayesian Cable Curl",
    primaryMuscleGroup: "Biceps",
    equipment: "cable",
    isUnilateral: true,
    isBodyweight: false,
    excludeFromResistanceVolume: false,
    defaultIncrementLb: 2.5,
    defaultLowRepTarget: 10,
    defaultHighRepTarget: 15,
    defaultSetCount: 3,
    active: true
  },
  {
    canonicalName: "Bulgarian Split Squat",
    primaryMuscleGroup: "Legs",
    equipment: "dumbbell",
    isUnilateral: true,
    isBodyweight: false,
    excludeFromResistanceVolume: false,
    defaultIncrementLb: 2.5,
    defaultLowRepTarget: 8,
    defaultHighRepTarget: 12,
    defaultSetCount: 3,
    active: true
  }
] satisfies ExerciseSeed[];

export interface CompletedSet {
  reps?: number;
  loadLb?: number;
  completed?: boolean;
}

export function isPresentNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function round(value: number, digits = 0): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function resistanceVolumeForSets(
  sets: CompletedSet[],
  options: { isUnilateral?: boolean; isBodyweight?: boolean; excludeFromResistanceVolume?: boolean } = {}
): number {
  if (options.isBodyweight || options.excludeFromResistanceVolume) {
    return 0;
  }

  const multiplier = options.isUnilateral ? 2 : 1;
  return sets.reduce((total, set) => {
    if (set.completed === false || !isPresentNumber(set.reps) || !isPresentNumber(set.loadLb)) {
      return total;
    }

    return total + set.reps * set.loadLb * multiplier;
  }, 0);
}

export function bodyweightRepsForSets(sets: CompletedSet[], isBodyweight: boolean): number {
  if (!isBodyweight) {
    return 0;
  }

  return sets.reduce((total, set) => {
    if (set.completed === false || !isPresentNumber(set.reps)) {
      return total;
    }

    return total + set.reps;
  }, 0);
}
