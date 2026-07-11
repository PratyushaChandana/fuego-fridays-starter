/**
 * src/hooks — public barrel.
 * Import hooks from "@/hooks" instead of individual file paths.
 */

export { useIdleDetector } from "@/hooks/useIdleDetector";
export type {
  UseIdleDetectorOptions,
  UseIdleDetectorReturn,
  IdleThresholds,
} from "@/hooks/useIdleDetector";

export { usePomodoro, DEFAULT_POMODORO_SETTINGS } from "@/hooks/usePomodoro";
export type { UsePomodoroReturn } from "@/hooks/usePomodoro";

export { useProductivityStore } from "@/hooks/useProductivityStore";
export type { UseProductivityStoreReturn } from "@/hooks/useProductivityStore";

export {
  useAchievements,
  buildAchievementContext,
} from "@/hooks/useAchievements";
export type {
  UseAchievementsReturn,
  AchievementContext,
} from "@/hooks/useAchievements";
