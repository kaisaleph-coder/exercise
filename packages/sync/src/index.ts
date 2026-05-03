import type { ConflictResolution, DeviceSessionStatus } from "@workout/shared";
import {
  CANONICAL_MUSCLE_GROUP_SEEDS,
  DEMO_EXERCISE_SEEDS,
  userPreferencesSchema
} from "@workout/shared";

export interface DeviceSession {
  id: string;
  deviceType: "phone" | "browser" | "unknown";
  status: DeviceSessionStatus;
  activeWorkoutDayId?: string;
  lastSeenAt: string;
}

export function detectActiveSessionWarning(currentSessionId: string, sessions: DeviceSession[]) {
  const current = sessions.find((session) => session.id === currentSessionId);
  const otherSessions = sessions.filter(
    (session) =>
      session.id !== currentSessionId &&
      session.status === "active" &&
      !!session.activeWorkoutDayId &&
      session.activeWorkoutDayId === current?.activeWorkoutDayId
  );

  return {
    hasConflictRisk: otherSessions.length > 0,
    otherSessions
  };
}

export function updateHeartbeat<T extends DeviceSession>(session: T, nowIso: string): T {
  return {
    ...session,
    status: "active",
    lastSeenAt: nowIso
  };
}

export interface SyncConflict<T = unknown> {
  id: string;
  mobileVersion: T;
  browserVersion: T;
  mobileUpdatedAt: string;
  browserUpdatedAt: string;
}

export function resolveConflict<T>(conflict: SyncConflict<T>, resolution: ConflictResolution) {
  const resolvedValue =
    resolution === "use_mobile"
      ? conflict.mobileVersion
      : resolution === "use_browser"
        ? conflict.browserVersion
        : { mobile: conflict.mobileVersion, browser: conflict.browserVersion };

  return {
    ...conflict,
    resolution,
    resolvedValue,
    resolvedAt: new Date().toISOString()
  };
}

export function createLocalMockStore(userId: string) {
  const muscleGroups = CANONICAL_MUSCLE_GROUP_SEEDS.map((group) => ({
    id: `group-${group.sortOrder}`,
    ...group
  }));

  const exercises = DEMO_EXERCISE_SEEDS.map((exercise, index) => ({
    id: `exercise-${index + 1}`,
    userId,
    ...exercise
  }));

  return {
    userId,
    preferences: userPreferencesSchema.parse({}),
    muscleGroups,
    exercises,
    workoutDays: [
      {
        id: "workout-day-today",
        userId,
        cycleNumber: 37,
        dayNumber: 1,
        scheduledDate: "2026-05-03",
        status: "planned" as const,
        notes: "Local mock workout used until Supabase and PowerSync are connected."
      }
    ],
    workoutExercises: exercises.slice(0, 5).map((exercise, index) => ({
      id: `workout-exercise-${index + 1}`,
      userId,
      workoutDayId: "workout-day-today",
      exerciseId: exercise.id,
      orderIndex: index + 1,
      plannedSets: exercise.defaultSetCount,
      targetLowReps: exercise.defaultLowRepTarget,
      targetHighReps: exercise.defaultHighRepTarget,
      targetLoadLb: exercise.isBodyweight ? undefined : 20,
      completed: false
    }))
  };
}
