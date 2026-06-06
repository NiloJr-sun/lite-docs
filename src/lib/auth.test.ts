import { beforeEach, describe, expect, it, vi } from "vitest";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  return builder;
}

const from = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => from(...args) },
}));

import { authenticate, findUserByEmail } from "@/lib/auth";

const ALICE_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "alice@example.com",
  name: "Alice Anderson",
  password: "password123",
};

beforeEach(() => {
  from.mockReset();
});

describe("authenticate", () => {
  it("returns the user (without password) for valid credentials", async () => {
    from.mockReturnValue(makeBuilder({ data: ALICE_ROW, error: null }));

    const user = await authenticate("alice@example.com", "password123");

    expect(user).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      email: "alice@example.com",
      name: "Alice Anderson",
    });
    expect(user).not.toHaveProperty("password");
    expect(from).toHaveBeenCalledWith("users");
  });

  it("queries by the normalized (trimmed, lowercased) email", async () => {
    const builder = makeBuilder({ data: ALICE_ROW, error: null });
    from.mockReturnValue(builder);

    await authenticate("  ALICE@example.com  ", "password123");

    expect(builder.eq).toHaveBeenCalledWith("email", "alice@example.com");
  });

  it("returns null for a wrong password", async () => {
    from.mockReturnValue(makeBuilder({ data: ALICE_ROW, error: null }));
    expect(await authenticate("alice@example.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    from.mockReturnValue(makeBuilder({ data: null, error: null }));
    expect(await authenticate("nobody@example.com", "password123")).toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    from.mockReturnValue(makeBuilder({ data: null, error: { message: "boom" } }));
    await expect(
      authenticate("alice@example.com", "password123"),
    ).rejects.toEqual({ message: "boom" });
  });
});

describe("findUserByEmail", () => {
  it("resolves an email to a user, requesting no password column", async () => {
    const builder = makeBuilder({
      data: { id: "2", email: "bob@example.com", name: "Bob Brown" },
      error: null,
    });
    from.mockReturnValue(builder);

    const user = await findUserByEmail("  BOB@example.com ");

    expect(user).toEqual({
      id: "2",
      email: "bob@example.com",
      name: "Bob Brown",
    });
    expect(builder.select).toHaveBeenCalledWith("id, email, name");
    expect(builder.eq).toHaveBeenCalledWith("email", "bob@example.com");
  });

  it("returns null for an unknown email", async () => {
    from.mockReturnValue(makeBuilder({ data: null, error: null }));
    expect(await findUserByEmail("nobody@example.com")).toBeNull();
  });
});
