import { supabase } from "@/lib/supabase";

/**
 * Simulated authentication backed by the Supabase `users` table.
 *
 * Passwords are compared in plain text (demo only). The returned `User` never
 * includes the password. See supabase/seed_users.sql for the seeded accounts.
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

const USERS_TABLE = "users";

/**
 * Validate credentials against the seeded users.
 *
 * @returns the matching `User` (without password), or `null` if the email /
 * password combination is invalid.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, email, name, password")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.password !== password) {
    return null;
  }

  return { id: data.id, email: data.email, name: data.name };
}

/**
 * Look up a user by email (case-insensitive). Used by sharing to resolve a
 * recipient's email to their user id. Returns the `User` without password, or
 * `null` if no account matches.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, email, name")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw error;
  return data ? { id: data.id, email: data.email, name: data.name } : null;
}
