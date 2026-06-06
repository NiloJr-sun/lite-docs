import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@/components/editor";

const TOOLBAR_BUTTONS = [
  "Bold",
  "Italic",
  "Underline",
  "Heading 1",
  "Heading 2",
  "Bullet list",
  "Numbered list",
];

describe("Editor", () => {
  it("renders the initial content", async () => {
    render(<Editor content="<p>hello world</p>" />);
    expect(await screen.findByText("hello world")).toBeInTheDocument();
  });

  it("renders all formatting toolbar buttons", async () => {
    render(<Editor content="<p></p>" />);
    for (const label of TOOLBAR_BUTTONS) {
      expect(
        await screen.findByRole("button", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("toggles the active state when a toolbar button is clicked", async () => {
    const user = userEvent.setup();
    render(<Editor content="<p>text</p>" />);

    const bold = await screen.findByRole("button", { name: "Bold" });
    expect(bold).toHaveAttribute("aria-pressed", "false");

    await user.click(bold);

    await waitFor(() =>
      expect(bold).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("calls onChange when the document is edited", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Editor content="<p>start</p>" onChange={onChange} />);

    const content = await screen.findByLabelText("Document content");
    content.focus();
    await user.keyboard("more");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.lastCall?.[0]).toContain("more");
  });
});
