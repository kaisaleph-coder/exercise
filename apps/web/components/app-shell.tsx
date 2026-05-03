"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Dumbbell,
  FileSpreadsheet,
  Home,
  Laptop,
  LogOut,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Smartphone,
  Timer,
  Upload,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { bodyweightRepsForSets, resistanceVolumeForSets, type MuscleGroup } from "@workout/shared";
import { generateRecommendation } from "@workout/progression";
import { detectActiveSessionWarning, resolveConflict } from "@workout/sync";
import { buildWorkbookModel } from "@workout/export";
import { getPowerSyncStatus } from "../lib/powersync";
import { completeExerciseAndStartRest, moveItemById, shouldShowTimerRibbon } from "../lib/workout-state";
import { Button, Card, Field, Metric, NavLink, Pill, inputClass } from "./ui";
import { PwaRegister } from "./pwa-register";

type Screen = "dashboard" | "workout" | "program" | "progression" | "import" | "analytics" | "devices" | "settings";

interface ExerciseDbItem {
  id: string;
  name: string;
  group: MuscleGroup;
  equipment: "dumbbell" | "barbell" | "cable" | "machine" | "bodyweight" | "other";
  unilateral: boolean;
  bodyweight: boolean;
  increment: number;
  low: number;
  high: number;
  sets: number;
  active: boolean;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  collapsed: boolean;
  completed: boolean;
  note: string;
  sets: { id: string; reps: number; loadLb?: number; completed: boolean; type: string; rir?: string; rpe?: string; collapsed: boolean }[];
}

const navItems: { screen: Screen; href: string; label: string; icon: React.ElementType }[] = [
  { screen: "dashboard", href: "/dashboard", label: "Dashboard", icon: Home },
  { screen: "workout", href: "/workout/today", label: "Workout", icon: Dumbbell },
  { screen: "program", href: "/program", label: "Program", icon: ClipboardList },
  { screen: "progression", href: "/progression", label: "Progression", icon: Activity },
  { screen: "import", href: "/import", label: "Import Review", icon: Upload },
  { screen: "analytics", href: "/analytics", label: "Analytics", icon: BarChart3 },
  { screen: "devices", href: "/devices", label: "Devices", icon: Smartphone },
  { screen: "settings", href: "/settings", label: "Settings", icon: Settings }
];

const exerciseDbSeed: ExerciseDbItem[] = [
  { id: "incline-db-press", name: "Incline DB Press", group: "Chest", equipment: "dumbbell", unilateral: false, bodyweight: false, increment: 2.5, low: 8, high: 12, sets: 3, active: true },
  { id: "pushups", name: "Pushups", group: "Chest", equipment: "bodyweight", unilateral: false, bodyweight: true, increment: 0, low: 15, high: 25, sets: 3, active: true },
  { id: "incline-db-curl", name: "Incline DB Curl", group: "Biceps", equipment: "dumbbell", unilateral: false, bodyweight: false, increment: 2.5, low: 10, high: 14, sets: 4, active: true },
  { id: "bayesian-cable-curl", name: "Bayesian Cable Curl", group: "Biceps", equipment: "cable", unilateral: true, bodyweight: false, increment: 2.5, low: 10, high: 15, sets: 3, active: true },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", group: "Legs", equipment: "dumbbell", unilateral: true, bodyweight: false, increment: 2.5, low: 8, high: 12, sets: 3, active: true }
];

const initialWorkoutExercises: WorkoutExercise[] = [
  { id: "we-1", exerciseId: "incline-db-press", collapsed: false, completed: false, note: "At gym. Smooth reps.", sets: [{ id: "s1", reps: 12, loadLb: 50, completed: true, type: "standard", collapsed: false }, { id: "s2", reps: 10, loadLb: 50, completed: true, type: "standard", collapsed: false }, { id: "s3", reps: 9, loadLb: 50, completed: false, type: "standard", collapsed: false }] },
  { id: "we-2", exerciseId: "pushups", collapsed: false, completed: false, note: "Bodyweight/calisthenics. Exclude from resistance volume.", sets: [{ id: "s4", reps: 24, completed: false, type: "standard", collapsed: false }, { id: "s5", reps: 20, completed: false, type: "standard", collapsed: false }, { id: "s6", reps: 17, completed: false, type: "standard", collapsed: false }] },
  { id: "we-3", exerciseId: "incline-db-curl", collapsed: false, completed: false, note: "At home. Controlled eccentric.", sets: [{ id: "s7", reps: 14, loadLb: 17.5, completed: true, type: "standard", collapsed: false }, { id: "s8", reps: 13, loadLb: 17.5, completed: true, type: "standard", collapsed: false }, { id: "s9", reps: 14, loadLb: 17.5, completed: false, type: "standard", collapsed: false }] },
  { id: "we-4", exerciseId: "bayesian-cable-curl", collapsed: false, completed: false, note: "Cable machine reference location. Unilateral.", sets: [{ id: "s10", reps: 12, loadLb: 12.5, completed: false, type: "standard", collapsed: false }, { id: "s11", reps: 11, loadLb: 12.5, completed: false, type: "standard", collapsed: false }] },
  { id: "we-5", exerciseId: "bulgarian-split-squat", collapsed: false, completed: false, note: "Unilateral movement. Double volume in analytics.", sets: [{ id: "s12", reps: 10, loadLb: 25, completed: false, type: "standard", collapsed: false }, { id: "s13", reps: 10, loadLb: 25, completed: false, type: "standard", collapsed: false }] }
];

function groupClass(group: MuscleGroup) {
  return `group-${group.toLowerCase()}`;
}

function formatSeconds(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

function parseTags(note: string) {
  const lower = note.toLowerCase();
  return [
    lower.includes("home") ? "home" : null,
    lower.includes("gym") ? "gym" : null,
    lower.includes("pain") ? "pain" : null,
    lower.includes("drop") ? "drop set" : null,
    lower.includes("cable") ? "cable machine" : null
  ].filter(Boolean);
}

export function AppShell({ screen }: { screen: Screen }) {
  const [online, setOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selectedExerciseId, setSelectedExerciseId] = useState("we-1");
  const [hideCompletedSets, setHideCompletedSets] = useState(false);
  const [hideCompletedExercises, setHideCompletedExercises] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("Workout-specific notes live here. Example: home session, limited cable access, 90 second rests.");
  const [exercises, setExercises] = useState(initialWorkoutExercises);
  const [activeRest, setActiveRest] = useState<{ startedAt: string; durationSeconds: number; afterExerciseId: string; nextExerciseId: string | null } | null>(null);
  const [skipProgression, setSkipProgression] = useState(false);
  const [importWarnings, setImportWarnings] = useState([
    { id: "w1", row: 1758, type: "date_serial_zero", text: "Deleted from active import. Preserved only as rejected audit record.", resolved: false },
    { id: "w2", row: 122, type: "formula_mismatch", text: "Old volume formula referenced a different row. App recomputes clean total.", resolved: false },
    { id: "w3", row: 2100, type: "template_row_ignored", text: "Prior template row ignored for primary import.", resolved: true }
  ]);
  const [programDays, setProgramDays] = useState([
    { id: "day-1", label: "Day 1", focus: "Chest/Biceps", exercises: ["Incline DB Press", "Pushups", "Incline DB Curl"] },
    { id: "day-2", label: "Day 2", focus: "Back/Shoulders", exercises: ["Rows", "Rear Delts", "Lateral Raises"] },
    { id: "day-3", label: "Day 3", focus: "Legs/Core", exercises: ["Bulgarian Split Squat", "Cable Crunch"] }
  ]);
  const [selectedProgramDay, setSelectedProgramDay] = useState("day-1");
  const [settings, setSettings] = useState({ ribbon: true, density: "comfortable", buttonSize: "medium", fontScale: "1.0", theme: "system", accent: "#0f9f8a", restSeconds: 90 });
  const [conflictResolution, setConflictResolution] = useState<string | null>(null);
  const syncStatus = getPowerSyncStatus();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const exerciseById = (id: string) => exerciseDbSeed.find((exercise) => exercise.id === id) ?? exerciseDbSeed[0];
  const selectedWorkoutExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) ?? exercises[0];
  const selectedExercise = exerciseById(selectedWorkoutExercise.exerciseId);
  const completedSets = exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
  const plannedSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const resistanceVolume = exercises.reduce((total, workoutExercise) => {
    const exercise = exerciseById(workoutExercise.exerciseId);
    return total + resistanceVolumeForSets(workoutExercise.sets, { isUnilateral: exercise.unilateral, isBodyweight: exercise.bodyweight, excludeFromResistanceVolume: exercise.bodyweight });
  }, 0);
  const bodyweightReps = exercises.reduce((total, workoutExercise) => total + bodyweightRepsForSets(workoutExercise.sets, exerciseById(workoutExercise.exerciseId).bodyweight), 0);
  const elapsedSeconds = startedAt ? Math.floor(((endedAt ? new Date(endedAt).getTime() : now) - new Date(startedAt).getTime()) / 1000) : 0;
  const restRemaining = activeRest ? Math.max(0, activeRest.durationSeconds - Math.floor((now - new Date(activeRest.startedAt).getTime()) / 1000)) : 0;
  const activeSessionWarning = detectActiveSessionWarning("browser", [
    { id: "browser", deviceType: "browser", status: "active", activeWorkoutDayId: "today", lastSeenAt: new Date(now).toISOString() },
    { id: "phone", deviceType: "phone", status: "active", activeWorkoutDayId: "today", lastSeenAt: new Date(now - 20_000).toISOString() }
  ]);

  const recommendations = useMemo(() => {
    return exercises.map((workoutExercise) => {
      const exercise = exerciseById(workoutExercise.exerciseId);
      return {
        workoutExercise,
        exercise,
        recommendation: generateRecommendation({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          equipment: exercise.equipment,
          isBodyweight: exercise.bodyweight,
          defaultSets: exercise.sets,
          lowRepTarget: exercise.low,
          highRepTarget: exercise.high,
          incrementLb: exercise.increment,
          recentSets: workoutExercise.sets.map((set) => ({ reps: set.reps, loadLb: set.loadLb }))
        })
      };
    });
  }, [exercises]);

  function startWorkout() {
    setStartedAt((current) => current ?? new Date().toISOString());
    setEndedAt(null);
  }

  function completeExercise(exerciseId: string) {
    startWorkout();
    const result = completeExerciseAndStartRest(
      { exercises: exercises.map((exercise) => ({ id: exercise.id, completed: exercise.completed })), selectedExerciseId, defaultRestSeconds: settings.restSeconds, now: new Date().toISOString() },
      exerciseId
    );
    setExercises((current) => current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, completed: true, sets: exercise.sets.map((set) => ({ ...set, completed: true })) } : exercise)));
    setSelectedExerciseId(result.selectedExerciseId);
    setActiveRest(result.activeRest);
  }

  function moveWorkoutExercise(id: string, direction: -1 | 1) {
    const index = exercises.findIndex((exercise) => exercise.id === id);
    const target = exercises[index + direction];
    if (!target) return;
    const ids = moveItemById(exercises.map((exercise) => exercise.id), id, target.id);
    setExercises(ids.map((nextId) => exercises.find((exercise) => exercise.id === nextId)!));
  }

  function renderTimerRibbon() {
    if (!shouldShowTimerRibbon({ startedAt, ribbonEnabled: settings.ribbon })) return null;

    return (
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-card/95 px-4 py-2 shadow-soft backdrop-blur">
        <Pill tone="accent"><Timer className="h-3.5 w-3.5" /> Session {formatSeconds(elapsedSeconds)}</Pill>
        <Pill tone={activeRest ? "warn" : "default"}>{activeRest ? `Rest ${formatSeconds(restRemaining)}` : "No active rest"}</Pill>
        <span className="min-w-0 flex-1 text-sm font-semibold">Selected: {selectedExercise.name} · {completedSets}/{plannedSets} sets logged</span>
        {activeRest ? <Button className="min-h-8 px-2 py-1 text-xs" onClick={() => setActiveRest(null)}>Start next exercise</Button> : null}
        <Button className="min-h-8 px-2 py-1 text-xs" variant="danger" onClick={() => setEndedAt(new Date().toISOString())}>End</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PwaRegister />
      {renderTimerRibbon()}
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-card p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-sm font-black text-white">WL</div>
              <div>
                <h1 className="text-base font-black">Workout Logger</h1>
                <p className="text-xs text-muted">Cycle 37 · Day 1</p>
              </div>
            </div>
            <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              <Moon className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.href} href={item.href} active={screen === item.screen}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <Card className="mt-4 hidden p-3 lg:block">
            <div className="flex items-center justify-between">
              <strong>Today</strong>
              <Pill tone={online ? "good" : "warn"}>{online ? "sync ready" : "offline queue"}</Pill>
            </div>
            <p className="mt-2 text-sm text-muted">{completedSets}/{plannedSets} sets · {resistanceVolume} lb · {bodyweightReps} BW reps</p>
          </Card>
        </aside>
        <main className="p-4 md:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">Private Android-installable PWA</p>
              <h2 className="text-2xl font-black md:text-3xl">{navItems.find((item) => item.screen === screen)?.label}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOnline((value) => !value)}><span>{online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}</span>{online ? "Online" : "Offline"}</Button>
              <Button variant="ghost"><LogOut className="h-4 w-4" /> Demo user</Button>
            </div>
          </header>
          {screen === "dashboard" && renderDashboard()}
          {screen === "workout" && renderWorkout()}
          {screen === "program" && renderProgram()}
          {screen === "progression" && renderProgression()}
          {screen === "import" && renderImport()}
          {screen === "analytics" && renderAnalytics()}
          {screen === "devices" && renderDevices()}
          {screen === "settings" && renderSettings()}
        </main>
      </div>
    </div>
  );

  function renderDashboard() {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Session time" value={formatSeconds(elapsedSeconds)} detail={startedAt ? "Persistent ribbon active" : "Start workout to show ribbon"} />
          <Metric label="Resistance volume" value={`${resistanceVolume} lb`} detail="bodyweight excluded; unilateral doubled" />
          <Metric label="Completed sets" value={`${completedSets}/${plannedSets}`} detail="working sets only" />
          <Metric label="Bodyweight reps" value={bodyweightReps} detail="tracked separately" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">Today’s workout</h3>
                <p className="text-sm text-muted">Cycle 37, Day 1 · May 3, 2026</p>
              </div>
              <Pill tone={online ? "good" : "warn"}>{online ? "sync ready" : "offline queue"}</Pill>
            </div>
            <div className="my-4 h-3 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((completedSets / Math.max(1, plannedSets)) * 100)}%` }} />
            </div>
            <p className="text-sm text-muted">{workoutNotes}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={startWorkout}><Play className="h-4 w-4" /> {startedAt ? "Workout started" : "Start workout"}</Button>
              <Button onClick={() => window.location.assign("/workout/today")}>Log sets</Button>
            </div>
          </Card>
          <div className="grid gap-3">
            {activeSessionWarning.hasConflictRisk ? (
              <Card className="border-warning/40">
                <strong className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Multiple active devices</strong>
                <p className="mt-2 text-sm text-muted">Phone and browser are both open on today’s workout.</p>
              </Card>
            ) : null}
            <Card>
              <strong>Sync layer</strong>
              <p className="mt-2 text-sm text-muted">{syncStatus.message}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderWorkout() {
    return (
      <div className="grid gap-4 xl:grid-cols-[1.35fr_.9fr]">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Session" value={formatSeconds(elapsedSeconds)} detail="first set to last set by default" />
            <Metric label="Resistance volume" value={`${resistanceVolume} lb`} detail="clean app logic" />
            <Metric label="Rest" value={activeRest ? formatSeconds(restRemaining) : "none"} detail="auto-start after set/exercise" />
          </div>
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-black">Workout-specific notes</h3>
              <Pill tone="accent">parsed tags</Pill>
            </div>
            <textarea className={`${inputClass} min-h-24 w-full`} value={workoutNotes} onChange={(event) => setWorkoutNotes(event.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2">{parseTags(workoutNotes).map((tag) => <Pill key={tag} tone="accent">{tag}</Pill>)}</div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={startWorkout}>{startedAt ? "Timer running" : "Start session"}</Button>
            <Button onClick={() => setHideCompletedSets((value) => !value)}>{hideCompletedSets ? "Show completed sets" : "Hide completed sets"}</Button>
            <Button onClick={() => setHideCompletedExercises((value) => !value)}>{hideCompletedExercises ? "Show completed exercises" : "Hide completed exercises"}</Button>
          </div>
          <div className="grid gap-3">
            {exercises.map((workoutExercise, index) => {
              const exercise = exerciseById(workoutExercise.exerciseId);
              if (hideCompletedExercises && workoutExercise.completed) {
                return null;
              }
              return (
                <Card key={workoutExercise.id} className={`border-l-4 ${groupClass(exercise.group)} ${selectedExerciseId === workoutExercise.id ? "ring-2 ring-primary" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-left" onClick={() => setSelectedExerciseId(workoutExercise.id)}>
                      <strong>{index + 1}. {exercise.name}</strong>
                      <p className="text-sm text-muted">{exercise.group} · {exercise.equipment}{exercise.unilateral ? " · unilateral" : ""}{exercise.bodyweight ? " · bodyweight" : ""}</p>
                    </button>
                    <div className="flex gap-2">
                      <Button className="h-9 w-9 p-0" onClick={() => moveWorkoutExercise(workoutExercise.id, -1)} aria-label="Move up"><ChevronUp className="h-4 w-4" /></Button>
                      <Button className="h-9 w-9 p-0" onClick={() => moveWorkoutExercise(workoutExercise.id, 1)} aria-label="Move down"><ChevronDown className="h-4 w-4" /></Button>
                      <Button onClick={() => setExercises((current) => current.map((item) => item.id === workoutExercise.id ? { ...item, collapsed: !item.collapsed } : item))}>{workoutExercise.collapsed ? "Expand" : "Collapse"}</Button>
                      <Button variant="primary" onClick={() => completeExercise(workoutExercise.id)}><Check className="h-4 w-4" /> Complete</Button>
                    </div>
                  </div>
                  {!workoutExercise.collapsed ? (
                    <div className="mt-4 grid gap-2">
                      {workoutExercise.sets.map((set, setIndex) => {
                        if (hideCompletedSets && set.completed) return null;
                        return (
                          <div key={set.id} className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-[auto_1fr_1fr_1.4fr_auto] md:items-center">
                            <strong>Set {setIndex + 1}</strong>
                            <input className={inputClass} type="number" value={set.reps} onChange={(event) => updateSet(workoutExercise.id, set.id, { reps: Number(event.target.value) })} aria-label="Reps" />
                            {!exercise.bodyweight ? <input className={inputClass} type="number" value={set.loadLb ?? 0} onChange={(event) => updateSet(workoutExercise.id, set.id, { loadLb: Number(event.target.value) })} aria-label="Load pounds" /> : <Pill>reps-only</Pill>}
                            <div className="flex flex-wrap gap-1">
                              {["standard", "failure", "partial", "drop", "myorep"].map((type) => <Button key={type} className="min-h-8 px-2 py-1 text-xs" variant={set.type === type ? "primary" : "default"} onClick={() => updateSet(workoutExercise.id, set.id, { type })}>{type}</Button>)}
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={set.completed} onChange={(event) => { startWorkout(); updateSet(workoutExercise.id, set.id, { completed: event.target.checked }); }} /> Done</label>
                          </div>
                        );
                      })}
                      <Button onClick={() => addSet(workoutExercise.id)}><Plus className="h-4 w-4" /> Add set</Button>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
        <Card className="h-fit">
          <h3 className="text-lg font-black">Selected exercise</h3>
          <p className="mt-1 text-sm text-muted">{selectedExercise.name} · {selectedExercise.group}</p>
          <p className="mt-4 text-sm">{selectedWorkoutExercise.note}</p>
          <div className="mt-4">
            <Pill tone={selectedExercise.bodyweight ? "warn" : "good"}>{selectedExercise.bodyweight ? "excluded from resistance volume" : "resistance volume tracked"}</Pill>
          </div>
        </Card>
      </div>
    );
  }

  function updateSet(workoutExerciseId: string, setId: string, patch: Record<string, unknown>) {
    setExercises((current) => current.map((workoutExercise) => workoutExercise.id === workoutExerciseId ? { ...workoutExercise, sets: workoutExercise.sets.map((set) => set.id === setId ? { ...set, ...patch } : set) } : workoutExercise));
  }

  function addSet(workoutExerciseId: string) {
    setExercises((current) => current.map((workoutExercise) => {
      if (workoutExercise.id !== workoutExerciseId) return workoutExercise;
      const last = workoutExercise.sets.at(-1);
      return { ...workoutExercise, sets: [...workoutExercise.sets, { id: `set-${Date.now()}`, reps: last?.reps ?? 10, loadLb: last?.loadLb, completed: false, type: "standard", collapsed: false }] };
    }));
  }

  function renderProgram() {
    const day = programDays.find((item) => item.id === selectedProgramDay) ?? programDays[0];
    return (
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <h3 className="text-lg font-black">Program days</h3>
          <div className="mt-3 grid gap-2">
            {programDays.map((item, index) => (
              <div key={item.id} className={`rounded-md border p-3 ${item.id === selectedProgramDay ? "border-primary bg-primary/10" : "border-border"}`}>
                <button className="text-left" onClick={() => setSelectedProgramDay(item.id)}><strong>{item.label}</strong><p className="text-sm text-muted">{item.focus}</p></button>
                <div className="mt-2 flex gap-2">
                  <Button className="h-8 w-8 p-0" onClick={() => moveProgramDay(index, -1)}><ChevronUp className="h-4 w-4" /></Button>
                  <Button className="h-8 w-8 p-0" onClick={() => moveProgramDay(index, 1)}><ChevronDown className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Structured day editor</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Day label"><input className={inputClass} value={day.label} onChange={(event) => updateProgramDay(day.id, { label: event.target.value })} /></Field>
            <Field label="Focus"><input className={inputClass} value={day.focus} onChange={(event) => updateProgramDay(day.id, { focus: event.target.value })} /></Field>
            <div className="grid gap-2">
              {day.exercises.map((exercise, index) => <div className="flex items-center justify-between rounded-md border border-border p-3" key={`${exercise}-${index}`}><span>{index + 1}. {exercise}</span><Button>Remove</Button></div>)}
            </div>
            <Button><Plus className="h-4 w-4" /> Add exercise</Button>
          </div>
        </Card>
      </div>
    );
  }

  function moveProgramDay(index: number, direction: -1 | 1) {
    const target = programDays[index + direction];
    if (!target) return;
    const ids = moveItemById(programDays.map((day) => day.id), programDays[index].id, target.id);
    setProgramDays(ids.map((id) => programDays.find((day) => day.id === id)!));
  }

  function updateProgramDay(id: string, patch: Partial<(typeof programDays)[number]>) {
    setProgramDays((current) => current.map((day) => day.id === id ? { ...day, ...patch } : day));
  }

  function renderProgression() {
    return (
      <div className="grid gap-4">
        <Card>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={skipProgression} onChange={(event) => setSkipProgression(event.target.checked)} />
            Skip progression for this cycle
          </label>
          <p className="mt-2 text-sm text-muted">Recommendations are still generated and logged, but skipped-cycle recommendations do not become future defaults automatically.</p>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Editable recommendations</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-muted"><tr><th className="p-2">Exercise</th><th className="p-2">Sets</th><th className="p-2">Target reps</th><th className="p-2">Load</th><th className="p-2">Rationale</th><th className="p-2">Action</th></tr></thead>
              <tbody>{recommendations.map(({ workoutExercise, exercise, recommendation }) => <tr className="border-t border-border" key={workoutExercise.id}><td className="p-2 font-semibold">{exercise.name}</td><td className="p-2">{recommendation.recommendedSets}</td><td className="p-2">{recommendation.recommendedLowReps}-{recommendation.recommendedHighReps}</td><td className="p-2">{recommendation.recommendedLoadLb ?? "reps only"}</td><td className="p-2 text-muted">{recommendation.rationale}</td><td className="p-2"><Button>{skipProgression ? "Log only" : "Accept"}</Button></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  function renderImport() {
    const open = importWarnings.filter((warning) => !warning.resolved).length;
    return (
      <div className="grid gap-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-black">Import review gate</h3><p className="text-sm text-muted">Workout data cannot be committed until required warnings are resolved.</p></div>
            <Button variant="primary" disabled={open > 0}>Commit import</Button>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Warnings</h3>
          <div className="mt-3 grid gap-2">
            {importWarnings.map((warning) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3" key={warning.id}><div><strong>Row {warning.row}: {warning.type}</strong><p className="text-sm text-muted">{warning.text}</p></div><Button variant={warning.resolved ? "default" : "primary"} onClick={() => setImportWarnings((current) => current.map((item) => item.id === warning.id ? { ...item, resolved: !item.resolved } : item))}>{warning.resolved ? "Resolved" : "Resolve"}</Button></div>)}
          </div>
        </Card>
      </div>
    );
  }

  function renderAnalytics() {
    const exportModel = buildWorkbookModel({ workoutLog: [{ appVolume: resistanceVolume, bodyweightReps }] });
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Lookback" value="3 cycles" detail="user selectable" />
          <Metric label="Volume" value={`${resistanceVolume} lb`} detail="unilateral adjusted" />
          <Metric label="Bodyweight reps" value={bodyweightReps} detail="separate tracker" />
          <Metric label="Export sheets" value={exportModel.sheets.length} detail="Excel workbook model" />
        </div>
        <Card>
          <h3 className="text-lg font-black">Per-exercise tracker</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {exercises.map((workoutExercise) => {
              const exercise = exerciseById(workoutExercise.exerciseId);
              return <div className="rounded-md border border-border p-3" key={workoutExercise.id}><strong>{exercise.name}</strong><p className="text-sm text-muted">{exercise.group} · {workoutExercise.sets.filter((set) => set.completed).length} sets · {exercise.bodyweight ? "bodyweight reps" : "resistance volume"}</p></div>;
            })}
          </div>
        </Card>
      </div>
    );
  }

  function renderDevices() {
    const conflict = resolveConflict({ id: "conflict-demo", mobileVersion: { reps: 12, note: "mobile offline edit" }, browserVersion: { reps: 10, note: "browser edit" }, mobileUpdatedAt: "2026-05-03T16:00:00.000Z", browserUpdatedAt: "2026-05-03T16:02:00.000Z" }, "use_mobile");
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-lg font-black">Active sessions</h3>
          <div className="mt-3 grid gap-2">
            <div className="rounded-md border border-border p-3"><strong className="flex gap-2"><Laptop className="h-4 w-4" /> Browser</strong><p className="text-sm text-muted">Active · editing today’s workout</p></div>
            <div className="rounded-md border border-warning/40 p-3"><strong className="flex gap-2"><Smartphone className="h-4 w-4" /> Phone</strong><p className="text-sm text-muted">Active · same workout</p><Button className="mt-2">Terminate phone session</Button></div>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Conflict resolver</h3>
          <p className="mt-2 text-sm text-muted">If both devices edit before syncing, choose which version to keep. Manual merge is reserved for the full sync implementation.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2"><pre className="rounded-md bg-background p-3 text-xs">{JSON.stringify(conflict.mobileVersion, null, 2)}</pre><pre className="rounded-md bg-background p-3 text-xs">{JSON.stringify(conflict.browserVersion, null, 2)}</pre></div>
          <div className="mt-3 flex gap-2"><Button variant="primary" onClick={() => setConflictResolution("use_mobile")}>Use mobile</Button><Button onClick={() => setConflictResolution("use_browser")}>Use browser</Button></div>
          {conflictResolution ? <Pill className="mt-3" tone="good">Resolved with {conflictResolution}</Pill> : null}
        </Card>
      </div>
    );
  }

  function renderSettings() {
    const groups = [...new Set(exerciseDbSeed.map((exercise) => exercise.group))];
    return (
      <div className="grid gap-4">
        <Card>
          <h3 className="text-lg font-black">Advanced UI configuration</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Field label="Theme"><select className={inputClass} value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value })}><option>system</option><option>light</option><option>dark</option></select></Field>
            <Field label="UI density"><select className={inputClass} value={settings.density} onChange={(event) => setSettings({ ...settings, density: event.target.value })}><option>comfortable</option><option>compact</option><option>large logging controls</option></select></Field>
            <Field label="Default rest seconds"><input className={inputClass} type="number" value={settings.restSeconds} onChange={(event) => setSettings({ ...settings, restSeconds: Number(event.target.value) })} /></Field>
          </div>
          <label className="mt-3 flex items-center gap-2 font-semibold"><input type="checkbox" checked={settings.ribbon} onChange={(event) => setSettings({ ...settings, ribbon: event.target.checked })} /> Persistent timer ribbon once workout starts</label>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Exercise database</h3>
          <div className="mt-3 grid gap-3">
            {groups.map((group) => <div key={group}><h4 className="font-black">{group}</h4><div className="mt-2 grid gap-2 md:grid-cols-2">{exerciseDbSeed.filter((exercise) => exercise.group === group).map((exercise) => <div className={`rounded-md border-l-4 border-y border-r border-border p-3 ${groupClass(exercise.group)}`} key={exercise.id}><strong>{exercise.name}</strong><p className="text-sm text-muted">{exercise.equipment} · +{exercise.increment} lb · {exercise.low}-{exercise.high} reps · {exercise.unilateral ? "unilateral" : "bilateral"} · {exercise.bodyweight ? "bodyweight" : "resistance"}</p></div>)}</div></div>)}
          </div>
        </Card>
      </div>
    );
  }
}
