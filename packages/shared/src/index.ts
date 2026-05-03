export const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Core", "Legs"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type EquipmentType = "dumbbell" | "barbell" | "cable" | "machine" | "bodyweight" | "other";

export type SetType = "standard" | "myorep_activation" | "myorep_cluster" | "drop" | "partial" | "failure";

export type WorkoutStatus = "planned" | "in_progress" | "completed" | "rest" | "sick" | "skipped" | "draft" | "deleted_import_row";

export type ProgressionMode = "rep_first" | "double_progression" | "load_first" | "volume_first" | "set_first" | "custom";

export type DeviceSessionStatus = "active" | "idle" | "terminated" | "expired";

export type ConflictResolution = "use_mobile" | "use_browser" | "manual_merge";

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
