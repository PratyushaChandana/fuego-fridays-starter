/**
 * Mock task/todo items — a generic work backlog.
 *
 * Type definitions live in @/types to avoid duplication. This file owns
 * only the seed data and re-exports the types for convenience so existing
 * import sites that reference "@/data/mock-tasks" continue to work.
 */

export type { Task, TaskStatus, TaskPriority } from "@/types";

import type { Task } from "@/types";

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Draft Q3 launch announcement",
    description:
      "First pass at the blog post + social copy for the July launch. Marketing needs a review draft by EOW.",
    status: "in_progress",
    priority: "high",
    assignee: "You",
    dueDate: "2026-07-09",
    tags: ["writing", "launch"],
    createdAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Review PR #482 — auth refactor",
    description:
      "Teammate is blocked waiting on your review. Touches the session handling you wrote last month.",
    status: "todo",
    priority: "urgent",
    assignee: "You",
    dueDate: "2026-07-07",
    tags: ["code-review", "blocking-someone"],
    createdAt: "2026-07-02T10:30:00.000Z",
  },
  {
    id: "task-3",
    title: "Reconcile analytics dashboard numbers",
    description:
      "The signups metric on the exec dashboard doesn't match the raw events table. Find the discrepancy.",
    status: "blocked",
    priority: "medium",
    assignee: "You",
    dueDate: "2026-07-11",
    tags: ["data", "investigate"],
    createdAt: "2026-07-03T08:15:00.000Z",
  },
  {
    id: "task-4",
    title: "Prep 1:1 agenda with manager",
    description: "Jot down wins, blockers, and the promo conversation to open.",
    status: "todo",
    priority: "low",
    assignee: "You",
    dueDate: "2026-07-08",
    tags: ["planning"],
    createdAt: "2026-07-04T11:00:00.000Z",
  },
  {
    id: "task-5",
    title: "Update onboarding doc screenshots",
    description:
      "The setup screenshots are three versions out of date. New hire starts Monday.",
    status: "todo",
    priority: "medium",
    assignee: "You",
    dueDate: "2026-07-10",
    tags: ["docs", "onboarding"],
    createdAt: "2026-07-04T14:00:00.000Z",
  },
  {
    id: "task-6",
    title: "Archive the deprecated staging environment",
    description:
      "Nobody's touched staging-legacy in 40 days. Costs are adding up — worth tearing down.",
    status: "todo",
    priority: "low",
    assignee: "You",
    dueDate: "2026-07-15",
    tags: ["infra", "cleanup"],
    aiSuggested: true,
    createdAt: "2026-07-05T09:00:00.000Z",
  },
  {
    id: "task-7",
    title: "Respond to customer escalation (Acme Co.)",
    description:
      "Acme reported intermittent 500s on export. Support looped you in yesterday.",
    status: "in_progress",
    priority: "urgent",
    assignee: "You",
    dueDate: "2026-07-07",
    tags: ["support", "escalation"],
    createdAt: "2026-07-06T08:00:00.000Z",
  },
  {
    id: "task-8",
    title: "Finalize offsite lunch order",
    description: "Collect dietary restrictions and place the catering order.",
    status: "done",
    priority: "low",
    assignee: "You",
    dueDate: "2026-07-06",
    tags: ["team"],
    createdAt: "2026-07-01T12:00:00.000Z",
    completedAt: "2026-07-06T15:30:00.000Z",
  },
];
