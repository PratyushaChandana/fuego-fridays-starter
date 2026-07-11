/**
 * src/data — public barrel.
 * Centralises all mock data and dialogue exports.
 */

// Mock seed data
export { mockTasks } from "@/data/mock-tasks";
export { mockMessages, cannedAgentReplies } from "@/data/mock-messages";
export { mockCalendar, formatTime } from "@/data/mock-calendar";
export { mockDocument } from "@/data/mock-documents";

// Mascot dialogue
export {
  pickLine,
  pickReturnGreeting,
  replyFollowUps,
  returnGreetings,
} from "@/data/focusPalDialogue";
