/**
 * Time formatting utilities.
 *
 * Pure functions only — no side-effects, no imports from other app modules,
 * so they're trivially testable and safe to use anywhere.
 */

/**
 * Format a seconds count as MM:SS (e.g. 1500 → "25:00", 90 → "01:30").
 */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Format a minutes value as a human label (e.g. 90 → "1h 30m", 25 → "25m").
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format a relative time in minutes as a label
 * (e.g. 0 → "just now", 45 → "45m ago", 120 → "2h ago").
 */
export function formatRelativeMinutes(minutesAgo: number): string {
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const h = Math.floor(minutesAgo / 60);
  const m = minutesAgo % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

/**
 * Format an ISO-8601 date string as a short label (e.g. "Jul 10").
 */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format an ISO-8601 date string as a relative label:
 * "Today", "Yesterday", or "Jul 8".
 */
export function formatDateRelative(iso: string): string {
  const input = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (same(input, today)) return "Today";
  if (same(input, yesterday)) return "Yesterday";
  return formatShortDate(iso);
}

/**
 * Return today's date as an ISO-8601 date string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Return the difference in whole calendar days between two ISO date strings.
 * Positive when `a` is after `b`.
 */
export function diffCalendarDays(a: string, b: string): number {
  const msPerDay = 86_400_000;
  const dateA = new Date(a).setHours(0, 0, 0, 0);
  const dateB = new Date(b).setHours(0, 0, 0, 0);
  return Math.round((dateA - dateB) / msPerDay);
}

/**
 * Build an array of the last `n` ISO date strings (YYYY-MM-DD),
 * ending today, oldest first.
 */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
