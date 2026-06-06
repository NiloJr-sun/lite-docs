"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/editor";
import { RequireAuth } from "@/components/require-auth";
import { getDocument, updateDocument, type Document } from "@/lib/documents";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Save failed — retry",
};

function DocumentEditor({ id }: { id: string }) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<SaveStatus>("saved");

  // Holds the latest unsaved values so the debounced save always flushes the
  // freshest title/content without re-creating the timer on every keystroke.
  const latest = useRef({ title: "", content: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the document. The component is remounted via `key` when `id` changes,
  // so initial state (loading=true) covers each load.
  useEffect(() => {
    let active = true;
    getDocument(id)
      .then((loaded) => {
        if (!active) return;
        if (!loaded) {
          setNotFound(true);
          return;
        }
        setDoc(loaded);
        setTitle(loaded.title);
        latest.current = { title: loaded.title, content: loaded.content };
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Clear any pending autosave on unmount.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const save = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setStatus("saving");
    try {
      const updated = await updateDocument(id, {
        title: latest.current.title,
        content: latest.current.content,
      });
      setDoc(updated);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id]);

  const scheduleSave = useCallback(() => {
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
  }, [save]);

  function handleTitleChange(value: string) {
    setTitle(value);
    latest.current.title = value;
    scheduleSave();
  }

  function handleContentChange(html: string) {
    latest.current.content = html;
    scheduleSave();
  }

  if (loading) {
    return <p className="px-6 py-12 text-sm text-zinc-500">Loading…</p>;
  }

  if (notFound || !doc) {
    return (
      <div className="px-6 py-12">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Document not found.
        </p>
        <Link
          href="/documents"
          className="mt-2 inline-block text-sm font-medium underline"
        >
          Back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/documents"
          className="text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
        >
          ← All documents
        </Link>
        <div className="flex items-center gap-3">
          <span
            role="status"
            aria-live="polite"
            className="text-xs text-zinc-500"
          >
            {STATUS_LABEL[status]}
          </span>
          <button
            type="button"
            onClick={() => void save()}
            disabled={status === "saving"}
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            Save
          </button>
        </div>
      </div>

      <input
        aria-label="Document title"
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
        placeholder="Untitled document"
        className="mb-4 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-zinc-400"
      />

      <Editor content={doc.content} onChange={handleContentChange} />
    </div>
  );
}

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth>
      <DocumentEditor key={params.id} id={params.id} />
    </RequireAuth>
  );
}
