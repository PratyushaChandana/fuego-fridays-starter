/**
 * Dialogue library for Focus Pal.
 *
 * Tone: a kid-like, warm, slightly goofy AI teammate — energetic but never
 * pushy. Short sentences. Lots of "we" framing. Occasional emoji. Never
 * condescending. The pal notices, aligns, and coaches — it doesn't nag.
 *
 * Types (PalLine, IdleState) live in @/types — imported from there so this
 * file has no dependency on any hook.
 */

import type { IdleState, PalLine } from "@/types";

// Re-export PalLine so existing imports from "@/data/focusPalDialogue" keep working.
export type { PalLine } from "@/types";

const dialogue: Record<IdleState, PalLine[]> = {
  /** Never shown — the pal hides while the user is active. */
  active: [],

  /** Gentle nudge: user has been quiet for ~45 s. */
  "idle-soon": [
    {
      text: "psst… going okay over there? 👀",
      mood: "curious",
      replies: ["Yep, still here!", "Give me a sec"],
    },
    {
      text: "you got quiet. thinking hard or need a hand?",
      mood: "curious",
      replies: ["Thinking hard", "Actually stuck"],
    },
    {
      text: "hey hey — just checking in. no rush!",
      mood: "happy",
      replies: ["All good!", "Hmm, kinda stuck"],
    },
    {
      text: "is it snack time? because I'm thinking snack time 🍪",
      mood: "excited",
      replies: ["Not yet!", "… actually yes"],
    },
  ],

  /** Main idle check-in: 2 minutes of silence. Pal pops up fully. */
  idle: [
    {
      text: "hey!! you've been quiet for a bit. want to pick a task together?",
      mood: "excited",
      replies: ["Let's do it!", "Taking a break"],
    },
    {
      text: "I noticed you stepped away. should we do a quick focus sprint when you're back? 🏃",
      mood: "curious",
      replies: ["Yes, let's sprint!", "Not yet"],
    },
    {
      text: "two whole minutes! that's like, forever in computer time ⏰ what's next for us?",
      mood: "worried",
      replies: ["Back on it!", "Need a break"],
    },
    {
      text: "idle alert 🚨 (just kidding, it's chill). but for real — anything I can help with?",
      mood: "happy",
      replies: ["Help me focus", "I'm taking a break"],
    },
    {
      text: "your keyboard looks lonely. want me to suggest something to work on?",
      mood: "sleepy",
      replies: ["Sure, suggest!", "No thanks"],
    },
    {
      text: "if you're stuck, let's break the thing into tiny pieces. tiny pieces are my specialty 🧩",
      mood: "excited",
      replies: ["Let's break it down", "I'm not stuck"],
    },
  ],

  /** Long idle: 5+ minutes. Deeper, warmer check-in. */
  "long-idle": [
    {
      text: "whoa… five minutes! everything okay? sometimes a walk helps me think 🚶",
      mood: "worried",
      replies: ["Back now!", "Taking a real break"],
    },
    {
      text: "hey, long breaks are great. seriously. when you're ready we'll crush whatever's next 💪",
      mood: "happy",
      replies: ["Ready to go!", "A few more mins"],
    },
    {
      text: "I've been sitting here practising my waiting. I'm VERY good at it now. no pressure at all 😅",
      mood: "sleepy",
      replies: ["Ha! I'm back", "Still away"],
    },
    {
      text: "just a gentle check: are you still at your desk, or did you go on an adventure?",
      mood: "curious",
      replies: ["Still here", "Had to step out"],
    },
    {
      text: "no rush, really. but when you come back I have some ideas for what to tackle next ✨",
      mood: "excited",
      replies: ["Show me!", "Give me a minute"],
    },
  ],
};

/** Pick a random line from the pool for a given idle state. */
export function pickLine(state: IdleState): PalLine | null {
  const pool = dialogue[state];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Follow-up lines the pal uses AFTER the user taps a quick reply.
 * Keyed by the exact reply label string.
 */
export const replyFollowUps: Record<string, PalLine> = {
  "Let's do it!": {
    text: "okay okay okay — open task, let's gooo 🔥",
    mood: "excited",
  },
  "Let's sprint!": {
    text: "pomodoro mode: ON. 25 minutes, you and me. ready?",
    mood: "excited",
  },
  "Yes, let's sprint!": {
    text: "pomodoro mode: ON. 25 minutes, you and me. ready?",
    mood: "excited",
  },
  "Help me focus": {
    text: "pick ONE thing. just one. what's the most important thing right now?",
    mood: "curious",
  },
  "Let's break it down": {
    text: "nice! what's the task? we'll chop it into pieces so small it's basically already done 😄",
    mood: "excited",
  },
  "Actually stuck": {
    text: "being stuck is totally normal! want to talk through it? sometimes just saying it out loud helps.",
    mood: "happy",
  },
  "Hmm, kinda stuck": {
    text: "let's unstick you! what part is the hard part?",
    mood: "curious",
  },
  "Taking a break": {
    text: "smart move. breaks are part of the job. I'll be here when you're back 👋",
    mood: "happy",
  },
  "Taking a real break": {
    text: "absolutely deserved. go rest. I'll keep an eye on things here 🛡️",
    mood: "happy",
  },
  "Back now!": {
    text: "welcome back!! okay, what are we doing first?",
    mood: "excited",
  },
  "Ready to go!": {
    text: "let's GO. what's the first move?",
    mood: "excited",
  },
  "Ha! I'm back": {
    text: "yay! my waiting practice paid off. now — what's the plan?",
    mood: "excited",
  },
  "Show me!": {
    text: "okay, top idea: your most overdue task. want me to pull it up?",
    mood: "curious",
  },
  "… actually yes": {
    text: "snack first, then focus. this is the way 🌮",
    mood: "happy",
  },
  "Need a break": {
    text: "100% valid. step away, stretch, hydrate. I'll hold down the fort.",
    mood: "happy",
  },
};

/**
 * A short affirmation the pal says when the user returns from idle.
 */
export const returnGreetings: PalLine[] = [
  { text: "you're back! let's make something happen ⚡", mood: "excited" },
  { text: "welcome back! ready when you are 🙌", mood: "happy" },
  { text: "there you are! I missed you. let's get into it.", mood: "excited" },
  { text: "back in action! what are we tackling?", mood: "happy" },
];

export function pickReturnGreeting(): PalLine {
  return returnGreetings[Math.floor(Math.random() * returnGreetings.length)];
}
