import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PomodoroTimer } from "@/components/PomodoroTimer";

// Framer Motion's AnimatePresence and motion components work fine in jsdom
// but rely on RAF; patching with fake timers keeps tests deterministic.
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Render helpers ────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const onComplete = vi.fn();
  const utils = render(<PomodoroTimer onSessionComplete={onComplete} />);
  return { user, onComplete, ...utils };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PomodoroTimer", () => {
  it("renders the idle countdown as 00:00", () => {
    setup();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("shows Start button in idle state", () => {
    setup();
    expect(screen.getByRole("button", { name: /start timer/i })).toBeInTheDocument();
  });

  it("shows 25:00 after clicking the 25 min preset", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /25 min/i }));
    // Preset resets secondsLeft; timer is still idle so no tick yet.
    // The countdown displays 25:00 after start.
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("shows 50:00 after clicking the 50 min preset and starting", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /50 min/i }));
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    expect(screen.getByText("50:00")).toBeInTheDocument();
  });

  it("Start transitions to running and shows Pause button", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    expect(screen.getByRole("button", { name: /pause timer/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start timer/i })).not.toBeInTheDocument();
  });

  it("countdown decrements after one second", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    vi.advanceTimersByTime(1_000);
    // 25 min = 1500 s; after 1 s → 24:59
    expect(await screen.findByText("24:59")).toBeInTheDocument();
  });

  it("Pause stops the countdown", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    vi.advanceTimersByTime(2_000);
    await user.click(screen.getByRole("button", { name: /pause timer/i }));
    const frozen = screen.getByRole("status", { hidden: true })?.textContent
      ?? screen.getByText(/^\d{2}:\d{2}$/).textContent;
    vi.advanceTimersByTime(5_000);
    // Text should be unchanged
    expect(screen.getByText(frozen!)).toBeInTheDocument();
  });

  it("Resume button appears while paused and resumes countdown", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    await user.click(screen.getByRole("button", { name: /pause timer/i }));
    expect(screen.getByRole("button", { name: /resume timer/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /resume timer/i }));
    expect(screen.getByRole("button", { name: /pause timer/i })).toBeInTheDocument();
  });

  it("Reset returns to 00:00 and idle Start button", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    vi.advanceTimersByTime(3_000);
    await user.click(screen.getByRole("button", { name: /reset timer/i }));
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start timer/i })).toBeInTheDocument();
  });

  it("Skip advances to next phase label", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    await user.click(screen.getByRole("button", { name: /skip to next phase/i }));
    expect(screen.getByText(/short break/i)).toBeInTheDocument();
  });

  it("Reset and Skip buttons are only visible when active", () => {
    setup();
    expect(screen.queryByRole("button", { name: /reset timer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip to next phase/i })).not.toBeInTheDocument();
  });

  it("opens settings panel when Settings button clicked", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("dialog", { name: /timer settings/i })).toBeInTheDocument();
  });

  it("saves custom settings and closes panel", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    const focusInput = screen.getByLabelText(/focus \(min\)/i);
    await user.clear(focusInput);
    await user.type(focusInput, "45");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    // Panel should be gone
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Settings button should reflect custom preset
    expect(screen.getByRole("button", { name: /custom/i })).toBeInTheDocument();
  });

  it("closes settings panel on Cancel", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("25 min preset pill is visually highlighted after selection", async () => {
    const { user } = setup();
    const preset = screen.getByRole("button", { name: /25 min/i });
    await user.click(preset);
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    expect(preset).toHaveAttribute("aria-pressed", "true");
  });

  it("settings button is disabled while timer is running", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    expect(settingsBtn).toBeDisabled();
  });

  it("calls onSessionComplete when a work session finishes", async () => {
    const { user, onComplete } = setup();
    // Use 1-minute work session via settings
    await user.click(screen.getByRole("button", { name: /settings/i }));
    const focusInput = screen.getByLabelText(/focus \(min\)/i);
    await user.clear(focusInput);
    await user.type(focusInput, "1");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    vi.advanceTimersByTime(61_000);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("shows session pips", async () => {
    const { user } = setup();
    // 4 pips by default (sessionsBeforeLongBreak = 4)
    const pips = within(await screen.findByLabelText(/0 of 4 sessions/i)).getAllByRole("presentation", { hidden: true });
    expect(pips).toHaveLength(4);
  });
});
