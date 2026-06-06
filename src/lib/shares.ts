import { supabase } from "@/lib/supabase";
import type { Document } from "@/lib/documents";

const SHARES_TABLE = "document_shares";
const DOCUMENTS_TABLE = "documents";

/** Share a document with another user (by their user id). */
export async function shareDocument(
  documentId: string,
  sharedWithUserId: string,
): Promise<void> {
  // documents.id is an integer column, so send a number for numeric ids
  // (and leave uuid-style ids as strings).
  const documentIdValue = /^\d+$/.test(documentId)
    ? Number(documentId)
    : documentId;

  const { error } = await supabase.from(SHARES_TABLE).insert({
    document_id: documentIdValue,
    shared_with_user_id: sharedWithUserId,
  });
  if (error) throw error;
}

/** List documents that have been shared with the given user. */
export async function listSharedWithMe(userId: string): Promise<Document[]> {
  const { data: shares, error } = await supabase
    .from(SHARES_TABLE)
    .select("document_id")
    .eq("shared_with_user_id", userId);
  if (error) throw error;

  // Collapse duplicate shares to unique document ids.
  const ids = [...new Set((shares ?? []).map((row) => row.document_id))];
  if (ids.length === 0) return [];

  const { data: documents, error: documentsError } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });
  if (documentsError) throw documentsError;

  return documents ?? [];
}
