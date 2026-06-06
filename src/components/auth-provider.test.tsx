import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/auth-provider";

const STORAGE_KEY = "lite-docs:user";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

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

  it("logs in with valid credentials and persists the session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("alice@example.com", "password123");
    });

    expect(result.current.user?.email).toBe("alice@example.com");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).id).toBe("1");
  });

  it("does not change state on invalid credentials", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let returned: unknown;
    act(() => {
      returned = result.current.login("alice@example.com", "nope");
    });

    expect(returned).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("logs out and clears the persisted session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("bob@example.com", "password123");
    });
    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores an existing session from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: "2", email: "bob@example.com", name: "Bob Brown" }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.email).toBe("bob@example.com");
  });
});
