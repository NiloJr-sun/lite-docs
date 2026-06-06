"use client";

import { useState } from "react";
import { findUserByEmail } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { shareDocument } from "@/lib/shares";

type Feedback = { type: "error" | "success"; message: string } | null;

export function ShareButton({ documentId }: { documentId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function close() {
    setOpen(false);
    setEmail("");
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setFeedback(null);

    const recipient = findUserByEmail(email);
    if (!recipient) {
      setFeedback({ type: "error", message: "No account with that email." });
      return;
    }
    if (recipient.id === user.id) {
      setFeedback({
        type: "error",
        message: "This document is already yours.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await shareDocument(documentId, recipient.id);
      setFeedback({
        type: "success",
        message: `Shared with ${recipient.name}.`,
      });
      setEmail("");
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message ?? "Failed to share.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/[.1] px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.15] dark:hover:bg-white/[.06]"
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share document"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/[.06] dark:bg-zinc-950 dark:ring-white/[.1]"
          >
            <h2 className="text-lg font-semibold">Share document</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Enter the email of another user to share this document with them.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                required
                autoFocus
                aria-label="Recipient email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-black/[.1] bg-transparent px-3 py-2 text-base outline-none focus:border-black/[.3] dark:border-white/[.15] dark:focus:border-white/[.4]"
              />

              {feedback && (
                <p
                  role="alert"
                  className={`text-sm ${
                    feedback.type === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {feedback.message}
                </p>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.06]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
                >
                  {submitting ? "Sharing…" : "Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
