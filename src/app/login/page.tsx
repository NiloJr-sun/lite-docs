"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const user = login(email, password);
    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/documents");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/[.06] dark:bg-zinc-950 dark:ring-white/[.1]">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Use a seeded test account to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-black/[.1] bg-transparent px-3 py-2 text-base font-normal text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-white/[.4]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-black/[.1] bg-transparent px-3 py-2 text-base font-normal text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:text-zinc-50 dark:focus:border-white/[.4]"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in
          </button>
        </form>
      </main>
    </div>
  );
}
