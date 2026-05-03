export interface TimedSet {
  startedAt?: string | null;
  endedAt?: string | null;
}

export function shouldShowTimerRibbon(input: { startedAt?: string | null; ribbonEnabled: boolean }): boolean {
  return Boolean(input.startedAt && input.ribbonEnabled);
}

export function inferSessionDurationSeconds(sets: TimedSet[]): number {
  const completed = sets.filter((set) => set.startedAt && set.endedAt);
  if (completed.length === 0) {
    return 0;
  }

  const firstStart = Math.min(...completed.map((set) => new Date(set.startedAt as string).getTime()));
  const lastEnd = Math.max(...completed.map((set) => new Date(set.endedAt as string).getTime()));
  return Math.max(0, Math.round((lastEnd - firstStart) / 1000));
}

export function moveItemById<T extends string>(items: T[], activeId: T, overId: T): T[] {
  const next = [...items];
  const from = next.indexOf(activeId);
  const to = next.indexOf(overId);
  if (from < 0 || to < 0 || from === to) {
    return next;
  }

  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface WorkoutExerciseState {
  id: string;
  completed: boolean;
}

export function completeExerciseAndStartRest(
  state: {
    exercises: WorkoutExerciseState[];
    selectedExerciseId: string;
    defaultRestSeconds: number;
    now: string;
  },
  exerciseId: string
) {
  const exerciseIndex = state.exercises.findIndex((exercise) => exercise.id === exerciseId);
  const nextExercise = state.exercises[exerciseIndex + 1];

  return {
    ...state,
    selectedExerciseId: nextExercise?.id ?? state.selectedExerciseId,
    exercises: state.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, completed: true } : exercise)),
    activeRest: {
      startedAt: state.now,
      durationSeconds: state.defaultRestSeconds,
      afterExerciseId: exerciseId,
      nextExerciseId: nextExercise?.id ?? null
    }
  };
}
