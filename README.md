# Next.js + Supabase Starter

A reusable starter for full-stack apps with **Next.js** (App Router), **Supabase** (auth + Postgres + storage), and **TypeScript**. Includes sign-up, sign-in, protected routes, user profiles with editable name and avatar, RLS, migrations, a one-command setup script, and CI for database migrations. Use it as the base for new projects.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** (for local Supabase)
- **Git**

---

## Quick start

From the project root:

```bash
chmod +x setup.sh && ./setup.sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The script installs dependencies, starts Supabase (or continues if already running), writes `.env.local` from the running instance, and runs migrations. Sign up, then open Dashboard and Profile.

---

## Manual setup

If you prefer not to use the script:

1. **Install dependencies:** `npm install`
2. **Start Supabase:** `npx supabase start` (requires Docker)
3. **Get credentials:** `npx supabase status -o env` — note `API_URL` and `ANON_KEY` (or `PUBLISHABLE_KEY`)
4. **Create `.env.local`** with:
   - `NEXT_PUBLIC_SUPABASE_URL=<API_URL>`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY or PUBLISHABLE_KEY>`
5. **Run migrations:** `npx supabase db reset`
6. **Start the app:** `npm run dev`

---

## Project structure

| Path | Purpose |
|------|--------|
| `app/` | Next.js App Router: pages and route layouts. `page.tsx` per route; auth-protected pages call `getUser()` and redirect if unauthenticated. |
| `components/` | Reusable UI (e.g. `SignOutButton`). Shared across routes. |
| `lib/` | Utilities and shared logic: auth helper (`getUser`), Supabase client factories (`server`, `client`, proxy). No React components. |
| `hooks/` | Custom React hooks (e.g. `useAuth` for client-side user and sign-out). |
| `supabase/` | Migrations (`migrations/`), schema reference (`schemas/`), and config. Do not delete; setup and CI rely on it. |

Route-specific components (e.g. `ProfileNameForm`, `AvatarUpload`) live next to their route under `app/<route>/`. Reusable components live in `components/`.

---

## Code organization and auth patterns

- **Reusable components** (buttons, forms, layout pieces): `components/`.
- **Custom hooks** (auth state, client-side data): `hooks/`.
- **Utility functions** (validators, pure helpers): `lib/`. Supabase and auth helpers are in `lib/supabase/` and `lib/auth.ts`.

**Auth is consistent across server and client:**

- **Server:** Use `getUser()` from `@/lib/auth` in server components or server actions. It returns the current user or `null` (and treats missing session as `null` instead of throwing).
- **Client:** Use `useAuth()` from `@/hooks/useAuth` for `user`, `loading`, and `signOut`. It subscribes to auth changes and stays in sync.
- **Protected routes:** In a server page, call `const user = await getUser(); if (!user) redirect("/login");` then render. Never rely only on client checks for protection.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API URL (local or hosted). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key (safe for browser). |

Copy `.env.local.example` to `.env.local` and fill values. `.env.local` is gitignored; do not commit secrets.

---

## Database schema overview

- **`public.profiles`** — One row per user: `id` (FK to `auth.users`), `email`, `full_name`, `avatar_url`, `updated_at`. A trigger sets `updated_at` on update. An `AFTER INSERT` trigger on `auth.users` creates a profile row for each new sign-up.
- **RLS:** Profiles are readable and updatable only by the row owner (`auth.uid() = id`).
- **Storage:** The `avatars` bucket stores files under `{user_id}/...`; RLS restricts access to the owning user. See `supabase/migrations/` and `docs/WALKTHROUGH-8.2-STORAGE-BUCKET.md` for details.

---

## Authentication flow

1. **Server:** `getUser()` uses the server Supabase client (cookies) and returns `User | null`. Use it in server components and server actions.
2. **Client:** `useAuth()` provides `user`, `loading`, and `signOut`; it uses the browser client and subscribes to auth state.
3. **Protected routes:** Server component calls `getUser()`, then `redirect("/login")` if `null`. Client components can use `useAuth()` for UI state only; never use it alone for access control.
4. **Session refresh:** Handled in `proxy.ts` (Next.js 16) so tokens stay valid across requests.

---

## Using this starter for a new project

1. Clone or copy the repo; do not include `node_modules` or `.env.local`.
2. Run `./setup.sh` (or manual setup) in the new repo.
3. Update project name in `package.json` and any branding.
4. Create a new Supabase project (or use the same) and set env vars for that project.
5. Add features and migrations as needed; keep the same auth and structure patterns.

---

## Deployment

1. **Production Supabase:** Create a project at [supabase.com](https://supabase.com). Note the project URL and anon/publishable key.
2. **Hosting (e.g. Vercel or Netlify):** In the platform dashboard, set **Environment variables** to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production (and preview if desired).
3. **Migrations:** Apply migrations to the production DB: either run `supabase link --project-ref <ref>` and `supabase db push` from your machine (with Supabase CLI and DB password), or use the GitHub Action below.
4. **Next.js:** Build and start as usual (`npm run build`, `npm start` or platform defaults). No extra config required beyond env vars.

---

## GitHub Actions (migrations)

The workflow in `.github/workflows/migrate.yml` runs **on push to `main`** and **manually** (Actions → Run database migrations → Run workflow). It checks out the repo, installs the Supabase CLI, links the project, and runs `supabase db push` so pending migrations apply to the linked production database.

**Required repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | From [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens). |
| `SUPABASE_PROJECT_REF` | Project reference ID (Dashboard URL or Project Settings → General). |
| `SUPABASE_DB_PASSWORD` | Database password for the project (Project Settings → Database). |

Do not log these in the workflow. On failure, the job fails and the step output is visible for debugging.

---

## Testing

- **Run tests:** `npm test` (single run) or `npm run test:watch` (watch mode).
- **Where tests live:** Colocated with source (`*.test.ts`, `*.test.tsx`) or under `__tests__/`. Jest is configured to match both.
- **Adding tests:** Follow the existing patterns: component tests with React Testing Library (`render`, `screen`, `userEvent`); utility tests for pure functions; auth-related tests that **mock** the Supabase client or `getUser` (no real Supabase in unit tests). See `lib/auth.test.ts` and `components/SignOutButton.test.tsx`.

Supabase and auth are mocked in unit tests; CI does not need Supabase credentials to run tests.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| **Supabase / Docker errors on setup** | Ensure Docker is running. Run `npx supabase stop --no-backup` then `./setup.sh` again if the script reported “already running” but status fails. |
| **“Could not get API URL or anon key”** | Supabase must be running. Run `npx supabase status -o env` and confirm `API_URL` and key are present; ensure `.env.local` uses the same values. |
| **Migrations fail (local or CI)** | Check migration SQL for syntax or dependency order. For CI, confirm `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD` are set and correct. |
| **Env vars not applied** | Restart the dev server after changing `.env.local`. For production, redeploy after changing platform env vars. |
| **Avatar / image not loading** | For local Supabase storage, `next.config.ts` disables image optimization in development so `localhost` URLs work. For production, ensure the Supabase storage URL host is allowed in `images.remotePatterns`. |

---

For more detail on storage buckets and RLS, see `docs/WALKTHROUGH-8.2-STORAGE-BUCKET.md`.
