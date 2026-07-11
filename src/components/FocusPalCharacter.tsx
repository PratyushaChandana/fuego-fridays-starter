import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MascotMood } from "@/types";

// MascotMood is the canonical type; alias locally so SVG constants stay readable.
type Mood = MascotMood;

/* ─── Face feature sets keyed by mood ───────────────────────────────────── */

const EYES: Record<Mood, { type: "circle" | "squint" | "wide"; r?: number }> = {
  curious: { type: "squint" },
  excited: { type: "wide", r: 5 },
  sleepy:  { type: "squint" },
  worried: { type: "wide", r: 3.5 },
  happy:   { type: "circle", r: 4 },
};

const MOUTHS: Record<Mood, string> = {
  curious: "M 30 58 Q 40 63 50 58",
  excited: "M 26 55 Q 40 70 54 55",
  sleepy:  "M 32 60 Q 40 57 48 60",
  worried: "M 30 63 Q 40 57 50 63",
  happy:   "M 28 56 Q 40 68 52 56",
};

const BROWS: Record<Mood, { left: string; right: string }> = {
  curious: {
    left:  "M 22 30 Q 28 28 34 30",
    right: "M 46 28 Q 52 26 58 30",
  },
  excited: {
    left:  "M 22 26 Q 28 23 34 26",
    right: "M 46 26 Q 52 23 58 26",
  },
  sleepy: {
    left:  "M 22 34 Q 28 34 34 33",
    right: "M 46 33 Q 52 34 58 34",
  },
  worried: {
    left:  "M 22 30 Q 28 26 34 30",
    right: "M 46 30 Q 52 26 58 30",
  },
  happy: {
    left:  "M 22 30 Q 28 27 34 30",
    right: "M 46 30 Q 52 27 58 30",
  },
};

const BLUSH_MOODS: Mood[] = ["happy", "excited"];

/* ─── Eye sub-component ─────────────────────────────────────────────────── */

function Eye({ cx, cy, mood }: { cx: number; cy: number; mood: Mood }) {
  const spec = EYES[mood];

  if (spec.type === "squint") {
    return (
      <path
        d={`M ${cx - 5} ${cy + 1} Q ${cx} ${cy - 4} ${cx + 5} ${cy + 1}`}
        fill="none"
        stroke="#1b1a18"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );
  }

  const r = spec.r ?? 4;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#1b1a18" />
      <circle cx={cx + r * 0.4} cy={cy - r * 0.4} r={r * 0.28} fill="white" />
    </>
  );
}

/* ─── Face SVG ──────────────────────────────────────────────────────────── */

interface PalFaceProps {
  mood: Mood;
  wiggle?: boolean;
  className?: string;
}

export function PalFace({ mood, wiggle = false, className }: PalFaceProps) {
  const brows = BROWS[mood];
  const showBlush = BLUSH_MOODS.includes(mood);

  return (
    <motion.svg
      viewBox="0 0 80 80"
      className={cn("select-none", className)}
      xmlns="http://www.w3.org/2000/svg"
      animate={wiggle ? { rotate: [0, -8, 8, -6, 6, -3, 3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <circle cx="40" cy="40" r="36" fill="#ff6200" />
      <circle cx="40" cy="43" r="26" fill="#ff8038" opacity="0.45" />

      {showBlush && (
        <>
          <ellipse cx="18" cy="54" rx="8" ry="5" fill="#ff9d63" opacity="0.55" />
          <ellipse cx="62" cy="54" rx="8" ry="5" fill="#ff9d63" opacity="0.55" />
        </>
      )}

      <motion.path
        d={brows.left}
        fill="none"
        stroke="#1b1a18"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ d: brows.left }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d={brows.right}
        fill="none"
        stroke="#1b1a18"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ d: brows.right }}
        transition={{ duration: 0.3 }}
      />

      <Eye cx={29} cy={43} mood={mood} />
      <Eye cx={51} cy={43} mood={mood} />

      <motion.path
        d={MOUTHS[mood]}
        fill="none"
        stroke="#1b1a18"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ d: MOUTHS[mood] }}
        transition={{ duration: 0.35 }}
      />

      <circle cx="4"  cy="38" r="5" fill="#ff6200" />
      <circle cx="76" cy="38" r="5" fill="#ff6200" />
    </motion.svg>
  );
}

/* ─── Peeking container ─────────────────────────────────────────────────── */

export interface FocusPalCharacterProps {
  mood: Mood;
  visible: boolean;
  wiggle?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FocusPalCharacter({
  mood,
  visible,
  wiggle = false,
  onClick,
  className,
}: FocusPalCharacterProps) {
  return (
    <motion.div
      className={cn(
        "fixed bottom-0 right-10 z-50 flex cursor-pointer flex-col items-center",
        className
      )}
      initial={{ y: "calc(100% - 20px)" }}
      animate={{ y: visible ? "0%" : "calc(100% - 20px)" }}
      transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.9 }}
      onClick={onClick}
      role="button"
      aria-label={visible ? "Focus Pal — click to dismiss" : "Focus Pal — click to open"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="relative">
        <PalFace
          mood={mood}
          wiggle={wiggle}
          className="size-20 drop-shadow-xl transition-[filter]"
        />
        <div className="mx-auto mt-0.5 h-2 w-14 rounded-full bg-black/10" />
      </div>
    </motion.div>
  );
}
