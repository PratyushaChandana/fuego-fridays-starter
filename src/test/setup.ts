/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// ── localStorage stub ────────────────────────────────────────────────────────
// jsdom ships a real localStorage, but we reset it between tests so each test
// starts with a clean slate.
beforeEach(() => {
  localStorage.clear();
});

// ── matchMedia stub ──────────────────────────────────────────────────────────
// jsdom does not implement window.matchMedia; stub it so components that use
// it (e.g. dark-mode detection) don't throw.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
