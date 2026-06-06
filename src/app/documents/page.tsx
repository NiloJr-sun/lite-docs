"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import {
  createDocument,
  listDocuments,
  type Document,
} from "@/lib/documents";
import { parseFile, UPLOAD_ACCEPT } from "@/lib/import-file";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function DocumentsList() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listDocuments(user.id)
      .then((docs) => {
        if (active) setDocuments(docs);
      })
      .catch((err) => {
        if (active) setError(err.message ?? "Failed to load documents.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    setError("");
    try {
      const doc = await createDocument(user.id);
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError((err as Error).message ?? "Failed to create document.");
      setCreating(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers onChange.
    event.target.value = "";
    if (!file || !user) return;

    setImporting(true);
    setError("");
    try {
      const { title, html } = await parseFile(file);
      const doc = await createDocument(user.id, title, html);
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError((err as Error).message ?? "Failed to import file.");
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {creating ? "Creating…" : "New document"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            onChange={handleUpload}
            className="hidden"
            aria-label="Upload a .txt, .md, or .docx file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-60 dark:border-white/[.15] dark:hover:bg-white/[.06]"
          >
            {importing ? "Importing…" : "Upload file"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.15] dark:hover:bg-white/[.06]"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No documents yet. Create your first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/[.1] dark:hover:bg-white/[.05]"
                >
                  <span className="font-medium">
                    {doc.title || "Untitled document"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(doc.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <DocumentsList />
    </RequireAuth>
  );
}
