# Lite Docs

A lightweight document editor built with Next.js and Supabase. Sign in, write
rich-text documents, import files, and share docs with other users.

## Features

- **Simulated auth** — email/password login against a Supabase `users` table, with the session persisted in `localStorage`.
- **Rich-text editor** — Tiptap editor with a toolbar (bold, italic, underline, H1/H2, bullet & numbered lists).
- **Documents** — create, rename, auto-save (debounced) + manual save, and reopen documents stored in Supabase.
- **File import** — upload `.txt`, `.md`, or `.docx` to create a pre-populated document (`.docx` parsed with [mammoth](https://github.com/mwilliamson/mammoth.js)).
- **Sharing** — share a document with another user by email; the dashboard shows **My Documents** and **Shared with Me**.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/) (strict)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- [Tiptap](https://tiptap.dev/) for the editor
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) for tests

## Requirements

- **Node.js 20.9+** (Next.js 16 requirement)
- **npm** (the repo uses `package-lock.json`; avoid mixing in `pnpm`/`yarn`)
- A **Supabase project** (free tier is fine)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

In the Supabase dashboard → **SQL Editor**, run the scripts in [`supabase/`](supabase/):

1. **[`supabase/seed_users.sql`](supabase/seed_users.sql)** — creates and seeds the `users` table.
2. **[`supabase/documents_policies.sql`](supabase/documents_policies.sql)** — enables permissive RLS policies so the app can read/write `documents`.

This app also expects `documents` and `document_shares` tables. The `documents`
table needs: `id` (bigint identity), `title` (text), `content` (text),
`user_id` (uuid), `created_at`, `updated_at`. The `document_shares` table needs:
`id`, `document_id` (**bigint**, to match `documents.id`), `shared_with_user_id`
(uuid), `created_at`. If `document_shares.document_id` is a `uuid`, fix it with:

```sql
alter table public.document_shares
  alter column document_id type bigint using (document_id::text::bigint);
```

> ⚠️ **Demo-grade security.** Auth is *simulated* — there is no real Supabase
> session, so the app uses the public anon key and the RLS policies are open.
> Passwords are stored in plain text. Do **not** use this setup in production;
> swap in real Supabase Auth + `auth.uid()`-based policies first.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the
login page.

## Seeded accounts

Both accounts use the password `password123`:

| Email               | Name           |
| ------------------- | -------------- |
| `alice@example.com` | Alice Anderson |
| `bob@example.com`   | Bob Brown      |

## Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the dev server (http://localhost:3000) |
| `npm run build`      | Production build                             |
| `npm start`          | Run the production build                     |
| `npm run lint`       | Run ESLint                                   |
| `npm test`           | Run the test suite once (Vitest)             |
| `npm run test:watch` | Run tests in watch mode                      |

## Project structure

```
src/
  app/
    login/            # login page
    documents/        # dashboard (My Documents / Shared with Me)
    documents/[id]/   # document editor
  components/         # editor, toolbar, share dialog, auth provider, guards
  lib/                # auth, supabase client, documents/shares data layers, file import
supabase/             # SQL: users seed + RLS policies
```

## Deployment

Deploys to [Vercel](https://vercel.com/) out of the box. Set the same
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment
variables in the Vercel project settings, and ensure the Supabase SQL scripts
above have been run against the target database.
