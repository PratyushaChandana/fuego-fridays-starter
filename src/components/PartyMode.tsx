import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─── Confetti particle config ──────────────────────────────────────────── */

type Shape = "circle" | "rect" | "star" | "diamond";

interface Particle {
  id: number;
  x: number;        // vw %
  delay: number;    // s
  duration: number; // s
  size: number;     // px
  color: string;
  shape: Shape;
  rotateEnd: number;
  drift: number;    // vw, horizontal drift while falling
  shimmer: boolean;
}

const COLORS = [
  "#ff6200", "#ff9d63", "#ffc4a0",
  "#6fae9c", "#7aa7d8",
  "#f472b6", "#a78bfa",
  "#facc15", "#4ade80",
  "#ffffff",
];

const SHAPES: Shape[] = ["circle", "rect", "star", "diamond"];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.9,
    duration: 1.8 + Math.random() * 2.2,
    size: 5 + Math.floor(Math.random() * 11),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotateEnd: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    drift: (Math.random() - 0.5) * 14,
    shimmer: Math.random() > 0.65,
  }));
}

/* ─── Single confetti piece ─────────────────────────────────────────────── */

function ConfettiPiece({ p }: { p: Particle }) {
  const shimmerStyle = p.shimmer
    ? { filter: "brightness(1.35) saturate(1.4)" }
    : {};

  const shapeEl = (() => {
    switch (p.shape) {
      case "circle":
        return (
          <div
            className="rounded-full"
            style={{ width: p.size, height: p.size, background: p.color, ...shimmerStyle }}
          />
        );
      case "rect":
        return (
          <div
            style={{
              width: p.size * 1.6,
              height: p.size * 0.7,
              background: p.color,
              borderRadius: 2,
              ...shimmerStyle,
            }}
          />
        );
      case "star":
        return (
          <svg width={p.size * 1.4} height={p.size * 1.4} viewBox="0 0 24 24">
            <polygon
              points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
              fill={p.color}
              style={shimmerStyle}
            />
          </svg>
        );
      case "diamond":
        return (
          <div
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              transform: "rotate(45deg)",
              ...shimmerStyle,
            }}
          />
        );
    }
  })();

  return (
    <motion.div
      className="pointer-events-none absolute top-0"
      style={{ left: `${p.x}vw` }}
      initial={{ y: "-5vh", rotate: 0, opacity: 1 }}
      animate={{
        y: "105vh",
        x: `${p.drift}vw`,
        rotate: p.rotateEnd,
        opacity: [1, 1, 0.8, 0],
      }}
      transition={{
        duration: p.duration,
        delay: p.delay,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { times: [0, 0.6, 0.8, 1] },
      }}
    >
      {shapeEl}
    </motion.div>
  );
}

/* ─── Red Panda SVG — mid-jump, paws raised ────────────────────────────── */

function RedPanda({ badge }: { badge?: string }) {
  return (
    <div className="relative inline-block select-none">
      <svg
        viewBox="0 0 260 300"
        className="w-52 sm:w-64 drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Red panda jumping with excitement"
      >
        {/* ── Tail (behind body) ── */}
        <path
          d="M 60 210 Q 20 240 10 270 Q 30 280 55 260 Q 70 240 80 215 Z"
          fill="#c44e00"
          opacity="0.85"
        />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${22 + i * 10} ${262 - i * 8} Q ${35 + i * 8} ${255 - i * 7} ${46 + i * 9} ${260 - i * 8}`}
            fill="none"
            stroke="#7a3005"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}

        {/* ── Body ── */}
        <ellipse cx="130" cy="195" rx="58" ry="68" fill="#c44e00" />
        <ellipse cx="130" cy="205" rx="34" ry="44" fill="#ffc4a0" opacity="0.7" />

        {/* ── LEFT ARM — raised high ── */}
        <path d="M 78 155 Q 50 120 38 90 Q 55 78 68 100 Q 80 125 95 158 Z" fill="#c44e00" />
        <ellipse cx="41" cy="84" rx="13" ry="10" fill="#9c3d00" />
        <ellipse cx="34" cy="79" rx="5" ry="4" fill="#7a3005" />
        <ellipse cx="48" cy="78" rx="5" ry="4" fill="#7a3005" />
        <ellipse cx="41" cy="74" rx="4" ry="3.5" fill="#7a3005" />

        {/* ── RIGHT ARM — raised high ── */}
        <path d="M 182 155 Q 210 120 222 90 Q 205 78 192 100 Q 180 125 165 158 Z" fill="#c44e00" />
        <ellipse cx="219" cy="84" rx="13" ry="10" fill="#9c3d00" />
        <ellipse cx="212" cy="79" rx="5" ry="4" fill="#7a3005" />
        <ellipse cx="226" cy="78" rx="5" ry="4" fill="#7a3005" />
        <ellipse cx="219" cy="74" rx="4" ry="3.5" fill="#7a3005" />

        {/* ── LEFT LEG — bent mid-jump ── */}
        <path d="M 100 255 Q 75 275 65 295 Q 80 298 92 282 Q 105 265 115 252 Z" fill="#c44e00" />
        <ellipse cx="68" cy="294" rx="14" ry="8" fill="#9c3d00" transform="rotate(-20 68 294)" />

        {/* ── RIGHT LEG — bent mid-jump ── */}
        <path d="M 160 255 Q 185 275 195 295 Q 180 298 168 282 Q 155 265 145 252 Z" fill="#c44e00" />
        <ellipse cx="192" cy="294" rx="14" ry="8" fill="#9c3d00" transform="rotate(20 192 294)" />

        {/* ── HEAD ── */}
        <circle cx="130" cy="115" r="62" fill="#c44e00" />
        <ellipse cx="130" cy="98" rx="38" ry="28" fill="#ff8038" opacity="0.45" />

        {/* ── EARS ── */}
        <ellipse cx="78" cy="68" rx="20" ry="24" fill="#c44e00" transform="rotate(-20 78 68)" />
        <ellipse cx="78" cy="68" rx="11" ry="14" fill="#ff9d63" transform="rotate(-20 78 68)" />
        <ellipse cx="182" cy="68" rx="20" ry="24" fill="#c44e00" transform="rotate(20 182 68)" />
        <ellipse cx="182" cy="68" rx="11" ry="14" fill="#ff9d63" transform="rotate(20 182 68)" />

        {/* ── EYE PATCHES — enlarged for anime scale ── */}
        <ellipse cx="108" cy="110" rx="24" ry="23" fill="#1b1a18" opacity="0.88" />
        <ellipse cx="152" cy="110" rx="24" ry="23" fill="#1b1a18" opacity="0.88" />

        {/* ── EYES — anime-large with sparkle highlights ── */}
        {/* sclera (whites) */}
        <circle cx="108" cy="110" r="15" fill="white" />
        <circle cx="152" cy="110" r="15" fill="white" />
        {/* pupils */}
        <circle cx="109" cy="111" r="10" fill="#1b1a18" />
        <circle cx="153" cy="111" r="10" fill="#1b1a18" />
        {/* iris colour ring — warm amber for personality */}
        <circle cx="109" cy="111" r="10" fill="none" stroke="#c47a00" strokeWidth="1.5" opacity="0.6" />
        <circle cx="153" cy="111" r="10" fill="none" stroke="#c47a00" strokeWidth="1.5" opacity="0.6" />
        {/* primary sparkle — large teardrop catch-light top-left */}
        <ellipse cx="103" cy="104" rx="4.5" ry="5.5" fill="white" opacity="0.95" transform="rotate(-18 103 104)" />
        <ellipse cx="147" cy="104" rx="4.5" ry="5.5" fill="white" opacity="0.95" transform="rotate(-18 147 104)" />
        {/* secondary sparkle — small dot lower-right */}
        <circle cx="115" cy="117" r="2" fill="white" opacity="0.8" />
        <circle cx="159" cy="117" r="2" fill="white" opacity="0.8" />

        {/* excitement starburst lines — shifted outward to clear bigger eyes */}
        {[-35, 0, 35].map((angle) => (
          <line
            key={`l-${angle}`}
            x1="86" y1="92"
            x2={86 + 12 * Math.cos((angle * Math.PI) / 180)}
            y2={92 - 12 * Math.sin((angle * Math.PI) / 180)}
            stroke="#facc15" strokeWidth="2.2" strokeLinecap="round"
          />
        ))}
        {[-35, 0, 35].map((angle) => (
          <line
            key={`r-${angle}`}
            x1="174" y1="92"
            x2={174 + 12 * Math.cos(((180 - angle) * Math.PI) / 180)}
            y2={92 - 12 * Math.sin((angle * Math.PI) / 180)}
            stroke="#facc15" strokeWidth="2.2" strokeLinecap="round"
          />
        ))}

        {/* ── NOSE + MUZZLE ── */}
        <ellipse cx="130" cy="127" rx="8" ry="5.5" fill="#7a3005" />
        <ellipse cx="130" cy="134" rx="18" ry="12" fill="#ffc4a0" opacity="0.65" />

        {/* ── MOUTH — wide excited smile ── */}
        <path
          d="M 112 134 Q 118 145 130 148 Q 142 145 148 134"
          fill="none" stroke="#7a3005" strokeWidth="2.5" strokeLinecap="round"
        />
        <path
          d="M 119 139 L 119 144 M 130 141 L 130 147 M 141 139 L 141 144"
          stroke="white" strokeWidth="3" strokeLinecap="round"
        />

        {/* ── CHEEKS + FACE MARKINGS ── */}
        <ellipse cx="92" cy="128" rx="12" ry="7" fill="#ff6200" opacity="0.35" />
        <ellipse cx="168" cy="128" rx="12" ry="7" fill="#ff6200" opacity="0.35" />
        <path d="M 90 118 Q 84 128 86 140" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
        <path d="M 170 118 Q 176 128 174 140" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />

        {/* ── 45s BADGE near right paw ── */}
        {badge && (
          <g transform="translate(208, 58)">
            <rect x="-18" y="-12" width="36" height="22" rx="11" fill="#facc15" />
            <text
              x="0" y="5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#1b1a18"
              fontFamily="-apple-system, sans-serif"
            >
              {badge}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─── Bouncy text ───────────────────────────────────────────────────────── */

function BouncyText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const chars = text.split("");
  return (
    <div className={cn("flex flex-wrap justify-center", className)}>
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: 30, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 14,
            delay: delay + i * 0.028,
          }}
          style={{ whiteSpace: ch === " " ? "pre" : undefined }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── Laptop chassis foreground ─────────────────────────────────────────── */

function LaptopForeground() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20">
      <svg
        viewBox="0 0 800 80"
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="hinge-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b1a18" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1b1a18" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* chassis body */}
        <rect x="0" y="30" width="800" height="50" rx="6" fill="#d1d5db" />
        {/* top edge highlight */}
        <rect x="0" y="30" width="800" height="4" rx="2" fill="#e5e7eb" />
        {/* trackpad */}
        <rect x="330" y="40" width="140" height="30" rx="6" fill="#b8bcc4" />
        <rect x="330" y="40" width="140" height="2" rx="1" fill="#c9cdd5" />
        {/* hinge shadow */}
        <rect x="0" y="28" width="800" height="6" fill="url(#hinge-shadow)" rx="3" />
        {/* left hand — stylised */}
        <g opacity="0.55">
          <path d="M 50 80 Q 55 50 70 42 Q 80 38 85 45 Q 82 55 78 65 Q 72 75 65 80 Z" fill="#d4a574" />
          <path d="M 68 44 Q 64 34 66 28 Q 70 26 73 30 Q 73 37 72 44" fill="#d4a574" />
          <path d="M 76 43 Q 74 32 77 27 Q 81 26 83 31 Q 82 38 80 43" fill="#d4a574" />
          <path d="M 83 45 Q 83 35 87 31 Q 91 31 92 36 Q 90 42 87 46" fill="#d4a574" />
          <path d="M 58 47 Q 54 38 57 34 Q 61 33 63 38 Q 63 43 62 48" fill="#d4a574" />
        </g>
      </svg>
    </div>
  );
}

/* ─── Main PartyMode overlay ────────────────────────────────────────────── */

export interface PartyModeProps {
  visible: boolean;
  onGetBackToWork: () => void;
  onKeepPartying: () => void;
}

const PARTICLE_COUNT = 90;

export function PartyMode({ visible, onGetBackToWork, onKeepPartying }: PartyModeProps) {
  // Stable particle list — remounted via waveId key to replay fall animations
  const particles = useMemo(() => makeParticles(PARTICLE_COUNT), []);

  // Wave counter: incrementing the key remounts the confetti div, replaying all animations
  const waveCounterRef = useRef(0);
  const [waveId, setWaveId] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      waveCounterRef.current += 1;
      setWaveId(waveCounterRef.current);
    }, 2_800);
    return () => clearInterval(t);
  }, [visible]);

  // Panda entrance jump
  const pandaControls = useAnimation();
  useEffect(() => {
    if (!visible) return;
    pandaControls.start({
      y: [0, -28, 0, -14, 0],
      rotate: [0, -4, 4, -2, 0],
      transition: { duration: 0.9, ease: "easeOut", delay: 0.15 },
    });
  }, [visible, pandaControls]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="party-overlay"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: 0.25 }}
        >
          {/* ── Warm paper backdrop ── */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, #fff4ed 0%, #faf9f7 55%, #ffe4d3 100%)",
            }}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* ── Confetti — key change remounts to replay particle fall ── */}
          <div
            key={waveId}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            {particles.map((p) => (
              <ConfettiPiece key={p.id} p={p} />
            ))}
          </div>

          {/* ── Main content ── */}
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
            <BouncyText
              text="YAY! 45s! Time to PARTAY!"
              delay={0.1}
              className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-fuego-600"
            />

            <motion.div animate={pandaControls}>
              <RedPanda badge="45s" />
            </motion.div>

            <BouncyText
              text="Or... get back to work? Your call, pal! 🎉"
              delay={0.55}
              className="text-lg sm:text-xl font-bold text-foreground/80"
            />

            <motion.div
              className="flex flex-col items-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4, ease: "easeOut" }}
            >
              <button
                onClick={onGetBackToWork}
                className={cn(
                  "rounded-full bg-fuego-500 px-7 py-3 text-sm font-bold text-white shadow-lg",
                  "transition-all hover:bg-fuego-600 hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuego-400/50"
                )}
              >
                Back to work 💪
              </button>
              <button
                onClick={onKeepPartying}
                className={cn(
                  "rounded-full border-2 border-fuego-300 bg-white/80 px-7 py-3 text-sm font-bold text-fuego-700",
                  "transition-all hover:bg-fuego-50 hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuego-400/50"
                )}
              >
                5 more mins 🪩
              </button>
            </motion.div>
          </div>

          {/* ── Silver laptop chassis + hand in foreground ── */}
          <LaptopForeground />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
