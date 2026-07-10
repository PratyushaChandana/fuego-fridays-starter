import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PalLine } from "@/data/focusPalDialogue";

type Mood = PalLine["mood"];

/* ─── Face feature sets keyed by mood ───────────────────────────────────── */

/** Left/right eye shapes. "open" = circle, "squint" = arc, "wide" = big circle */
const EYES: Record<Mood, { type: "circle" | "squint" | "wide"; r?: number }> = {
  curious: { type: "squint" },
  excited: { type: "wide", r: 5 },
  sleepy:  { type: "squint" },
  worried: { type: "wide", r: 3.5 },
  happy:   { type: "circle", r: 4 },
};

/** Mouth path d-attribute keyed by mood */
const MOUTHS: Record<Mood, string> = {
  curious: "M 30 58 Q 40 63 50 58",         // slight smile / inquisitive
  excited: "M 26 55 Q 40 70 54 55",          // big open grin
  sleepy:  "M 32 60 Q 40 57 48 60",          // flat / barely there
  worried: "M 30 63 Q 40 57 50 63",          // slight frown
  happy:   "M 28 56 Q 40 68 52 56",          // warm smile
};

/** Eyebrow tilt — positive = raised outer edge (surprised), negative = furrowed */
const BROWS: Record<Mood, { left: string; right: string }> = {
  curious: {
    left:  "M 22 30 Q 28 28 34 30",
    right: "M 46 28 Q 52 26 58 30",   // one brow raised
  },
  excited: {
    left:  "M 22 26 Q 28 23 34 26",
    right: "M 46 26 Q 52 23 58 26",   // both raised
  },
  sleepy: {
    left:  "M 22 34 Q 28 34 34 33",
    right: "M 46 33 Q 52 34 58 34",   // drooping
  },
  worried: {
    left:  "M 22 30 Q 28 26 34 30",
    right: "M 46 30 Q 52 26 58 30",   // angled down toward center
  },
  happy: {
    left:  "M 22 30 Q 28 27 34 30",
    right: "M 46 30 Q 52 27 58 30",   // relaxed arch
  },
};

/** Cheek blush — only for happy/excited */
const BLUSH_MOODS: Mood[] = ["happy", "excited"];

/* ─── Eye sub-component ─────────────────────────────────────────────────── */
function Eye({ cx, cy, mood }: { cx: number; cy: number; mood: Mood }) {
  const spec = EYES[mood];

  if (spec.type === "squint") {
    // arc drawn above center to look half-closed
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
      {/* specular highlight */}
      <circle cx={cx + r * 0.4} cy={cy - r * 0.4} r={r * 0.28} fill="white" />
    </>
  );
}

/* ─── Main character SVG ────────────────────────────────────────────────── */
interface FaceProps {
  mood: Mood;
  /** 0–1 wiggle signal — drives a subtle rotate animation */
  wiggle?: boolean;
  className?: string;
}

export function PalFace({ mood, wiggle = false, className }: FaceProps) {
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
      {/* ── Body / head circle ── */}
      <circle cx="40" cy="40" r="36" fill="#ff6200" />

      {/* ── Inner face lighter circle ── */}
      <circle cx="40" cy="43" r="26" fill="#ff8038" opacity="0.45" />

      {/* ── Blush cheeks ── */}
      {showBlush && (
        <>
          <ellipse cx="18" cy="54" rx="8" ry="5" fill="#ff9d63" opacity="0.55" />
          <ellipse cx="62" cy="54" rx="8" ry="5" fill="#ff9d63" opacity="0.55" />
        </>
      )}

      {/* ── Eyebrows ── */}
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

      {/* ── Eyes ── */}
      <Eye cx={29} cy={43} mood={mood} />
      <Eye cx={51} cy={43} mood={mood} />

      {/* ── Mouth ── */}
      <motion.path
        d={MOUTHS[mood]}
        fill="none"
        stroke="#1b1a18"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ d: MOUTHS[mood] }}
        transition={{ duration: 0.35 }}
      />

      {/* ── Ear-like side bumps ── */}
      <circle cx="4"  cy="38" r="5" fill="#ff6200" />
      <circle cx="76" cy="38" r="5" fill="#ff6200" />
    </motion.svg>
  );
}

/* ─── The "peeking" container that slides up from the bottom edge ────────── */

export interface FocusPalCharacterProps {
  mood: Mood;
  /** Whether the pal is visible / peeked up */
  visible: boolean;
  /** Wiggle the character to draw attention */
  wiggle?: boolean;
  /** Click on character body */
  onClick?: () => void;
  className?: string;
}

/**
 * Renders the pal peeking up from the bottom-right corner of the viewport.
 * Uses a fixed-position wrapper so it overlays any content beneath.
 *
 * Visibility is driven by `visible`. When false the character slides back down
 * so only the very top of the head peeks above the fold (like it's hiding).
 */
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
      // When hidden: slide down so ~20px of the top of the head remains visible
      // as a teaser. When visible: fully pop up.
      initial={{ y: "calc(100% - 20px)" }}
      animate={{ y: visible ? "0%" : "calc(100% - 20px)" }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
        mass: 0.9,
      }}
      onClick={onClick}
      role="button"
      aria-label={visible ? "Focus Pal — click to dismiss" : "Focus Pal — click to open"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {/* Subtle drop shadow platform so the pal "sits" on the bottom bar */}
      <div className="relative">
        <PalFace
          mood={mood}
          wiggle={wiggle}
          className="size-20 drop-shadow-xl transition-[filter]"
        />

        {/* Tiny "feet" / base oval so it looks planted */}
        <div className="mx-auto mt-0.5 h-2 w-14 rounded-full bg-black/10" />
      </div>
    </motion.div>
  );
}
