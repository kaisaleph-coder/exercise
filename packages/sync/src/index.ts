import type { ConflictResolution, DeviceSessionStatus } from "@workout/shared";

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
