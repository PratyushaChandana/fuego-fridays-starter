import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PomodoroPhase,
  PomodoroSession,
  PomodoroSettings,
  PomodoroStatus,
} from "@/types";
import { STORAGE_KEYS } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

// ── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function phaseSeconds(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case "work":        return settings.workMinutes * 60;
    case "short-break": return settings.shortBreakMinutes * 60;
    case "long-break":  return settings.longBreakMinutes * 60;
    case "idle":        return 0;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UsePomodoroReturn {
  // State
  phase: PomodoroPhase;
  status: PomodoroStatus;
  secondsLeft: number;
  /** Total seconds for current phase (for progress calculation) */
  totalSeconds: number;
  /** 0–1 completion fraction */
  progress: number;
  /** How many work sessions completed this "round" (resets after long break) */
  sessionCount: number;
  /** All completed sessions (persisted) */
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  /** ID of the task currently linked to this session */
  linkedTaskId: string | undefined;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  updateSettings: (patch: Partial<PomodoroSettings>) => void;
  linkTask: (taskId: string | undefined) => void;
}

/**
 * Full Pomodoro timer hook.
 *
 * - Configurable work / short-break / long-break durations
 * - Tracks completed PomodoroSession objects and persists them to localStorage
 * - Fires optional callbacks on phase completion
 * - Exposes a 0–1 progress fraction and formatted countdown for the UI
 */
export function usePomodoro(
  onSessionComplete?: (session: PomodoroSession) => void
): UsePomodoroReturn {
  // ── Persisted settings ────────────────────────────────────────────────────
  const [settings, setSettings] = useState<PomodoroSettings>(() =>
    storageGet(STORAGE_KEYS.pomodoroSettings, DEFAULT_POMODORO_SETTINGS)
  );

  const [sessions, setSessions] = useState<PomodoroSession[]>(() =>
    storageGet<PomodoroSession[]>(STORAGE_KEYS.pomodoroSessions, [])
  );

  // ── Timer state ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>();

  const totalSeconds = phaseSeconds(phase, settings);
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  // ── Interval ref ──────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionRef = useRef<PomodoroSession | null>(null);
  const onSessionCompleteRef = useRef(onSessionComplete);
  useEffect(() => { onSessionCompleteRef.current = onSessionComplete; }, [onSessionComplete]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Advance to next phase ─────────────────────────────────────────────────
  const advance = useCallback((completedSession: PomodoroSession | null, prevPhase: PomodoroPhase, prevCount: number) => {
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

    // Decide next phase
    let nextPhase: PomodoroPhase;
    let nextCount = prevCount;

    if (prevPhase === "work") {
      nextCount = prevCount + 1;
      setSessionCount(nextCount);
      if (nextCount % settings.sessionsBeforeLongBreak === 0) {
        nextPhase = "long-break";
      } else {
        nextPhase = "short-break";
      }
    } else {
      nextPhase = "work";
    }

    const secs = phaseSeconds(nextPhase, settings);
    setPhase(nextPhase);
    setSecondsLeft(secs);
    setStatus("idle");
    currentSessionRef.current = null;
  }, [settings]);

  // ── Tick ─────────────────────────────────────────────────────────────────
  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTick();
          // Use functional update + ref to avoid stale closure
          setPhase((ph) => {
            setSessionCount((sc) => {
              advance(currentSessionRef.current, ph, sc);
              return sc;
            });
            return ph;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
  }, [clearTick, advance]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    const startPhase: PomodoroPhase = "work";
    const secs = phaseSeconds(startPhase, settings);
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
    setSecondsLeft(secs);
    setStatus("running");
    startTick();
  }, [settings, linkedTaskId, startTick]);

  const pause = useCallback(() => {
    clearTick();
    setStatus("paused");
  }, [clearTick]);

  const resume = useCallback(() => {
    setStatus("running");
    startTick();
  }, [startTick]);

  const skip = useCallback(() => {
    clearTick();
    setPhase((ph) => {
      setSessionCount((sc) => {
        advance(currentSessionRef.current, ph, sc);
        return sc;
      });
      return ph;
    });
  }, [clearTick, advance]);

  const reset = useCallback(() => {
    clearTick();
    setPhase("idle");
    setStatus("idle");
    setSecondsLeft(0);
    setSessionCount(0);
    currentSessionRef.current = null;
  }, [clearTick]);

  const updateSettings = useCallback((patch: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storageSet(STORAGE_KEYS.pomodoroSettings, next);
      return next;
    });
  }, []);

  const linkTask = useCallback((taskId: string | undefined) => {
    setLinkedTaskId(taskId);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
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
