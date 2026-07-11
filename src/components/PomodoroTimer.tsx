import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, SkipForward,
  Settings2, Check, X,
} from "lucide-react";

import { usePomodoro } from "@/hooks/usePomodoro";
import { formatCountdown } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PomodoroPhase } from "@/types";

// ── Phase meta ────────────────────────────────────────────────────────────────

const PHASE_LABEL: Record<PomodoroPhase, string> = {
  idle:          "Ready",
  work:          "Focus",
  "short-break": "Short break",
  "long-break":  "Long break",
};

const PHASE_COLOR: Record<PomodoroPhase, string> = {
  idle:          "text-muted-foreground",
  work:          "text-fuego-600",
  "short-break": "text-teal-600",
  "long-break":  "text-sky-600",
};

const RING_COLOR: Record<PomodoroPhase, string> = {
  idle:          "stroke-border",
  work:          "stroke-fuego-500",
  "short-break": "stroke-teal-500",
  "long-break":  "stroke-sky-500",
};

// ── SVG progress ring ─────────────────────────────────────────────────────────

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  progress: number; // 0–1
  phase: PomodoroPhase;
}

function ProgressRing({ progress, phase }: ProgressRingProps) {
  const offset = CIRCUMFERENCE * (1 - progress);
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute inset-0 h-full w-full -rotate-90"
      aria-hidden
    >
      {/* Track */}
      <circle
        cx="60" cy="60" r={RADIUS}
        fill="none"
        strokeWidth="6"
        className="stroke-border"
      />
      {/* Progress arc */}
      <circle
        cx="60" cy="60" r={RADIUS}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", RING_COLOR[phase])}
      />
    </svg>
  );
}

// ── Preset duration pills ─────────────────────────────────────────────────────

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
] as const;

// ── Settings panel ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  onSave: (values: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    sessionsBeforeLongBreak: number;
  }) => void;
  onClose: () => void;
}

function SettingsPanel({
  workMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  sessionsBeforeLongBreak,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [work,       setWork]       = useState(workMinutes);
  const [shortBreak, setShortBreak] = useState(shortBreakMinutes);
  const [longBreak,  setLongBreak]  = useState(longBreakMinutes);
  const [sessions,   setSessions]   = useState(sessionsBeforeLongBreak);

  function handleSave() {
    onSave({
      workMinutes:             clamp(work, 1, 120),
      shortBreakMinutes:       clamp(shortBreak, 1, 60),
      longBreakMinutes:        clamp(longBreak, 1, 60),
      sessionsBeforeLongBreak: clamp(sessions, 1, 10),
    });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="w-full rounded-2xl border border-border bg-card p-5 shadow-lg"
      role="dialog"
      aria-label="Timer settings"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Timer settings</p>
        <button
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close settings"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <NumberField label="Focus (min)"         value={work}       min={1} max={120} onChange={setWork}       />
        <NumberField label="Short break (min)"   value={shortBreak} min={1} max={60}  onChange={setShortBreak} />
        <NumberField label="Long break (min)"    value={longBreak}  min={1} max={60}  onChange={setLongBreak}  />
        <NumberField label="Sessions before long break" value={sessions} min={1} max={10} onChange={setSessions} />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="size-3.5" />
          Save
        </Button>
      </div>
    </motion.div>
  );
}

function NumberField({
  label, value, min, max, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-20 rounded-md border border-input bg-background px-2 py-1 text-right text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

// ── Session pips ──────────────────────────────────────────────────────────────

function SessionPips({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${count} of ${total} sessions complete`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i < count ? "bg-fuego-500" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface PomodoroTimerProps {
  /** Called whenever a work session completes — lets the parent react */
  onSessionComplete?: () => void;
  className?: string;
}

export function PomodoroTimer({ onSessionComplete, className }: PomodoroTimerProps) {
  const [showSettings, setShowSettings] = useState(false);

  const {
    phase, status, secondsLeft, progress,
    sessionCount, settings,
    start, pause, resume, skip, reset, updateSettings,
  } = usePomodoro(onSessionComplete ? () => onSessionComplete() : undefined);

  const isIdle    = status === "idle";
  const isRunning = status === "running";
  const isPaused  = status === "paused";
  const isActive  = isRunning || isPaused;

  // ── Preset handler — applies duration then starts immediately ─────────────
  function applyPreset(minutes: number) {
    if (isRunning) return; // don't interrupt a live session
    updateSettings({ workMinutes: minutes });
    reset();
  }

  function applyCustom(minutes: number) {
    if (isRunning) return;
    updateSettings({ workMinutes: minutes });
    reset();
  }

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>

      {/* ── Preset pills ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2" role="group" aria-label="Duration presets">
        {PRESETS.map(({ label, minutes }) => (
          <button
            key={minutes}
            onClick={() => applyPreset(minutes)}
            disabled={isRunning}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-40",
              settings.workMinutes === minutes && !isIdle
                ? "border-fuego-400 bg-fuego-50 text-fuego-700 dark:bg-fuego-900/20"
                : "border-border bg-background text-muted-foreground hover:border-fuego-300 hover:text-fuego-600",
            )}
            aria-pressed={settings.workMinutes === minutes}
          >
            {label}
          </button>
        ))}

        {/* Custom input */}
        <CustomDurationInput
          currentMinutes={settings.workMinutes}
          disabled={isRunning}
          onChange={applyCustom}
        />
      </div>

      {/* ── Ring + countdown ────────────────────────────────────────────── */}
      <div className="relative flex size-48 items-center justify-center">
        <ProgressRing progress={progress} phase={phase} />

        <div className="relative z-10 flex flex-col items-center gap-1 select-none">
          <span
            className={cn("text-5xl font-bold tabular-nums tracking-tight", PHASE_COLOR[phase])}
            aria-live="polite"
            aria-label={`${formatCountdown(secondsLeft)} remaining`}
          >
            {formatCountdown(secondsLeft)}
          </span>
          <span className={cn("text-xs font-semibold uppercase tracking-widest", PHASE_COLOR[phase])}>
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      {/* ── Session progress pips ────────────────────────────────────────── */}
      <SessionPips
        count={sessionCount % settings.sessionsBeforeLongBreak}
        total={settings.sessionsBeforeLongBreak}
      />

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Reset — only shown when active */}
        {isActive && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={reset}
            aria-label="Reset timer"
          >
            <RotateCcw className="size-4" />
          </Button>
        )}

        {/* Primary action: Start / Pause / Resume */}
        {isIdle && (
          <Button
            size="lg"
            onClick={start}
            className="w-32 rounded-full bg-fuego-500 font-bold text-white hover:bg-fuego-600"
            aria-label="Start timer"
          >
            <Play className="size-4" />
            Start
          </Button>
        )}
        {isRunning && (
          <Button
            size="lg"
            variant="outline"
            onClick={pause}
            className="w-32 rounded-full font-bold"
            aria-label="Pause timer"
          >
            <Pause className="size-4" />
            Pause
          </Button>
        )}
        {isPaused && (
          <Button
            size="lg"
            onClick={resume}
            className="w-32 rounded-full bg-fuego-500 font-bold text-white hover:bg-fuego-600"
            aria-label="Resume timer"
          >
            <Play className="size-4" />
            Resume
          </Button>
        )}

        {/* Skip — only shown when active */}
        {isActive && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={skip}
            aria-label="Skip to next phase"
          >
            <SkipForward className="size-4" />
          </Button>
        )}
      </div>

      {/* ── Settings gear ────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowSettings((s) => !s)}
        disabled={isRunning}
        className={cn(
          "flex items-center gap-1.5 text-xs text-muted-foreground transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          "disabled:cursor-not-allowed disabled:opacity-40",
          showSettings && "text-foreground",
        )}
        aria-expanded={showSettings}
        aria-controls="pomodoro-settings-panel"
      >
        <Settings2 className="size-3.5" />
        Settings
      </button>

      {/* ── Settings panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <div id="pomodoro-settings-panel" className="w-full max-w-xs">
            <SettingsPanel
              workMinutes={settings.workMinutes}
              shortBreakMinutes={settings.shortBreakMinutes}
              longBreakMinutes={settings.longBreakMinutes}
              sessionsBeforeLongBreak={settings.sessionsBeforeLongBreak}
              onSave={(values) => {
                updateSettings(values);
              }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom duration input ─────────────────────────────────────────────────────

function CustomDurationInput({
  currentMinutes,
  disabled,
  onChange,
}: {
  currentMinutes: number;
  disabled: boolean;
  onChange: (minutes: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const isCustom = !PRESETS.some((p) => p.minutes === currentMinutes);

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(String(currentMinutes)); setEditing(true); }}
        disabled={disabled}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isCustom
            ? "border-fuego-400 bg-fuego-50 text-fuego-700 dark:bg-fuego-900/20"
            : "border-border bg-background text-muted-foreground hover:border-fuego-300 hover:text-fuego-600",
        )}
        aria-label="Set custom duration"
      >
        {isCustom ? `${currentMinutes} min` : "Custom"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={120}
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const n = parseInt(value, 10);
            if (!isNaN(n) && n >= 1 && n <= 120) onChange(n);
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className={cn(
          "w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Custom duration in minutes"
      />
      <span className="text-xs text-muted-foreground">min</span>
    </div>
  );
}
