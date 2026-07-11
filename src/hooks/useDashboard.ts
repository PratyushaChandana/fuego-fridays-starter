import { useMemo } from "react";
import type { DailySnapshot, PomodoroSession, StreakData, Task } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { storageGet } from "@/lib/storage";
import { todayISO, lastNDays, formatMinutes } from "@/lib/time";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * DailySnapshot extended with idle interruption count.
 * Defined locally so types/index.ts stays untouched.
 */
export interface DashboardDaySnapshot extends DailySnapshot {
  idleInterruptions: number;
}

export interface TodayStats {
  /** Total focus minutes from completed work-phase pomodoros today */
  focusMinutesToday: number;
  /** Formatted label, e.g. "1h 25m" */
  focusTimeLabel: string;
  /** Completed work-phase pomodoro sessions today */
  sessionsToday: number;
  /** Tasks marked done today */
  tasksCompletedToday: number;
  /** Times the user crossed into idle-soon today */
  idleInterruptionsToday: number;
}

export interface DashboardData {
  today: TodayStats;
  streak: StreakData;
  /** 7 days ending today, oldest first */
  week: DashboardDaySnapshot[];
  /** Peak values across the week (for bar chart scaling) */
  weekPeak: {
    focusMinutes: number;
    sessions: number;
    tasks: number;
  };
}

// ── Storage key for idle interruptions ───────────────────────────────────────
const IDLE_INTERRUPTIONS_KEY = "focuspal:idle-interruptions";

// ── Pure derivation ───────────────────────────────────────────────────────────

function deriveData(
  tasks: Task[],
  sessions: PomodoroSession[],
  streak: StreakData,
  interruptionRecord: Record<string, number>
): DashboardData {
  const today = todayISO();
  const days = lastNDays(7);

  // Index completed work sessions by date
  const completedWork = sessions.filter(
    (s) => s.phase === "work" && s.completedAt
  );

  const sessionsByDay = new Map<string, PomodoroSession[]>();
  for (const s of completedWork) {
    const day = s.completedAt!.slice(0, 10);
    if (!sessionsByDay.has(day)) sessionsByDay.set(day, []);
    sessionsByDay.get(day)!.push(s);
  }

  // Index completed tasks by date
  const tasksByDay = new Map<string, number>();
  for (const t of tasks) {
    if (t.status === "done" && t.completedAt) {
      const day = t.completedAt.slice(0, 10);
      tasksByDay.set(day, (tasksByDay.get(day) ?? 0) + 1);
    }
  }

  // Build 7-day snapshots
  const week: DashboardDaySnapshot[] = days.map((date) => {
    const daySessions = sessionsByDay.get(date) ?? [];
    const focusMinutes = daySessions.reduce(
      (acc, s) => acc + Math.round(s.durationSeconds / 60),
      0
    );
    return {
      date,
      focusMinutes,
      pomodorosCompleted: daySessions.length,
      tasksCompleted: tasksByDay.get(date) ?? 0,
      idleInterruptions: interruptionRecord[date] ?? 0,
    };
  });

  // Today's snapshot
  const todaySnap = week.find((d) => d.date === today) ?? {
    date: today,
    focusMinutes: 0,
    pomodorosCompleted: 0,
    tasksCompleted: 0,
    idleInterruptions: 0,
  };

  const todayStats: TodayStats = {
    focusMinutesToday: todaySnap.focusMinutes,
    focusTimeLabel: formatMinutes(todaySnap.focusMinutes),
    sessionsToday: todaySnap.pomodorosCompleted,
    tasksCompletedToday: todaySnap.tasksCompleted,
    idleInterruptionsToday: todaySnap.idleInterruptions,
  };

  // Peak values for chart scaling
  const weekPeak = {
    focusMinutes: Math.max(1, ...week.map((d) => d.focusMinutes)),
    sessions:     Math.max(1, ...week.map((d) => d.pomodorosCompleted)),
    tasks:        Math.max(1, ...week.map((d) => d.tasksCompleted)),
  };

  return { today: todayStats, streak, week, weekPeak };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseDashboardOptions {
  /**
   * Bump this token to force the hook to re-derive metrics from localStorage.
   * Pass the total number of completed pomodoro sessions or a similar
   * monotonically increasing value from the parent so the dashboard stays live.
   */
  refreshToken: number;
  /** Live task array from useProductivityStore */
  tasks: Task[];
  /** Live streak data from useProductivityStore */
  streak: StreakData;
  /** Live idle interruption count for today from useIdleTracker */
  idleInterruptionsToday: number;
}

/**
 * Derives all dashboard metrics from live props and persisted localStorage
 * data. Re-runs whenever `refreshToken`, `tasks`, `streak`, or
 * `idleInterruptionsToday` changes.
 *
 * Reads pomodoro sessions directly from localStorage so the App doesn't need
 * to thread the sessions array through a third prop chain.
 */
export function useDashboard({
  refreshToken,
  tasks,
  streak,
  idleInterruptionsToday,
}: UseDashboardOptions): DashboardData {
  return useMemo(() => {
    const sessions = storageGet<PomodoroSession[]>(
      STORAGE_KEYS.pomodoroSessions,
      []
    );
    const interruptionRecord = storageGet<Record<string, number>>(
      IDLE_INTERRUPTIONS_KEY,
      {}
    );

    // Merge live today count with persisted record so the stat card is always
    // in sync even before the next localStorage write.
    const today = todayISO();
    const mergedRecord = {
      ...interruptionRecord,
      [today]: Math.max(
        interruptionRecord[today] ?? 0,
        idleInterruptionsToday
      ),
    };

    return deriveData(tasks, sessions, streak, mergedRecord);
    // refreshToken is the explicit invalidation signal — include it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, tasks, streak, idleInterruptionsToday]);
}
