/**
 * Analytics calculation utilities.
 *
 * Pure functions — they receive data and return derived metrics. No state,
 * no side-effects, easy to unit test.
 */

import type {
  Task,
  PomodoroSession,
  DailySnapshot,
  AnalyticsSnapshot,
} from "@/types";
import { lastNDays } from "@/lib/time";

// ── Per-day bucket builders ──────────────────────────────────────────────────

/**
 * Build a map of ISO date → tasks completed on that day.
 */
function tasksByDay(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tasks) {
    if (t.status === "done" && t.completedAt) {
      const day = t.completedAt.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
  }
  return map;
}

/**
 * Build a map of ISO date → pomodoro work-sessions completed on that day.
 */
function pomodorosByDay(sessions: PomodoroSession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.phase === "work" && s.completedAt) {
      const day = s.completedAt.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
  }
  return map;
}

/**
 * Build a map of ISO date → total focus minutes on that day.
 */
function focusMinutesByDay(sessions: PomodoroSession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.phase === "work" && s.completedAt) {
      const day = s.completedAt.slice(0, 10);
      const mins = Math.round(s.durationSeconds / 60);
      map.set(day, (map.get(day) ?? 0) + mins);
    }
  }
  return map;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute a full AnalyticsSnapshot from raw task and session data.
 * Uses the last 14 days for the daily array.
 */
export function computeAnalytics(
  tasks: Task[],
  sessions: PomodoroSession[]
): AnalyticsSnapshot {
  const days = lastNDays(14);
  const tMap = tasksByDay(tasks);
  const pMap = pomodorosByDay(sessions);
  const fMap = focusMinutesByDay(sessions);

  const daily: DailySnapshot[] = days.map((date) => ({
    date,
    tasksCompleted: tMap.get(date) ?? 0,
    pomodorosCompleted: pMap.get(date) ?? 0,
    focusMinutes: fMap.get(date) ?? 0,
  }));

  const completedTasks = tasks.filter((t) => t.status === "done");
  const completedWork = sessions.filter(
    (s) => s.phase === "work" && s.completedAt
  );

  return {
    daily,
    allTime: {
      tasksCompleted: completedTasks.length,
      pomodorosCompleted: completedWork.length,
      focusMinutes: completedWork.reduce(
        (acc, s) => acc + Math.round(s.durationSeconds / 60),
        0
      ),
    },
  };
}

/**
 * Given an array of DailySnapshot, return the peak tasks-completed value.
 * Used to scale bar charts.
 */
export function peakTasksPerDay(daily: DailySnapshot[]): number {
  return Math.max(1, ...daily.map((d) => d.tasksCompleted));
}

/**
 * Given an array of DailySnapshot, return the peak focus-minutes value.
 */
export function peakFocusMinutes(daily: DailySnapshot[]): number {
  return Math.max(1, ...daily.map((d) => d.focusMinutes));
}

/**
 * Calculate a completion rate (0–100) for tasks with a given status.
 */
export function taskCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}
