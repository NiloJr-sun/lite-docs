import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/components/auth-provider";
import { ShareButton } from "@/components/share-button";
import { findUserByEmail } from "@/lib/auth";

const shareDocument = vi.fn();
vi.mock("@/lib/shares", () => ({
  shareDocument: (...args: unknown[]) => shareDocument(...args),
}));

// authenticate is imported by AuthProvider; findUserByEmail is used here.
vi.mock("@/lib/auth", () => ({
  authenticate: vi.fn(),
  findUserByEmail: vi.fn(),
}));

const ALICE = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "alice@example.com",
  name: "Alice Anderson",
};
const BOB_ID = "22222222-2222-2222-2222-222222222222";
const BOB = { id: BOB_ID, email: "bob@example.com", name: "Bob Brown" };

const mockedFind = vi.mocked(findUserByEmail);

function renderShare() {
  // Sign in as Alice via the persisted session the provider reads on mount.
  localStorage.setItem("lite-docs:user", JSON.stringify(ALICE));
  return render(
    <AuthProvider>
      <ShareButton documentId="doc-1" />
    </AuthProvider>,
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Share" }));
  const dialog = screen.getByRole("dialog", { name: "Share document" });
  return within(dialog);
}

beforeEach(() => {
  shareDocument.mockReset();
  shareDocument.mockResolvedValue(undefined);
  mockedFind.mockReset();
  mockedFind.mockImplementation(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (normalized === "alice@example.com") return ALICE;
    if (normalized === "bob@example.com") return BOB;
    return null;
  });
});

describe("ShareButton", () => {
  it("shares with a known recipient and confirms", async () => {
    const user = userEvent.setup();
    renderShare();
    const dialog = await openDialog(user);

    await user.type(dialog.getByLabelText("Recipient email"), "bob@example.com");
    await user.click(dialog.getByRole("button", { name: "Share" }));

    expect(shareDocument).toHaveBeenCalledWith("doc-1", BOB_ID);
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "Shared with Bob Brown.",
    );
  });

  it("rejects an unknown email without calling the data layer", async () => {
    const user = userEvent.setup();
    renderShare();
    const dialog = await openDialog(user);

    await user.type(
      dialog.getByLabelText("Recipient email"),
      "nobody@example.com",
    );
    await user.click(dialog.getByRole("button", { name: "Share" }));

    expect(shareDocument).not.toHaveBeenCalled();
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "No account with that email.",
    );
  });

  it("prevents sharing a document with yourself", async () => {
    const user = userEvent.setup();
    renderShare();
    const dialog = await openDialog(user);

    await user.type(
      dialog.getByLabelText("Recipient email"),
      "alice@example.com",
    );
    await user.click(dialog.getByRole("button", { name: "Share" }));

    expect(shareDocument).not.toHaveBeenCalled();
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "This document is already yours.",
    );
  });
});
