import { supabase } from "@/lib/supabase";

/** A row in the Supabase `documents` table. */
export interface Document {
  id: string;
  user_id: string;
  title: string;
  /** Editor HTML produced by Tiptap. */
  content: string;
  created_at: string;
  updated_at: string;
}

const TABLE = "documents";

export const DEFAULT_TITLE = "Untitled document";

/** List a user's documents, most recently updated first. */
export async function listDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Create a new (empty) document owned by the given user. */
export async function createDocument(
  userId: string,
  title: string = DEFAULT_TITLE,
): Promise<Document> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, title, content: "" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Fetch a single document by id, or `null` if it doesn't exist. */
export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Patch a document's title and/or content. Bumps `updated_at`. */
export async function updateDocument(
  id: string,
  patch: Partial<Pick<Document, "title" | "content">>,
): Promise<Document> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a document by id. */
export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
