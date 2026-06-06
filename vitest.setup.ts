import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom doesn't implement layout, but ProseMirror (Tiptap) calls these layout
// APIs when the selection moves. Provide no-op stubs so editing works in tests.
const emptyRect = () => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

for (const proto of [Element.prototype, Range.prototype]) {
  proto.getClientRects = () =>
    Object.assign([] as unknown[], { item: () => null }) as unknown as DOMRectList;
  proto.getBoundingClientRect = emptyRect as () => DOMRect;
}

if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

// Ensure the DOM and localStorage are reset between tests.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
