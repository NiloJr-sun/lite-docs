-- Seed the simulated user accounts into Supabase.
--
-- The existing `users` table had a bigint `id` and no `name` column, which is
-- incompatible with the uuid `user_id` used by `documents` /
-- `document_shares` (existing documents already reference Bob's uuid). Since
-- the table was empty, we recreate it with a uuid id and seed Alice/Bob with
-- the exact UUIDs the rest of the schema uses.
--
-- ⚠️ DEMO ONLY: passwords are stored in plain text and readable via the anon
-- key (same exposure as the previous hardcoded array). Replace with real
-- Supabase Auth before production.
--
-- Run this in the Supabase dashboard → SQL editor.

drop table if exists public.users;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password text not null,
  created_at timestamptz not null default now()
);

insert into public.users (email, name, password) values
  (
    'alice@example.com',
    'Alice Anderson',
    'password123'
  ),
  (
    'bob@example.com',
    'Bob Brown',
    'password123'
  );

-- Allow the anon role to read users (needed for client-side login lookup).
alter table public.users enable row level security;

drop policy if exists "users_select_anon" on public.users;
create policy "users_select_anon"
  on public.users for select
  to anon, authenticated
  using (true);
