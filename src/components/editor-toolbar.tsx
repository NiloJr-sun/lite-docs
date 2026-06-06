"use client";

import { type Editor, useEditorState } from "@tiptap/react";

interface ToolbarItem {
  key: string;
  /** Accessible label, used as the button's aria-label. */
  label: string;
  /** Short visible glyph. */
  glyph: string;
  active: boolean;
  run: () => void;
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  // Subscribe to the editor so the active states stay in sync with the
  // selection / document.
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
    }),
  });

  const items: ToolbarItem[] = [
    {
      key: "bold",
      label: "Bold",
      glyph: "B",
      active: active.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      label: "Italic",
      glyph: "I",
      active: active.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      label: "Underline",
      glyph: "U",
      active: active.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: "h1",
      label: "Heading 1",
      glyph: "H1",
      active: active.h1,
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: "h2",
      label: "Heading 2",
      glyph: "H2",
      active: active.h2,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "bulletList",
      label: "Bullet list",
      glyph: "• List",
      active: active.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      label: "Numbered list",
      glyph: "1. List",
      active: active.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap gap-1 border-b border-black/[.1] p-2 dark:border-white/[.1]"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-label={item.label}
          aria-pressed={item.active}
          title={item.label}
          // Keep the editor selection while clicking a toolbar button.
          onMouseDown={(event) => event.preventDefault()}
          onClick={item.run}
          className={`min-w-9 rounded-md px-2 py-1 text-sm font-medium transition-colors ${
            item.active
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-zinc-700 hover:bg-black/[.06] dark:text-zinc-300 dark:hover:bg-white/[.1]"
          }`}
        >
          {item.glyph}
        </button>
      ))}
    </div>
  );
}
