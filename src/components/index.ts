/**
 * src/components — public barrel for custom (non-ui) components.
 * The ui/ primitives are not re-exported here; import them directly from
 * "@/components/ui/<name>" as shadcn/ui intends.
 */

export { FocusPal } from "@/components/FocusPal";
export { FocusPalCharacter, PalFace } from "@/components/FocusPalCharacter";
export type { FocusPalCharacterProps } from "@/components/FocusPalCharacter";
export { SpeechBubble, TypingBubble } from "@/components/SpeechBubble";
export type { SpeechBubbleProps } from "@/components/SpeechBubble";
export { PartyMode } from "@/components/PartyMode";
export type { PartyModeProps } from "@/components/PartyMode";
