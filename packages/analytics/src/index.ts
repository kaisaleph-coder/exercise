import { bodyweightRepsForSets, resistanceVolumeForSets, round } from "@workout/shared";

export interface AnalyticsSet {
  reps?: number;
  loadLb?: number;
  completed?: boolean;
}

export interface AnalyticsExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  isUnilateral: boolean;
  isBodyweight: boolean;
  plannedSets: number;
  sets: AnalyticsSet[];
}

export interface AnalyticsWorkout {
  cycleNumber: number;
  status: "planned" | "completed" | "skipped" | "sick" | "rest";
  exercises: AnalyticsExercise[];
}

function exerciseResistanceVolume(exercise: AnalyticsExercise): number {
  return resistanceVolumeForSets(exercise.sets, {
    isUnilateral: exercise.isUnilateral,
    isBodyweight: exercise.isBodyweight,
    excludeFromResistanceVolume: exercise.isBodyweight
  });
}

function completedSetCount(exercise: AnalyticsExercise): number {
  return exercise.sets.filter((set) => set.completed !== false).length;
}

export function resistanceVolumeByMuscleGroup(workouts: AnalyticsWorkout[]): Record<string, number> {
  return workouts.reduce<Record<string, number>>((groups, workout) => {
    for (const exercise of workout.exercises) {
      const volume = exerciseResistanceVolume(exercise);
      if (volume === 0) {
        continue;
      }
      groups[exercise.muscleGroup] = (groups[exercise.muscleGroup] ?? 0) + volume;
    }

    return groups;
  }, {});
}

export function filterCyclesByLookback(workouts: AnalyticsWorkout[], lookback: number): AnalyticsWorkout[] {
  const cycles = [...new Set(workouts.map((workout) => workout.cycleNumber))].sort((a, b) => b - a).slice(0, lookback);
  return workouts.filter((workout) => cycles.includes(workout.cycleNumber));
}

export function cycleComparison(workouts: AnalyticsWorkout[]) {
  const grouped = workouts.reduce<Record<number, { cycleNumber: number; resistanceVolume: number; completedSets: number }>>((cycles, workout) => {
    cycles[workout.cycleNumber] ??= { cycleNumber: workout.cycleNumber, resistanceVolume: 0, completedSets: 0 };
    for (const exercise of workout.exercises) {
      cycles[workout.cycleNumber].resistanceVolume += exerciseResistanceVolume(exercise);
      cycles[workout.cycleNumber].completedSets += completedSetCount(exercise);
    }
    return cycles;
  }, {});

  return Object.values(grouped).sort((a, b) => a.cycleNumber - b.cycleNumber);
}

export function perExerciseTracker(workouts: AnalyticsWorkout[], exerciseId: string) {
  return workouts.flatMap((workout) =>
    workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .map((exercise) => ({
        cycleNumber: workout.cycleNumber,
        exerciseId,
        exerciseName: exercise.exerciseName,
        totalVolume: exerciseResistanceVolume(exercise),
        completedSets: completedSetCount(exercise),
        bodyweightReps: bodyweightRepsForSets(exercise.sets, exercise.isBodyweight)
      }))
  );
}

export function detectPersonalRecords(workouts: AnalyticsWorkout[]) {
  const bestExerciseVolume = new Map<string, { exerciseId: string; exerciseName: string; category: string; value: number; cycleNumber: number }>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const volume = exerciseResistanceVolume(exercise);
      const current = bestExerciseVolume.get(exercise.exerciseId);
      if (!current || volume > current.value) {
        bestExerciseVolume.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          category: "best_total_exercise_resistance_volume",
          value: volume,
          cycleNumber: workout.cycleNumber
        });
      }
    }
  }

  return [...bestExerciseVolume.values()].filter((record) => record.value > 0);
}

export function calculateAdherence(workouts: AnalyticsWorkout[]) {
  const totals = workouts.reduce(
    (acc, workout) => {
      for (const exercise of workout.exercises) {
        acc.completedSets += completedSetCount(exercise);
        acc.plannedSets += exercise.plannedSets;
      }
      return acc;
    },
    { completedSets: 0, plannedSets: 0 }
  );

  return {
    ...totals,
    percent: totals.plannedSets === 0 ? 0 : round((totals.completedSets / totals.plannedSets) * 100)
  };
}
