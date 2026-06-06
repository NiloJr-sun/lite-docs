"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { authenticate, type User } from "@/lib/auth";

const STORAGE_KEY = "lite-docs:user";

export interface AuthContextValue {
  /** The currently signed-in user, or `null` when signed out. */
  user: User | null;
  /**
   * Attempt to sign in. Resolves to the `User` on success or `null` when the
   * credentials don't match a seeded account.
   */
  login: (email: string, password: string) => Promise<User | null>;
  /** Clear the current session. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// --- External store backed by localStorage -------------------------------
// The persisted session lives in localStorage, so we read it through
// `useSyncExternalStore` rather than syncing it into React state via an
// effect. This keeps a single source of truth and stays consistent across
// browser tabs.

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  // Reflect sign-in / sign-out performed in another tab.
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

// Cache the parsed user keyed by the raw string so getSnapshot returns a
// stable reference while storage is unchanged (required to avoid an infinite
// render loop in useSyncExternalStore).
let cachedRaw: string | null = null;
let cachedUser: User | null = null;

function getSnapshot(): User | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      // Corrupted storage — treat as signed out.
      cachedUser = null;
    }
  }
  return cachedUser;
}

function getServerSnapshot(): User | null {
  // No persisted session is available during server rendering.
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await authenticate(email, password);
    if (authenticatedUser) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authenticatedUser),
      );
      notify();
    }
    return authenticatedUser;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    notify();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Access the current auth session. Must be used within an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
