import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PomodoroPhase,
  PomodoroSession,
  PomodoroSettings,
  PomodoroStatus,
} from "@/types";
import { STORAGE_KEYS } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: false,
};

// ── Persisted timer snapshot (survives page refresh) ──────────────────────────

interface TimerSnapshot {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  secondsLeft: number;
  sessionCount: number;
  /** Unix ms when the snapshot was saved — used to rehydrate running timers. */
  savedAt: number;
}

const SNAPSHOT_KEY = STORAGE_KEYS.pomodoroSettings + ":timer-snapshot";

function loadSnapshot(): TimerSnapshot | null {
  return storageGet<TimerSnapshot | null>(SNAPSHOT_KEY, null);
}

function saveSnapshot(snap: TimerSnapshot): void {
  storageSet(SNAPSHOT_KEY, snap);
}

function clearSnapshot(): void {
  try { localStorage.removeItem(SNAPSHOT_KEY); } catch { /* ignore */ }
}

/** Rehydrate a running snapshot: subtract elapsed seconds since it was saved. */
function rehydrate(snap: TimerSnapshot): TimerSnapshot {
  if (snap.status !== "running") return snap;
  const elapsedSecs = Math.floor((Date.now() - snap.savedAt) / 1_000);
  const adjusted = snap.secondsLeft - elapsedSecs;
  // If the timer would have already expired, treat it as idle so the UI
  // doesn't start in a broken state.
  if (adjusted <= 0) return { ...snap, status: "idle", secondsLeft: 0 };
  return { ...snap, secondsLeft: adjusted };
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function phaseSeconds(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case "work":        return settings.workMinutes * 60;
    case "short-break": return settings.shortBreakMinutes * 60;
    case "long-break":  return settings.longBreakMinutes * 60;
    case "idle":        return 0;
  }
}

/** Determine the next phase after `current` completes. */
export function nextPhase(
  current: PomodoroPhase,
  sessionCount: number,
  sessionsBeforeLongBreak: number
): PomodoroPhase {
  if (current === "work") {
    return (sessionCount + 1) % sessionsBeforeLongBreak === 0
      ? "long-break"
      : "short-break";
  }
  return "work";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UsePomodoroReturn {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  secondsLeft: number;
  /** Total seconds planned for current phase */
  totalSeconds: number;
  /** 0–1 completion fraction (for progress ring) */
  progress: number;
  /** Work sessions completed in the current round */
  sessionCount: number;
  /** All completed sessions, persisted */
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  linkedTaskId: string | undefined;

  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  updateSettings: (patch: Partial<PomodoroSettings>) => void;
  linkTask: (taskId: string | undefined) => void;
}

/**
 * Pomodoro timer hook.
 *
 * Key design decisions:
 * - Settings are stored in a ref so the tick closure always sees the latest
 *   value without being recreated (fixes stale-closure bug in prior version).
 * - A TimerSnapshot is written to localStorage every tick so the countdown
 *   survives a page refresh. On mount we rehydrate and subtract elapsed time.
 * - `phaseSeconds` and `nextPhase` are exported pure functions for easy testing.
 */
export function usePomodoro(
  onSessionComplete?: (session: PomodoroSession) => void
): UsePomodoroReturn {

  // ── Settings — live in both state (for renders) and ref (for tick closure) ──
  const [settings, setSettings] = useState<PomodoroSettings>(() =>
    storageGet(STORAGE_KEYS.pomodoroSettings, DEFAULT_POMODORO_SETTINGS)
  );
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ── Session history ───────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<PomodoroSession[]>(() =>
    storageGet<PomodoroSession[]>(STORAGE_KEYS.pomodoroSessions, [])
  );

  // ── Timer state (rehydrated from snapshot on first mount) ─────────────────
  const [phase, setPhase] = useState<PomodoroPhase>(() => {
    const snap = loadSnapshot();
    return snap ? rehydrate(snap).phase : "idle";
  });
  const [status, setStatus] = useState<PomodoroStatus>(() => {
    const snap = loadSnapshot();
    return snap ? rehydrate(snap).status : "idle";
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const snap = loadSnapshot();
    return snap ? rehydrate(snap).secondsLeft : 0;
  });
  const [sessionCount, setSessionCount] = useState<number>(() => {
    const snap = loadSnapshot();
    return snap ? snap.sessionCount : 0;
  });
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>();

  const totalSeconds = phaseSeconds(phase, settings);
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  // ── Interval + current-session refs ──────────────────────────────────────
  const intervalRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionRef    = useRef<PomodoroSession | null>(null);
  const onSessionCompleteRef = useRef(onSessionComplete);
  const phaseRef             = useRef(phase);
  const sessionCountRef      = useRef(sessionCount);

  useEffect(() => { onSessionCompleteRef.current = onSessionComplete; }, [onSessionComplete]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);

  // ── Tick cleanup ──────────────────────────────────────────────────────────
  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Complete current phase, advance to next ───────────────────────────────
  const completePhase = useCallback(() => {
    const completedSession = currentSessionRef.current;
    const ph    = phaseRef.current;
    const sc    = sessionCountRef.current;
    const sett  = settingsRef.current;

    if (completedSession) {
      const finished: PomodoroSession = {
        ...completedSession,
        completedAt: new Date().toISOString(),
      };
      setSessions((prev) => {
        const next = [...prev, finished];
        storageSet(STORAGE_KEYS.pomodoroSessions, next);
        return next;
      });
      onSessionCompleteRef.current?.(finished);
    }

    const newCount = ph === "work" ? sc + 1 : sc;
    const np = nextPhase(ph, sc, sett.sessionsBeforeLongBreak);
    const secs = phaseSeconds(np, sett);

    setSessionCount(newCount);
    sessionCountRef.current = newCount;
    setPhase(np);
    phaseRef.current = np;
    setSecondsLeft(secs);
    setStatus("idle");
    currentSessionRef.current = null;
    clearSnapshot();
  }, []);

  // ── Start 1-second tick ───────────────────────────────────────────────────
  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        // Persist snapshot every tick so page refresh can recover.
        saveSnapshot({
          phase: phaseRef.current,
          status: "running",
          secondsLeft: next,
          sessionCount: sessionCountRef.current,
          savedAt: Date.now(),
        });
        if (next <= 0) {
          clearTick();
          completePhase();
          return 0;
        }
        return next;
      });
    }, 1_000);
  }, [clearTick, completePhase]);

  // ── Auto-start tick if we rehydrated a running session ────────────────────
  const didRehydrateRef = useRef(false);
  useEffect(() => {
    if (didRehydrateRef.current) return;
    didRehydrateRef.current = true;
    if (status === "running" && secondsLeft > 0) {
      startTick();
    }
  // Only run once at mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    const sett = settingsRef.current;
    const startPhase: PomodoroPhase = "work";
    const secs = phaseSeconds(startPhase, sett);
    const session: PomodoroSession = {
      id: generateId(),
      phase: startPhase,
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSeconds: secs,
      taskId: linkedTaskId,
    };
    currentSessionRef.current = session;
    setPhase(startPhase);
    phaseRef.current = startPhase;
    setSecondsLeft(secs);
    setStatus("running");
    startTick();
  }, [linkedTaskId, startTick]);

  const pause = useCallback(() => {
    clearTick();
    setStatus("paused");
    // Persist paused snapshot so resume works after refresh.
    saveSnapshot({
      phase: phaseRef.current,
      status: "paused",
      secondsLeft: /* captured via state */ 0, // overwritten below
      sessionCount: sessionCountRef.current,
      savedAt: Date.now(),
    });
    // We can't easily read secondsLeft here synchronously — use a separate
    // effect to keep the snapshot accurate whenever status changes.
  }, [clearTick]);

  const resume = useCallback(() => {
    setStatus("running");
    startTick();
  }, [startTick]);

  const skip = useCallback(() => {
    clearTick();
    completePhase();
  }, [clearTick, completePhase]);

  const reset = useCallback(() => {
    clearTick();
    clearSnapshot();
    setPhase("idle");
    phaseRef.current = "idle";
    setStatus("idle");
    setSecondsLeft(0);
    setSessionCount(0);
    sessionCountRef.current = 0;
    currentSessionRef.current = null;
  }, [clearTick]);

  const updateSettings = useCallback((patch: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;
      storageSet(STORAGE_KEYS.pomodoroSettings, next);
      return next;
    });
  }, []);

  const linkTask = useCallback((taskId: string | undefined) => {
    setLinkedTaskId(taskId);
  }, []);

  // ── Sync paused snapshot when secondsLeft changes ─────────────────────────
  useEffect(() => {
    if (status === "paused") {
      saveSnapshot({
        phase,
        status: "paused",
        secondsLeft,
        sessionCount,
        savedAt: Date.now(),
      });
    }
  }, [status, phase, secondsLeft, sessionCount]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => clearTick(), [clearTick]);

  return {
    phase,
    status,
    secondsLeft,
    totalSeconds,
    progress,
    sessionCount,
    sessions,
    settings,
    linkedTaskId,
    start,
    pause,
    resume,
    skip,
    reset,
    updateSettings,
    linkTask,
  };
}
