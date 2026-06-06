import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure the DOM and localStorage are reset between tests.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
