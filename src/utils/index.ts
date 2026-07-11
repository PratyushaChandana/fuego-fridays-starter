/**
 * src/utils — public barrel for all utility functions.
 *
 * Consumers can import from "@/utils" instead of reaching into specific
 * lib modules. The lib/ directory remains the canonical implementation
 * location; this file just re-exports everything from one place.
 */

// Class-name helper (shadcn/ui convention)
export { cn } from "@/lib/utils";

// localStorage wrapper
export {
  storageGet,
  storageSet,
  storageRemove,
  storageUpdate,
} from "@/lib/storage";

// Time / date formatting
export {
  formatCountdown,
  formatMinutes,
  formatRelativeMinutes,
  formatShortDate,
  formatDateRelative,
  todayISO,
  diffCalendarDays,
  lastNDays,
} from "@/lib/time";

// Analytics calculations
export {
  computeAnalytics,
  peakTasksPerDay,
  peakFocusMinutes,
  taskCompletionRate,
} from "@/lib/analytics";
