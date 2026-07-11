import { useCallback, useState } from "react";
import type { Task, TaskStatus, StreakData } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { todayISO, diffCalendarDays } from "@/lib/time";
import { mockTasks } from "@/data/mock-tasks";

// ── Streak helpers ────────────────────────────────────────────────────────────

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

function advanceStreak(streak: StreakData): StreakData {
  const today = todayISO();
  const { lastActiveDate, currentStreak, longestStreak } = streak;

  if (lastActiveDate === today) return streak; // already counted today

  const diff = lastActiveDate ? diffCalendarDays(today, lastActiveDate) : null;

  let next: number;
  if (diff === null || diff > 1) {
    // New streak or broken
    next = 1;
  } else {
    // Consecutive day
    next = currentStreak + 1;
  }

  return {
    currentStreak: next,
    longestStreak: Math.max(longestStreak, next),
    lastActiveDate: today,
  };
}

// ── Seed tasks — merge mock with any persisted tasks ─────────────────────────

function loadInitialTasks(): Task[] {
  const stored = storageGet<Task[] | null>(STORAGE_KEYS.tasks, null);
  if (stored) return stored;

  // Hydrate mock tasks with required createdAt field
  const seeded: Task[] = mockTasks.map((t) => ({
    ...t,
    createdAt: new Date().toISOString(),
    completedAt: t.status === "done" ? new Date().toISOString() : undefined,
  }));
  storageSet(STORAGE_KEYS.tasks, seeded);
  return seeded;
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseProductivityStoreReturn {
  tasks: Task[];
  streak: StreakData;

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // Derived
  activeTasks: Task[];
  completedTasks: Task[];
  urgentTasks: Task[];
}

/**
 * Central productivity data store.
 *
 * Manages the task list and streak counter, persisting everything to
 * localStorage. Intended to be instantiated once at the app root and shared
 * via React context.
 */
export function useProductivityStore(): UseProductivityStoreReturn {
  const [tasks, setTasks] = useState<Task[]>(loadInitialTasks);
  const [streak, setStreak] = useState<StreakData>(() =>
    storageGet(STORAGE_KEYS.streak, DEFAULT_STREAK)
  );

  // ── Internal helpers ────────────────────────────────────────────────────

  const persist = useCallback((next: Task[]) => {
    setTasks(next);
    storageSet(STORAGE_KEYS.tasks, next);
  }, []);

  const recordActivity = useCallback(() => {
    setStreak((prev) => {
      const next = advanceStreak(prev);
      storageSet(STORAGE_KEYS.streak, next);
      return next;
    });
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────

  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt">): Task => {
      const full: Task = {
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      persist([...tasks, full]);
      return full;
    },
    [tasks, persist]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      persist(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [tasks, persist]
  );

  const deleteTask = useCallback(
    (id: string) => {
      persist(tasks.filter((t) => t.id !== id));
    },
    [tasks, persist]
  );

  const completeTask = useCallback(
    (id: string) => {
      persist(
        tasks.map((t) =>
          t.id === id
            ? { ...t, status: "done" as TaskStatus, completedAt: new Date().toISOString() }
            : t
        )
      );
      recordActivity();
    },
    [tasks, persist, recordActivity]
  );

  const setTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      const wasNotDone = tasks.find((t) => t.id === id)?.status !== "done";
      persist(
        tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status,
            completedAt:
              status === "done" ? new Date().toISOString() : undefined,
          };
        })
      );
      if (status === "done" && wasNotDone) recordActivity();
    },
    [tasks, persist, recordActivity]
  );

  // ── Derived ─────────────────────────────────────────────────────────────

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const urgentTasks = tasks.filter(
    (t) => t.priority === "urgent" && t.status !== "done"
  );

  return {
    tasks,
    streak,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    setTaskStatus,
    activeTasks,
    completedTasks,
    urgentTasks,
  };
}
