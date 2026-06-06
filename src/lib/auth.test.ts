import { describe, expect, it } from "vitest";
import { authenticate, SEED_ACCOUNTS } from "@/lib/auth";

describe("authenticate", () => {
  it("returns the user for valid credentials", () => {
    const user = authenticate("alice@example.com", "password123");
    expect(user).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      email: "alice@example.com",
      name: "Alice Anderson",
    });
  });

  it("never returns the password", () => {
    const user = authenticate("bob@example.com", "password123");
    expect(user).not.toBeNull();
    expect(user).not.toHaveProperty("password");
  });

  it("is case-insensitive and trims the email", () => {
    const user = authenticate("  ALICE@example.com  ", "password123");
    expect(user?.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("returns null for a wrong password", () => {
    expect(authenticate("alice@example.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", () => {
    expect(authenticate("nobody@example.com", "password123")).toBeNull();
  });

  it("seeds exactly two accounts", () => {
    expect(SEED_ACCOUNTS).toHaveLength(2);
  });
});
