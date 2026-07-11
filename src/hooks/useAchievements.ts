import { useCallback, useState } from "react";
import type { Achievement, AchievementId, PomodoroSession, Task } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";

// ── Achievement catalogue ─────────────────────────────────────────────────────

const CATALOGUE: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  {
    id: "first-task",
    title: "First Step",
    description: "Complete your first task.",
    icon: "✅",
  },
  {
    id: "five-tasks",
    title: "On a Roll",
    description: "Complete 5 tasks.",
    icon: "🔥",
  },
  {
    id: "first-pomodoro",
    title: "Tomato Time",
    description: "Finish your first Pomodoro session.",
    icon: "🍅",
  },
  {
    id: "five-pomodoros",
    title: "Deep Focus",
    description: "Finish 5 Pomodoro sessions.",
    icon: "🎯",
  },
  {
    id: "three-day-streak",
    title: "Consistent",
    description: "Maintain a 3-day productivity streak.",
    icon: "📅",
  },
  {
    id: "seven-day-streak",
    title: "Week Warrior",
    description: "Maintain a 7-day productivity streak.",
    icon: "🗓️",
  },
  {
    id: "focus-hour",
    title: "The Hour",
    description: "Accumulate 60 minutes of focus time.",
    icon: "⏰",
  },
  {
    id: "party-animal",
    title: "Party Animal",
    description: "Trigger Party Mode for the first time.",
    icon: "🎉",
  },
];

// ── Default state ─────────────────────────────────────────────────────────────

function buildDefaults(): Achievement[] {
  return CATALOGUE.map((a) => ({ ...a, unlocked: false }));
}

function loadAchievements(): Achievement[] {
  const stored = storageGet<Achievement[]>(
    STORAGE_KEYS.achievements,
    buildDefaults()
  );
  // Merge catalogue additions (new achievements added in future releases)
  const ids = new Set(stored.map((a) => a.id));
  const merged = [
    ...stored,
    ...CATALOGUE.filter((a) => !ids.has(a.id)).map((a) => ({
      ...a,
      unlocked: false,
    })),
  ];
  return merged;
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseAchievementsReturn {
  achievements: Achievement[];
  /** IDs that were just unlocked this session (shown in toast / notification) */
  newlyUnlocked: AchievementId[];
  /**
   * Evaluate all unlock conditions against current app state.
   * Call this after any state-changing event (task complete, pomodoro done, etc.)
   */
  evaluate: (ctx: AchievementContext) => void;
  /** Dismiss the newly-unlocked notification queue */
  clearNewlyUnlocked: () => void;
}

export interface AchievementContext {
  completedTaskCount: number;
  completedPomodoroCount: number;
  currentStreak: number;
  totalFocusMinutes: number;
  partyModeTriggered?: boolean;
}

/**
 * Tracks and persists the 8 built-in achievements.
 *
 * Usage: call `evaluate(ctx)` after any event that might trigger an unlock.
 * Newly unlocked achievements are queued in `newlyUnlocked` until cleared.
 */
export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>(
    loadAchievements
  );
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([]);

  const evaluate = useCallback(
    (ctx: AchievementContext) => {
      const {
        completedTaskCount,
        completedPomodoroCount,
        currentStreak,
        totalFocusMinutes,
        partyModeTriggered,
      } = ctx;

      // Map achievement ID → condition
      const conditions: Record<AchievementId, boolean> = {
        "first-task": completedTaskCount >= 1,
        "five-tasks": completedTaskCount >= 5,
        "first-pomodoro": completedPomodoroCount >= 1,
        "five-pomodoros": completedPomodoroCount >= 5,
        "three-day-streak": currentStreak >= 3,
        "seven-day-streak": currentStreak >= 7,
        "focus-hour": totalFocusMinutes >= 60,
        "party-animal": partyModeTriggered === true,
      };

      setAchievements((prev) => {
        const justUnlocked: AchievementId[] = [];
        const next = prev.map((a) => {
          if (a.unlocked) return a; // already done
          if (conditions[a.id]) {
            justUnlocked.push(a.id);
            return { ...a, unlocked: true, unlockedAt: new Date().toISOString() };
          }
          return a;
        });

        if (justUnlocked.length > 0) {
          storageSet(STORAGE_KEYS.achievements, next);
          setNewlyUnlocked((q) => [...q, ...justUnlocked]);
        }

        return next;
      });
    },
    []
  );

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  return { achievements, newlyUnlocked, evaluate, clearNewlyUnlocked };
}

// ── Convenience selector ──────────────────────────────────────────────────────

/**
 * Build an AchievementContext from store + session data.
 * Call this when you need to pass context to `evaluate`.
 */
export function buildAchievementContext(
  tasks: Task[],
  sessions: PomodoroSession[],
  currentStreak: number,
  partyModeTriggered?: boolean
): AchievementContext {
  const completedPomodoros = sessions.filter(
    (s) => s.phase === "work" && s.completedAt
  );
  return {
    completedTaskCount: tasks.filter((t) => t.status === "done").length,
    completedPomodoroCount: completedPomodoros.length,
    currentStreak,
    totalFocusMinutes: completedPomodoros.reduce(
      (acc, s) => acc + Math.round(s.durationSeconds / 60),
      0
    ),
    partyModeTriggered,
  };
}
