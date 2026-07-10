import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PalLine } from "@/data/focusPalDialogue";

export interface SpeechBubbleProps {
  line: PalLine | null;
  visible: boolean;
  /** Called when the user taps one of the quick-reply chips */
  onReply: (reply: string) => void;
  /** Called when the user explicitly dismisses the bubble */
  onDismiss: () => void;
  className?: string;
}

/**
 * A speech bubble that pops up above the Focus Pal character.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  message text               │
 *   │                             │
 *   │  [reply A]  [reply B]       │
 *   └──────────────────────┐──────┘
 *                           ▼  tail (SVG triangle pointing toward pal head)
 *
 * Positioned fixed so it floats freely over page content.
 * The bubble anchors bottom-right, sitting just above the character.
 */
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
            // Fixed position: above the character (bottom-right corner)
            "fixed bottom-28 right-4 z-50 w-72 max-w-[calc(100vw-2rem)]",
            className
          )}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 8 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          // Originate the transform from the bottom-right (toward the pal)
          style={{ transformOrigin: "bottom right" }}
        >
          {/* ── Bubble card ─────────────────────────────────────────── */}
          <div className="relative rounded-2xl bg-card shadow-xl ring-1 ring-border">
            {/* Dismiss button */}
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

            {/* Message text */}
            <p className="px-4 pb-3 pt-4 pr-8 text-sm leading-relaxed text-foreground">
              {line.text}
            </p>

            {/* Quick-reply chips */}
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

          {/* ── Tail: SVG triangle pointing down-right toward the pal ── */}
          <TailDown />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A small triangular tail that points toward the character's head. */
function TailDown() {
  return (
    <svg
      viewBox="0 0 28 14"
      className="absolute -bottom-[13px] right-[52px] h-[14px] w-7 overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Shadow / border triangle (slightly larger, rendered behind) */}
      <path
        d="M 0 0 L 28 0 L 22 14 Z"
        className="fill-border"
      />
      {/* Card-fill triangle on top */}
      <path
        d="M 1 0 L 27 0 L 21 12.5 Z"
        className="fill-card"
      />
    </svg>
  );
}

/* ─── Typing indicator variant ──────────────────────────────────────────── */

/**
 * Minimal bubble that shows animated typing dots while the pal is
 * "composing" its next line. Drop-in replacement for SpeechBubble while
 * isTyping is true.
 */
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
    <span
      className="flex items-center gap-1.5 py-0.5"
      aria-label="Focus Pal is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-fuego-400 opacity-50 animate-bounce"
          style={{
            animationDelay: `${i * 160}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </span>
  );
}
