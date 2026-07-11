import { useCallback, useEffect, useRef, useState } from "react";
import type { IdleState } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { todayISO } from "@/lib/time";

// ── Storage ───────────────────────────────────────────────────────────────────
// Keyed by ISO date (YYYY-MM-DD) → count of idle interruptions that day.
// Stored under its own namespace; no change to STORAGE_KEYS in types/index.ts.

const IDLE_INTERRUPTIONS_KEY = "focuspal:idle-interruptions";

/** Map of ISO date → interruption count for all recorded days. */
type InterruptionRecord = Record<string, number>;

function loadRecord(): InterruptionRecord {
  return storageGet<InterruptionRecord>(IDLE_INTERRUPTIONS_KEY, {});
}

function incrementToday(record: InterruptionRecord): InterruptionRecord {
  const today = todayISO();
  return { ...record, [today]: (record[today] ?? 0) + 1 };
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseIdleTrackerReturn {
  /** Interruptions so far today */
  todayCount: number;
  /** Full history: ISO date → count */
  record: InterruptionRecord;
  /** Manually record one interruption (also called automatically via onStateChange) */
  recordInterruption: () => void;
}

/**
 * Counts idle interruptions (transitions into "idle-soon") per calendar day
 * and persists them to localStorage.
 *
 * Usage: pass `onInterruption` to useIdleDetector's `onStateChange`, or call
 * `recordInterruption()` directly from wherever the idle state is observed.
 *
 * An "interruption" is defined as any transition where the *previous* state was
 * "active" and the *next* state is "idle-soon". This fires exactly once per
 * idle episode — it doesn't re-fire as the user passes through idle → long-idle.
 */
export function useIdleTracker(): UseIdleTrackerReturn {
  const [record, setRecord] = useState<InterruptionRecord>(loadRecord);

  const today = todayISO();
  const todayCount = record[today] ?? 0;

  const recordInterruption = useCallback(() => {
    setRecord((prev) => {
      const next = incrementToday(prev);
      storageSet(IDLE_INTERRUPTIONS_KEY, next);
      return next;
    });
  }, []);

  return { todayCount, record, recordInterruption };
}

/**
 * Convenience callback factory: returns an `onStateChange` handler suitable
 * for passing directly to `useIdleDetector`. Fires `recordInterruption` only
 * on the active → idle-soon transition.
 */
export function makeIdleStateChangeHandler(
  recordInterruption: () => void
): (next: IdleState, prev: IdleState) => void {
  return (next: IdleState, prev: IdleState) => {
    if (next === "idle-soon" && prev === "active") {
      recordInterruption();
    }
  };
}
