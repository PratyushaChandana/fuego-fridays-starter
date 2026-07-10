import { useCallback, useEffect, useRef, useState } from "react";

import { useIdleDetector, type IdleState } from "@/hooks/useIdleDetector";
import {
  pickLine,
  pickReturnGreeting,
  replyFollowUps,
  type PalLine,
} from "@/data/focusPalDialogue";
import { FocusPalCharacter } from "@/components/FocusPalCharacter";
import { SpeechBubble, TypingBubble } from "@/components/SpeechBubble";
import { PartyMode } from "@/components/PartyMode";

/* ─── Internal state machine ────────────────────────────────────────────── */

type PalPhase =
  | "hidden"        // user is active — pal fully hidden
  | "party"         // 45 s idle-soon hit — full-screen party overlay
  | "peeking"       // post-party: pal peeks from edge, no bubble
  | "typing"        // idle (2 min) hit — show typing dots before message
  | "speaking"      // bubble with message is live
  | "reply-typing"  // user tapped a quick reply — typing a follow-up
  | "reply-shown"   // follow-up message displayed
  | "returning";    // user returned from idle — brief greeting

const TYPING_DELAY_MS = 1_100;
const RETURN_GREET_DURATION_MS = 3_500;
// How long to let party mode run before auto-advancing to the idle check-in.
// "5 more mins" snoozes by resetting this timer.
const PARTY_AUTO_ADVANCE_MS = 30_000;

export function FocusPal() {
  const { idleState, resetIdle } = useIdleDetector();
  const prevIdleStateRef = useRef<IdleState>("active");

  const [phase, setPhase] = useState<PalPhase>("hidden");
  const [currentLine, setCurrentLine] = useState<PalLine | null>(null);
  const [wiggle, setWiggle] = useState(false);

  const triggeredStateRef = useRef<IdleState | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  const clearTimers = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
  }, []);

  const deliverLine = useCallback((line: PalLine, onShown?: () => void) => {
    setCurrentLine(null);
    setPhase("typing");
    typingTimerRef.current = setTimeout(() => {
      setCurrentLine(line);
      setPhase("speaking");
      onShown?.();
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }, TYPING_DELAY_MS);
  }, []);

  /* ── Schedule auto-advance out of party mode ────────────────────────── */
  const schedulePartyAdvance = useCallback(() => {
    if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
    partyTimerRef.current = setTimeout(() => {
      // Time's up — deliver the idle check-in message
      const line = pickLine("idle");
      if (line) deliverLine(line);
    }, PARTY_AUTO_ADVANCE_MS);
  }, [deliverLine]);

  /* ── React to idle state changes ─────────────────────────────────────── */

  useEffect(() => {
    const prev = prevIdleStateRef.current;
    prevIdleStateRef.current = idleState;

    // ── User returned (any idle → active) ─────────────────────────────────
    if (idleState === "active" && prev !== "active") {
      clearTimers();
      triggeredStateRef.current = null;

      if (
        phase === "party" ||
        phase === "speaking" ||
        phase === "typing" ||
        phase === "peeking"
      ) {
        const greet = pickReturnGreeting();
        setPhase("returning");
        setCurrentLine(greet);
        returnTimerRef.current = setTimeout(() => {
          setPhase("hidden");
          setCurrentLine(null);
        }, RETURN_GREET_DURATION_MS);
      } else {
        setPhase("hidden");
        setCurrentLine(null);
      }
      return;
    }

    // ── 45 s — enter PARTY mode ────────────────────────────────────────────
    if (
      idleState === "idle-soon" &&
      triggeredStateRef.current !== "idle-soon"
    ) {
      triggeredStateRef.current = "idle-soon";
      clearTimers();
      setPhase("party");
      schedulePartyAdvance();
      return;
    }

    // ── 2 min — deliver idle check-in (if party was already dismissed) ─────
    if (
      idleState === "idle" &&
      triggeredStateRef.current !== "idle" &&
      triggeredStateRef.current !== "long-idle"
    ) {
      triggeredStateRef.current = "idle";
      clearTimers();
      const line = pickLine("idle");
      if (line) deliverLine(line);
      return;
    }

    // ── 5 min — long-idle escalation ───────────────────────────────────────
    if (
      idleState === "long-idle" &&
      triggeredStateRef.current !== "long-idle"
    ) {
      triggeredStateRef.current = "long-idle";
      clearTimers();
      const line = pickLine("long-idle");
      if (line) deliverLine(line);
      return;
    }
  }, [idleState, phase, clearTimers, deliverLine, schedulePartyAdvance]);

  /* ── Cleanup on unmount ─────────────────────────────────────────────── */
  useEffect(() => () => clearTimers(), [clearTimers]);

  /* ── Party mode button handlers ─────────────────────────────────────── */

  const handleGetBackToWork = useCallback(() => {
    clearTimers();
    setPhase("hidden");
    setCurrentLine(null);
    triggeredStateRef.current = null;
    resetIdle();
  }, [clearTimers, resetIdle]);

  const handleKeepPartying = useCallback(() => {
    // Snooze: stay in party phase but reset the auto-advance timer
    if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
    schedulePartyAdvance();
  }, [schedulePartyAdvance]);

  /* ── Regular bubble handlers ────────────────────────────────────────── */

  const handleDismiss = useCallback(() => {
    clearTimers();
    setPhase("hidden");
    setCurrentLine(null);
    triggeredStateRef.current = null;
    resetIdle();
  }, [clearTimers, resetIdle]);

  const handleReply = useCallback(
    (reply: string) => {
      clearTimers();
      const followUp = replyFollowUps[reply];
      if (followUp) {
        deliverLine(followUp, () => {
          setPhase("reply-shown");
          returnTimerRef.current = setTimeout(() => {
            setPhase("hidden");
            setCurrentLine(null);
            triggeredStateRef.current = null;
            resetIdle();
          }, 6_000);
        });
      } else {
        handleDismiss();
      }
    },
    [clearTimers, deliverLine, handleDismiss, resetIdle]
  );

  const handleCharacterClick = useCallback(() => {
    if (phase === "hidden") return;
    if (phase === "speaking" || phase === "reply-shown") {
      handleDismiss();
      return;
    }
    if (phase === "peeking") {
      const line = pickLine("idle-soon");
      if (line) deliverLine(line);
    }
  }, [phase, handleDismiss, deliverLine]);

  /* ── Derived render values ─────────────────────────────────────────── */

  const characterVisible = phase !== "hidden" && phase !== "party";
  const bubbleVisible = phase === "speaking" || phase === "reply-shown" || phase === "returning";
  const typingVisible = phase === "typing" || phase === "reply-typing";
  const mood = currentLine?.mood ?? "curious";

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <>
      {/* Full-screen party overlay — triggered at 45 s */}
      <PartyMode
        visible={phase === "party"}
        onGetBackToWork={handleGetBackToWork}
        onKeepPartying={handleKeepPartying}
      />

      {/* Regular pal overlay (hidden during party phase) */}
      <SpeechBubble
        line={currentLine}
        visible={bubbleVisible}
        onReply={handleReply}
        onDismiss={handleDismiss}
      />
      <TypingBubble visible={typingVisible} />
      <FocusPalCharacter
        mood={mood}
        visible={characterVisible}
        wiggle={wiggle}
        onClick={handleCharacterClick}
      />
    </>
  );
}
