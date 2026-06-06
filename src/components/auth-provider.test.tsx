import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { authenticate } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ authenticate: vi.fn() }));

const STORAGE_KEY = "lite-docs:user";
const ALICE = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "alice@example.com",
  name: "Alice Anderson",
};
const BOB = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "bob@example.com",
  name: "Bob Brown",
};

const mockedAuthenticate = vi.mocked(authenticate);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  mockedAuthenticate.mockReset();
});

describe("useAuth", () => {
  it("throws when used outside of an AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      /must be used within an AuthProvider/,
    );
  });

  it("starts signed out", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it("logs in with valid credentials and persists the session", async () => {
    mockedAuthenticate.mockResolvedValue(ALICE);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("alice@example.com", "password123");
    });

    expect(result.current.user?.email).toBe("alice@example.com");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).id).toBe(ALICE.id);
  });

  it("does not change state on invalid credentials", async () => {
    mockedAuthenticate.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.login("alice@example.com", "nope");
    });

    expect(returned).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("logs out and clears the persisted session", async () => {
    mockedAuthenticate.mockResolvedValue(BOB);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("bob@example.com", "password123");
    });
    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores an existing session from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BOB));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.email).toBe("bob@example.com");
  });
});
