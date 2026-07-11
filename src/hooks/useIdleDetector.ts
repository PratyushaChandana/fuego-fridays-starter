import { useCallback, useEffect, useRef, useState } from "react";
import type { IdleState } from "@/types";
import {
  classifyIdleMs,
  ACTIVITY_EVENTS,
  DEFAULT_THRESHOLDS,
} from "@/services/idleService";
import type { IdleThresholds } from "@/services/idleService";

// Re-export so existing imports of IdleThresholds from this file keep working.
export type { IdleThresholds } from "@/services/idleService";

export interface UseIdleDetectorOptions {
  /** Override any or all thresholds in ms */
  thresholds?: Partial<IdleThresholds>;
  /** Called every time the idle state transitions */
  onStateChange?: (next: IdleState, prev: IdleState) => void;
}

export interface UseIdleDetectorReturn {
  idleState: IdleState;
  idleMs: number;
  thresholds: IdleThresholds;
  resetIdle: () => void;
}

/**
 * Monitors window-level input events to determine how long the user has
 * been idle, transitioning through four states:
 *   active → idle-soon → idle → long-idle
 *
 * Classification and event constants live in @/services/idleService so they
 * can be tested and reused independently of React.
 */
export function useIdleDetector(
  options: UseIdleDetectorOptions = {}
): UseIdleDetectorReturn {
  const thresholds: IdleThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...options.thresholds,
  };

  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStateRef    = useRef<IdleState>("active");

  const [idleMs, setIdleMs]       = useState(0);
  const [idleState, setIdleState] = useState<IdleState>("active");

  const onStateChangeCb = useRef(options.onStateChange);
  useEffect(() => {
    onStateChangeCb.current = options.onStateChange;
  }, [options.onStateChange]);

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleMs(0);
    setIdleState("active");
    prevStateRef.current = "active";
  }, []);

  const onActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const startTick = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const next = classifyIdleMs(elapsed, thresholds);
      setIdleMs(elapsed);
      setIdleState((prev) => {
        if (prev !== next) {
          onStateChangeCb.current?.(next, prev);
          prevStateRef.current = prev;
        }
        return next;
      });
    }, 1_000);
  // thresholds deliberately excluded — tick captures the snapshot at mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => onActivity();
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handler, { passive: true })
    );
    startTick();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handler));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onActivity, startTick]);

  return { idleState, idleMs, thresholds, resetIdle };
}
