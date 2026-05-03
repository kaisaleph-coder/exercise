import { describe, expect, it } from "vitest";
import { detectActiveSessionWarning, resolveConflict, updateHeartbeat } from "../src/index";

describe("device sessions and conflicts", () => {
  it("warns when another active session edits the same workout", () => {
    const warning = detectActiveSessionWarning("browser-1", [
      { id: "browser-1", deviceType: "browser", status: "active", activeWorkoutDayId: "day-1", lastSeenAt: "2026-05-03T16:00:00.000Z" },
      { id: "phone-1", deviceType: "phone", status: "active", activeWorkoutDayId: "day-1", lastSeenAt: "2026-05-03T16:00:10.000Z" }
    ]);

    expect(warning.hasConflictRisk).toBe(true);
    expect(warning.otherSessions).toHaveLength(1);
  });

  it("updates heartbeat status and last seen timestamp", () => {
    expect(updateHeartbeat({ id: "phone-1", deviceType: "phone", status: "idle", lastSeenAt: "old" }, "2026-05-03T16:01:00.000Z")).toMatchObject({
      status: "active",
      lastSeenAt: "2026-05-03T16:01:00.000Z"
    });
  });

  it("resolves conflicts by selecting mobile or browser versions", () => {
    const resolved = resolveConflict({
      id: "conflict-1",
      mobileVersion: { reps: 12 },
      browserVersion: { reps: 10 },
      mobileUpdatedAt: "2026-05-03T16:00:00.000Z",
      browserUpdatedAt: "2026-05-03T16:02:00.000Z"
    }, "use_mobile");

    expect(resolved.resolvedValue).toEqual({ reps: 12 });
    expect(resolved.resolution).toBe("use_mobile");
  });
});
