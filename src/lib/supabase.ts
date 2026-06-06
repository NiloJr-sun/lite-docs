import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set them in .env.",
  );
}

/**
 * Shared Supabase browser client.
 *
 * Auth is simulated (see src/lib/auth.ts), so this uses the public anon key and
 * relies on the permissive RLS policies in supabase/documents_policies.sql.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
