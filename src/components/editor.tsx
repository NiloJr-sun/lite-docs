"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "@/components/editor-toolbar";

interface EditorProps {
  /** Initial editor HTML. */
  content: string;
  /** Called with the latest HTML whenever the document changes. */
  onChange?: (html: string) => void;
  editable?: boolean;
}

export function Editor({ content, onChange, editable = true }: EditorProps) {
  const editor = useEditor({
    // Required when rendering in the App Router to avoid hydration mismatches.
    immediatelyRender: false,
    editable,
    extensions: [StarterKit.configure({ heading: { levels: [1, 2] } })],
    content,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        "aria-label": "Document content",
        class: "min-h-[60vh] w-full px-4 py-3 outline-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-xl border border-black/[.1] bg-white dark:border-white/[.1] dark:bg-zinc-950">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
