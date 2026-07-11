import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePomodoro, phaseSeconds, nextPhase, DEFAULT_POMODORO_SETTINGS } from "@/hooks/usePomodoro";
import { STORAGE_KEYS } from "@/types";

// ── Pure function tests (no React renderer needed) ────────────────────────────

describe("phaseSeconds", () => {
  const s = DEFAULT_POMODORO_SETTINGS;

  it("returns workMinutes * 60 for work phase", () => {
    expect(phaseSeconds("work", s)).toBe(25 * 60);
  });

  it("returns shortBreakMinutes * 60 for short-break", () => {
    expect(phaseSeconds("short-break", s)).toBe(5 * 60);
  });

  it("returns longBreakMinutes * 60 for long-break", () => {
    expect(phaseSeconds("long-break", s)).toBe(15 * 60);
  });

  it("returns 0 for idle phase", () => {
    expect(phaseSeconds("idle", s)).toBe(0);
  });
});

describe("nextPhase", () => {
  it("returns short-break after work when not a long-break session", () => {
    expect(nextPhase("work", 0, 4)).toBe("short-break");
    expect(nextPhase("work", 1, 4)).toBe("short-break");
    expect(nextPhase("work", 2, 4)).toBe("short-break");
  });

  it("returns long-break after the Nth work session", () => {
    // sc=3 means the 4th session (0-indexed) just completed → long break
    expect(nextPhase("work", 3, 4)).toBe("long-break");
  });

  it("returns work after any break phase", () => {
    expect(nextPhase("short-break", 1, 4)).toBe("work");
    expect(nextPhase("long-break",  4, 4)).toBe("work");
  });

  it("respects custom sessionsBeforeLongBreak", () => {
    expect(nextPhase("work", 1, 2)).toBe("long-break");
    expect(nextPhase("work", 0, 2)).toBe("short-break");
  });
});

// ── Hook tests ────────────────────────────────────────────────────────────────

describe("usePomodoro", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.status).toBe("idle");
    expect(result.current.phase).toBe("idle");
    expect(result.current.secondsLeft).toBe(0);
  });

  it("transitions to running/work when start() is called", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    expect(result.current.status).toBe("running");
    expect(result.current.phase).toBe("work");
    expect(result.current.secondsLeft).toBe(DEFAULT_POMODORO_SETTINGS.workMinutes * 60);
  });

  it("decrements secondsLeft every second", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    const initial = result.current.secondsLeft;
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.secondsLeft).toBe(initial - 3);
  });

  it("pause() stops the countdown", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(2_000); });
    act(() => { result.current.pause(); });
    const frozenAt = result.current.secondsLeft;
    act(() => { vi.advanceTimersByTime(5_000); });
    expect(result.current.secondsLeft).toBe(frozenAt);
    expect(result.current.status).toBe("paused");
  });

  it("resume() continues the countdown", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(2_000); });
    act(() => { result.current.pause(); });
    const frozenAt = result.current.secondsLeft;
    act(() => { result.current.resume(); });
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.secondsLeft).toBe(frozenAt - 3);
    expect(result.current.status).toBe("running");
  });

  it("reset() returns to idle and clears the countdown", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(5_000); });
    act(() => { result.current.reset(); });
    expect(result.current.status).toBe("idle");
    expect(result.current.phase).toBe("idle");
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.sessionCount).toBe(0);
  });

  it("skip() advances to the next phase immediately", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.start(); });
    act(() => { result.current.skip(); });
    // After skipping the first work session, we should be on a break.
    expect(result.current.phase).toBe("short-break");
  });

  it("advances to short-break after work phase completes naturally", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.updateSettings({ workMinutes: 1 }); });
    act(() => { result.current.start(); });
    // Fast-forward past the full 60 seconds
    act(() => { vi.advanceTimersByTime(61_000); });
    expect(result.current.phase).toBe("short-break");
  });

  it("updateSettings() persists to localStorage", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.updateSettings({ workMinutes: 50 }); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.pomodoroSettings)!);
    expect(stored.workMinutes).toBe(50);
  });

  it("reloads settings from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEYS.pomodoroSettings,
      JSON.stringify({ ...DEFAULT_POMODORO_SETTINGS, workMinutes: 50 })
    );
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.settings.workMinutes).toBe(50);
  });

  it("fires onSessionComplete callback when a work phase ends", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => usePomodoro(onComplete));
    act(() => { result.current.updateSettings({ workMinutes: 1 }); });
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(61_000); });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0].phase).toBe("work");
    expect(onComplete.mock.calls[0][0].completedAt).not.toBeNull();
  });

  it("persists completed sessions to localStorage", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.updateSettings({ workMinutes: 1 }); });
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(61_000); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.pomodoroSessions)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].phase).toBe("work");
  });

  it("progress goes from 0 to ~1 during a session", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.updateSettings({ workMinutes: 1 }); });
    act(() => { result.current.start(); });
    expect(result.current.progress).toBe(0);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(result.current.progress).toBeCloseTo(0.5, 1);
  });

  it("cycles to long-break after sessionsBeforeLongBreak work sessions", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => { result.current.updateSettings({ workMinutes: 1, shortBreakMinutes: 1, sessionsBeforeLongBreak: 2 }); });

    // Session 1: work → short-break
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(61_000); }); // work ends
    act(() => { vi.advanceTimersByTime(61_000); }); // short-break ends
    // Session 2: work → long-break
    act(() => { vi.advanceTimersByTime(61_000); }); // work ends

    expect(result.current.phase).toBe("long-break");
  });
});
