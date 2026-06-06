import { beforeEach, describe, expect, it, vi } from "vitest";

// A chainable Supabase query-builder mock. Every chainable method returns the
// same builder; the builder is awaitable (resolves to `result`), and
// `single`/`maybeSingle` resolve to `result` too.
function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "insert", "update", "delete"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const from = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => from(...args) },
}));

import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/lib/documents";

const USER = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  from.mockReset();
});

describe("documents data layer", () => {
  it("listDocuments queries by user, newest first", async () => {
    const rows = [{ id: "a" }, { id: "b" }];
    const builder = makeBuilder({ data: rows, error: null });
    from.mockReturnValue(builder);

    const result = await listDocuments(USER);

    expect(from).toHaveBeenCalledWith("documents");
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER);
    expect(builder.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
    expect(result).toEqual(rows);
  });

  it("createDocument inserts an empty doc for the user", async () => {
    const row = { id: "new", user_id: USER, title: "Untitled document" };
    const builder = makeBuilder({ data: row, error: null });
    from.mockReturnValue(builder);

    const result = await createDocument(USER);

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: USER,
      title: "Untitled document",
      content: "",
    });
    expect(result).toEqual(row);
  });

  it("getDocument returns null when the row is missing", async () => {
    const builder = makeBuilder({ data: null, error: null });
    from.mockReturnValue(builder);

    expect(await getDocument("missing")).toBeNull();
    expect(builder.eq).toHaveBeenCalledWith("id", "missing");
  });

  it("updateDocument patches title/content and bumps updated_at", async () => {
    const row = { id: "x", title: "Renamed" };
    const builder = makeBuilder({ data: row, error: null });
    from.mockReturnValue(builder);

    const result = await updateDocument("x", { title: "Renamed" });

    const patch = (builder.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(patch.title).toBe("Renamed");
    expect(typeof patch.updated_at).toBe("string");
    expect(builder.eq).toHaveBeenCalledWith("id", "x");
    expect(result).toEqual(row);
  });

  it("deleteDocument removes by id", async () => {
    const builder = makeBuilder({ data: null, error: null });
    from.mockReturnValue(builder);

    await deleteDocument("x");
    expect(builder.eq).toHaveBeenCalledWith("id", "x");
  });

  it("throws when Supabase returns an error", async () => {
    const builder = makeBuilder({ data: null, error: { message: "boom" } });
    from.mockReturnValue(builder);

    await expect(listDocuments(USER)).rejects.toEqual({ message: "boom" });
  });
});
