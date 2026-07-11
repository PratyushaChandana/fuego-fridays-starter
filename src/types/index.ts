// ─────────────────────────────────────────────────────────────────────────────
// FocusPal — central type definitions
// All domain types live here. No other module defines types that belong here.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  /** ISO-8601 date string, e.g. "2026-07-10" */
  dueDate: string;
  tags: string[];
  aiSuggested?: boolean;
  /** ISO-8601 datetime when the task was completed */
  completedAt?: string;
  /** ISO-8601 datetime when the task was created */
  createdAt: string;
}

// ── Pomodoro ─────────────────────────────────────────────────────────────────

export type PomodoroPhase = "work" | "short-break" | "long-break" | "idle";
export type PomodoroStatus = "running" | "paused" | "idle";

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface PomodoroSession {
  id: string;
  phase: PomodoroPhase;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  taskId?: string;
}

// ── Achievements ─────────────────────────────────────────────────────────────

export type AchievementId =
  | "first-task"
  | "five-tasks"
  | "first-pomodoro"
  | "five-pomodoros"
  | "three-day-streak"
  | "seven-day-streak"
  | "focus-hour"
  | "party-animal";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// ── Streaks ──────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface DailySnapshot {
  date: string;
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusMinutes: number;
}

export interface AnalyticsSnapshot {
  daily: DailySnapshot[];
  allTime: {
    tasksCompleted: number;
    pomodorosCompleted: number;
    focusMinutes: number;
  };
}

// ── App settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: "light" | "dark" | "system";
  devMode: boolean;
  pomodoro: PomodoroSettings;
}

// ── Mascot / idle ────────────────────────────────────────────────────────────

export type IdleState = "active" | "idle-soon" | "idle" | "long-idle";

export type MascotMood = "curious" | "excited" | "sleepy" | "worried" | "happy";

export type PalPhase =
  | "hidden"
  | "party"
  | "peeking"
  | "typing"
  | "speaking"
  | "reply-typing"
  | "reply-shown"
  | "returning";

export interface PalLine {
  text: string;
  replies?: string[];
  mood: MascotMood;
}

// ── Storage keys (single source of truth) ────────────────────────────────────

export const STORAGE_KEYS = {
  tasks:            "focuspal:tasks",
  pomodoroSettings: "focuspal:pomodoro-settings",
  pomodoroSessions: "focuspal:pomodoro-sessions",
  achievements:     "focuspal:achievements",
  streak:           "focuspal:streak",
  analytics:        "focuspal:analytics",
  appSettings:      "focuspal:app-settings",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
