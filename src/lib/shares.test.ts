import { beforeEach, describe, expect, it, vi } from "vitest";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "insert", "in", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const from = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => from(...args) },
}));

import { listSharedWithMe, shareDocument } from "@/lib/shares";

const USER = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  from.mockReset();
});

describe("shareDocument", () => {
  it("inserts a row into document_shares", async () => {
    const builder = makeBuilder({ data: null, error: null });
    from.mockReturnValue(builder);

    await shareDocument("doc-1", USER);

    expect(from).toHaveBeenCalledWith("document_shares");
    expect(builder.insert).toHaveBeenCalledWith({
      document_id: "doc-1",
      shared_with_user_id: USER,
    });
  });

  it("throws when the insert fails", async () => {
    from.mockReturnValue(makeBuilder({ data: null, error: { message: "no" } }));
    await expect(shareDocument("doc-1", USER)).rejects.toEqual({
      message: "no",
    });
  });
});

describe("listSharedWithMe", () => {
  it("returns [] without querying documents when nothing is shared", async () => {
    const sharesBuilder = makeBuilder({ data: [], error: null });
    from.mockReturnValueOnce(sharesBuilder);

    const result = await listSharedWithMe(USER);

    expect(result).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
    expect(sharesBuilder.eq).toHaveBeenCalledWith("shared_with_user_id", USER);
  });

  it("fetches the shared documents by their (deduped) ids", async () => {
    const sharesBuilder = makeBuilder({
      data: [
        { document_id: "a" },
        { document_id: "b" },
        { document_id: "a" },
      ],
      error: null,
    });
    const docs = [{ id: "a" }, { id: "b" }];
    const docsBuilder = makeBuilder({ data: docs, error: null });
    from.mockReturnValueOnce(sharesBuilder).mockReturnValueOnce(docsBuilder);

    const result = await listSharedWithMe(USER);

    expect(from).toHaveBeenNthCalledWith(1, "document_shares");
    expect(from).toHaveBeenNthCalledWith(2, "documents");
    expect(docsBuilder.in).toHaveBeenCalledWith("id", ["a", "b"]);
    expect(result).toEqual(docs);
  });
});
