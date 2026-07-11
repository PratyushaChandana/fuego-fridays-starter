import { useState } from "react";
import { CheckCircle2, Circle, Clock, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { FocusPal } from "@/components/FocusPal";
import { useIdleDetector } from "@/hooks/useIdleDetector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockTasks } from "@/data/mock-tasks";
import type { Task } from "@/types";

const DEV_MODE = true;

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high:   "bg-fuego-100 text-fuego-700 dark:bg-fuego-900/30 dark:text-fuego-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low:    "bg-secondary text-muted-foreground",
};

const STATUS_STYLES: Record<Task["status"], string> = {
  in_progress: "text-fuego-600",
  todo:        "text-muted-foreground",
  blocked:     "text-red-500",
  done:        "text-green-600",
};

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const done = task.status === "done";
  return (
    <motion.div
      layout
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs",
        "transition-opacity",
        done && "opacity-50"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-fuego-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? <CheckCircle2 className="size-5 text-green-500" /> : <Circle className="size-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium leading-snug", done && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </span>
          {task.aiSuggested && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-fuego-50 px-2 py-0.5 text-[11px] font-medium text-fuego-600 dark:bg-fuego-900/20">
              <Zap className="size-2.5" />
              AI pick
            </span>
          )}
          <span className={cn("ml-auto text-[11px] font-medium", STATUS_STYLES[task.status])}>
            {task.status.replace("_", " ")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function IdleStatusPill() {
  const { idleState, idleMs, resetIdle } = useIdleDetector();

  const LABEL: Record<typeof idleState, string> = {
    active:      "● active",
    "idle-soon": "◑ idle soon",
    idle:        "○ idle",
    "long-idle": "◌ long idle",
  };

  const COLORS: Record<typeof idleState, string> = {
    active:      "bg-green-100 text-green-700",
    "idle-soon": "bg-amber-100 text-amber-700",
    idle:        "bg-fuego-100 text-fuego-700",
    "long-idle": "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums", COLORS[idleState])}>
        {LABEL[idleState]} — {Math.floor(idleMs / 1000)}s
      </span>
      <Button size="xs" variant="outline" onClick={resetIdle}>reset</Button>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
      )
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks   = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border/60 bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-fuego-500 shadow-sm">
              <Flame className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Focus Pal</p>
              <p className="text-xs text-muted-foreground">your proactive teammate</p>
            </div>
          </div>
          {DEV_MODE && <IdleStatusPill />}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Up next</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {activeTasks.length} tasks
              </span>
            </div>
            <div className="space-y-2">
              {activeTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)}
            </div>
          </section>

          {doneTasks.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Done</h2>
                <CheckCircle2 className="size-3.5 text-green-500" />
              </div>
              <div className="space-y-2">
                {doneTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)}
              </div>
            </section>
          )}

          <div className="h-24" />
        </div>
      </main>

      {DEV_MODE && (
        <div className="shrink-0 border-t border-border/40 bg-secondary/40 px-4 py-2">
          <p className="mx-auto flex max-w-2xl items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span>Dev mode — thresholds: idle-soon&nbsp;45s · idle&nbsp;2min · long-idle&nbsp;5min.</span>
          </p>
        </div>
      )}

      <FocusPal />
    </div>
  );
}
