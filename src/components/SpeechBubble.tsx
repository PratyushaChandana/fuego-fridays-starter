import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PalLine } from "@/types";

export interface SpeechBubbleProps {
  line: PalLine | null;
  visible: boolean;
  onReply: (reply: string) => void;
  onDismiss: () => void;
  className?: string;
}

export function SpeechBubble({
  line,
  visible,
  onReply,
  onDismiss,
  className,
}: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {visible && line && (
        <motion.div
          key={line.text}
          className={cn(
            "fixed bottom-28 right-4 z-50 w-72 max-w-[calc(100vw-2rem)]",
            className
          )}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 8 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="relative rounded-2xl bg-card shadow-xl ring-1 ring-border">
            <button
              onClick={onDismiss}
              className={cn(
                "absolute right-2.5 top-2.5 flex size-5 items-center justify-center",
                "rounded-full text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Dismiss"
            >
              <X className="size-3" />
            </button>

            <p className="px-4 pb-3 pt-4 pr-8 text-sm leading-relaxed text-foreground">
              {line.text}
            </p>

            {line.replies && line.replies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                {line.replies.map((reply) => (
                  <Button
                    key={reply}
                    size="xs"
                    variant="outline"
                    onClick={() => onReply(reply)}
                    className={cn(
                      "rounded-full border-fuego-200 text-fuego-700",
                      "hover:bg-fuego-50 hover:border-fuego-400",
                      "dark:border-fuego-800 dark:text-fuego-300 dark:hover:bg-fuego-900/40"
                    )}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <TailDown />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TailDown() {
  return (
    <svg
      viewBox="0 0 28 14"
      className="absolute -bottom-[13px] right-[52px] h-[14px] w-7 overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M 0 0 L 28 0 L 22 14 Z" className="fill-border" />
      <path d="M 1 0 L 27 0 L 21 12.5 Z" className="fill-card" />
    </svg>
  );
}

/* ─── Typing indicator ──────────────────────────────────────────────────── */

export function TypingBubble({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-28 right-4 z-50"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 8 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="relative rounded-2xl bg-card px-4 py-3 shadow-xl ring-1 ring-border">
            <TypingDots />
          </div>
          <TailDown />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5 py-0.5" aria-label="Focus Pal is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-fuego-400 opacity-50 animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "900ms" }}
        />
      ))}
    </span>
  );
}
