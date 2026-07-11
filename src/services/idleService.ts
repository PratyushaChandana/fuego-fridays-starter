/**
 * Idle detection service — pure, framework-agnostic logic.
 *
 * Extracted from useIdleDetector so the classifier and event list can be
 * unit-tested without a React renderer, and reused if a non-hook context
 * (e.g. a Web Worker or service worker) ever needs the same logic.
 */

import type { IdleState } from "@/types";

// ── Threshold types ───────────────────────────────────────────────────────────

export interface IdleThresholds {
  /** ms of inactivity before entering "idle-soon" */
  idleSoon: number;
  /** ms of inactivity before entering "idle" */
  idle: number;
  /** ms of inactivity before entering "long-idle" */
  longIdle: number;
}

export const DEFAULT_THRESHOLDS: IdleThresholds = {
  idleSoon: 45_000,
  idle:     120_000,
  longIdle: 300_000,
};

// ── State classifier ──────────────────────────────────────────────────────────

/**
 * Given elapsed idle milliseconds and a threshold config, return the
 * corresponding IdleState.
 */
export function classifyIdleMs(ms: number, t: IdleThresholds): IdleState {
  if (ms >= t.longIdle) return "long-idle";
  if (ms >= t.idle)     return "idle";
  if (ms >= t.idleSoon) return "idle-soon";
  return "active";
}

// ── Activity event list ───────────────────────────────────────────────────────

/**
 * DOM events that count as user activity.
 * Listed here (not in the hook) so tests and future service-worker adapters
 * can reference the same canonical set.
 */
export const ACTIVITY_EVENTS = [
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

export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];
