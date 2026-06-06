import mammoth from "mammoth";

export interface ParsedFile {
  /** Suggested document title, derived from the file name. */
  title: string;
  /** Editor HTML ready to seed a Tiptap document. */
  html: string;
}

/** File extensions this importer understands. */
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

/** `accept` attribute value for a file input. */
export const UPLOAD_ACCEPT = SUPPORTED_EXTENSIONS.join(",");

export function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Untitled document";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert plain text (.txt / .md) into editor HTML. Blank lines separate
 * paragraphs; single line breaks become `<br>`. Markdown is preserved as
 * literal text (per the brief, .md is read with FileReader, not parsed).
 */
function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((paragraph) => {
      const inner = escapeHtml(paragraph).replace(/\n/g, "<br>");
      return `<p>${inner}</p>`;
    })
    .join("");
}

/** Read a file as text using the native FileReader API. */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/**
 * Parse an uploaded file into a title + HTML, ready to create a new document.
 * Supports `.txt`, `.md` (FileReader) and `.docx` (mammoth).
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const title = titleFromFileName(file.name);
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    return { title, html: value };
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = await readAsText(file);
    return { title, html: textToHtml(text) };
  }

  throw new Error(
    `Unsupported file type: ${file.name}. Use ${SUPPORTED_EXTENSIONS.join(", ")}.`,
  );
}
