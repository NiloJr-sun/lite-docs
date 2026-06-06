-- Permissive RLS policies for the `documents` table.
--
-- ⚠️ DEMO ONLY. Auth in this app is *simulated* (see src/lib/auth.ts), so there
-- is no real Supabase session/JWT — every request uses the `anon` role. These
-- policies open the table to anyone holding the anon key. Do NOT use this in
-- production; replace it with real Supabase Auth + auth.uid()-based policies.
--
-- Run this in the Supabase dashboard → SQL editor.

alter table public.documents enable row level security;

-- Drop prior copies so this script is idempotent.
drop policy if exists "documents_select_anon" on public.documents;
drop policy if exists "documents_insert_anon" on public.documents;
drop policy if exists "documents_update_anon" on public.documents;
drop policy if exists "documents_delete_anon" on public.documents;

create policy "documents_select_anon"
  on public.documents for select
  to anon, authenticated
  using (true);

create policy "documents_insert_anon"
  on public.documents for insert
  to anon, authenticated
  with check (true);

create policy "documents_update_anon"
  on public.documents for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "documents_delete_anon"
  on public.documents for delete
  to anon, authenticated
  using (true);
