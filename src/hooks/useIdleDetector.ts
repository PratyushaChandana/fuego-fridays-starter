import { useCallback, useEffect, useRef, useState } from "react";

export type IdleState = "active" | "idle-soon" | "idle" | "long-idle";

/**
 * Thresholds (ms) that gate each idle state transition.
 * - idle-soon  → warn the user a break might be coming (gentle nudge)
 * - idle       → pop up the pal with a check-in message
 * - long-idle  → escalate — are they still there at all?
 */
const THRESHOLDS = {
  "idle-soon": 45_000,   // 45 s  — gentle warning
  idle: 120_000,         // 2 min — pal pops up
  "long-idle": 300_000,  // 5 min — deeper check-in
} as const;

function classify(ms: number): IdleState {
  if (ms >= THRESHOLDS["long-idle"]) return "long-idle";
  if (ms >= THRESHOLDS.idle) return "idle";
  if (ms >= THRESHOLDS["idle-soon"]) return "idle-soon";
  return "active";
}

export interface UseIdleDetectorReturn {
  idleState: IdleState;
  idleMs: number;
  /** Call this to manually reset the idle clock (e.g. after the pal is dismissed). */
  resetIdle: () => void;
}

/**
 * Monitors window-level mouse/keyboard/scroll/touch events to determine how
 * long the user has been idle. Updates every second while idle; pauses the
 * interval while the user is active to keep CPU overhead minimal.
 */
export function useIdleDetector(): UseIdleDetectorReturn {
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [idleMs, setIdleMs] = useState(0);
  const [idleState, setIdleState] = useState<IdleState>("active");

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleMs(0);
    setIdleState("active");
  }, []);

  // Record activity; the tick interval catches up on the next poll.
  const onActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Tick every second to recalculate elapsed idle time.
  const startTick = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const next = classify(elapsed);
      setIdleMs(elapsed);
      setIdleState(next);
    }, 1_000);
  }, []);

  useEffect(() => {
    const EVENTS = [
      "mousemove",
      "mousedown",
      "keydown",
      "keyup",
      "scroll",
      "touchstart",
      "touchmove",
      "wheel",
      "focus",
      "click",
    ] as const;

    const handler = () => onActivity();

    EVENTS.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    startTick();

    return () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, handler));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onActivity, startTick]);

  return { idleState, idleMs, resetIdle };
}
