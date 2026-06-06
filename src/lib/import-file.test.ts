import { beforeEach, describe, expect, it, vi } from "vitest";

const convertToHtml = vi.fn();
vi.mock("mammoth", () => ({
  default: { convertToHtml: (...args: unknown[]) => convertToHtml(...args) },
}));

import { isSupportedFile, parseFile } from "@/lib/import-file";

function makeFile(name: string, contents: string, type = "text/plain"): File {
  return new File([contents], name, { type });
}

beforeEach(() => {
  convertToHtml.mockReset();
});

describe("isSupportedFile", () => {
  it("accepts .txt, .md, .docx (case-insensitive)", () => {
    expect(isSupportedFile("notes.txt")).toBe(true);
    expect(isSupportedFile("README.md")).toBe(true);
    expect(isSupportedFile("Report.DOCX")).toBe(true);
  });

  it("rejects other types", () => {
    expect(isSupportedFile("image.png")).toBe(false);
    expect(isSupportedFile("data.csv")).toBe(false);
  });
});

describe("parseFile", () => {
  it("derives the title from the file name without extension", async () => {
    const { title } = await parseFile(makeFile("My Notes.txt", "hi"));
    expect(title).toBe("My Notes");
  });

  it("converts .txt content into paragraphs with line breaks", async () => {
    const file = makeFile("doc.txt", "line one\nline two\n\nsecond para");
    const { html } = await parseFile(file);
    expect(html).toBe("<p>line one<br>line two</p><p>second para</p>");
  });

  it("escapes HTML in plain text", async () => {
    const { html } = await parseFile(makeFile("x.md", "a < b & c > d"));
    expect(html).toBe("<p>a &lt; b &amp; c &gt; d</p>");
  });

  it("treats markdown as literal text (no parsing)", async () => {
    const { html } = await parseFile(makeFile("x.md", "# Heading\n- item"));
    expect(html).toBe("<p># Heading<br>- item</p>");
  });

  it("uses mammoth to convert .docx", async () => {
    convertToHtml.mockResolvedValue({ value: "<h1>From Word</h1>", messages: [] });
    const file = makeFile(
      "report.docx",
      "binary",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const { title, html } = await parseFile(file);

    expect(title).toBe("report");
    expect(html).toBe("<h1>From Word</h1>");
    expect(convertToHtml).toHaveBeenCalledOnce();
    expect(convertToHtml.mock.calls[0][0]).toHaveProperty("arrayBuffer");
  });

  it("rejects unsupported file types", async () => {
    await expect(parseFile(makeFile("photo.png", "x"))).rejects.toThrow(
      /Unsupported file type/,
    );
  });
});
