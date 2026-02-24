# Next.js + Supabase Starter — Master Implementation Plan

This document is the step-by-step plan to build the starter application from the current repo state through submission. Complete phases in order; use the checkboxes to track progress.

---

## Phase 1: Prerequisites and current state

### 1.1 Prerequisites (verify before starting)

- [x] **Node.js** — Use a current LTS version (e.g. 18.x or 20.x). Check with `node -v`.
- [x] **Docker** — Required for local Supabase. Install Docker Desktop (or equivalent) and ensure it is running for `supabase start`.
- [x] **Git** — For version control and GitHub Actions. Check with `git --version`.
- [x] **npm** (or pnpm/yarn) — Comes with Node. Check with `npm -v`.

### 1.2 What already exists

- [x] **Next.js 16** — App Router, TypeScript, and Tailwind are configured.
- [x] **Project layout** — `app/layout.tsx`, `app/page.tsx`, `app/globals.css`; `package.json` with Next, React, Tailwind, TypeScript, ESLint.
- [x] **.gitignore** — Includes `node_modules`, `.next`, `.env*` (so `.env.local` is ignored).

### 1.3 What does not exist yet

- [x] No `supabase/` directory (migrations, schemas, config).
- [x] No `lib/`, `hooks/`, or `components/` folders.
- [x] No Supabase client packages or auth/profile code.
- [x] No middleware for token refresh.
- [x] No login, signup, dashboard, or profile pages.
- [x] No setup script or GitHub Actions workflow.
- [x] No unit tests or testing config.
- [x] README is the default Next.js README (needs full assignment documentation).

---

## Phase 2: Project structure and dependencies

### 2.1 Create folder structure

- [x] Create `components/` — Reusable UI (buttons, forms, nav, etc.).
- [x] Create `lib/` — Supabase clients, auth helpers, and utilities.
- [x] Create `hooks/` — Custom hooks (e.g. `useAuth`).
- [x] Document this structure in README later (Phase 12).

### 2.2 Install Supabase packages

- [x] Run: `npm install @supabase/supabase-js @supabase/ssr`
- [x] Confirm both packages are in `dependencies` in `package.json`. Use `@supabase/ssr` for creating server and client instances in Next.js.

### 2.3 Supabase CLI

- [x] Either: install globally (`npm install -g supabase`) or use via npx (`npx supabase ...`) for all commands. Document the choice in README.
- [x] Verify: `npx supabase --version` (or `supabase --version` if global).

### 2.4 Environment variables and example file

- [x] Create `.env.local.example` with two placeholders (no real secrets):
  - `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
- [x] Ensure `.env.local` is in `.gitignore` (already covered by `.env*` in default Next.js .gitignore).

---

## Phase 3: Supabase local setup and client utilities

### 3.1 Initialize Supabase in the project

- [x] Run: `npx supabase init`
- [x] Confirm `supabase/` directory exists with `config.toml` and (initially empty or default) `migrations/`.

### 3.2 Server Supabase client

- [x] Create `lib/supabase/server.ts`.
- [x] Use `createServerClient` from `@supabase/ssr`.
- [x] Use Next.js `cookies()` from `next/headers` (await in App Router).
- [x] Implement cookie helpers: `get(name)`, `set(name, value, options)`, `remove(name, options)` using the cookie store.
- [x] Export an async function (e.g. `createClient()`) that returns the server client for the current request. Do not create a global singleton for server use.

### 3.3 Browser Supabase client

- [x] Create `lib/supabase/client.ts`.
- [x] Use `createBrowserClient` from `@supabase/ssr` with `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [x] Export a single instance (singleton) for use in Client Components. Create once at module load or via lazy singleton.

### 3.4 Middleware for token refresh

- [x] Create `proxy.ts` at the **project root** (same level as `app/`). 
- [x] In proxy: create a Supabase client using the incoming request and response so cookies can be read and written (use `createServerClient` with cookie get/set that operate on the request/response).
- [x] Call `supabase.auth.getUser()` (or equivalent) to refresh the session so cookies are updated.
- [x] Return the response (e.g. `NextResponse.next()`) so the updated cookies are sent back. This fulfills the assignment’s “proxy” / token refresh requirement.
- [x] Ensure middleware does not block static assets or required routes; use `matcher` if needed.

### 3.5 Environment variables reference

- [x] In README (Phase 12), document:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (local or production).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon (public) key.

---

## Phase 4: Database — declarative schema and migrations

### 4.1 Declarative schema for profiles

- [x] Create directory `supabase/schemas/` if it does not exist.
- [x] Create `supabase/schemas/profiles.sql`.
- [x] Define table `public.profiles` with:
  - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
  - `email text` (or `citext`)
  - `full_name text`
  - `avatar_url text`
  - `updated_at timestamptz` (default or set by trigger)
- [x] Add a trigger on `public.profiles`: BEFORE UPDATE, set `updated_at = now()` (or `clock_timestamp()`). Define the trigger function and attach it to `profiles`.

### 4.2 Generate migration from schema

- [x] Apply the schema to the local database (e.g. run the SQL manually once, or use Supabase’s workflow for declarative schemas).
- [x] Run: `npx supabase db diff -f create_profiles` (or another migration name) to generate a migration file under `supabase/migrations/`.
- [x] If your workflow uses a single migration file for the table + trigger + RLS, consolidate so the profiles table, updated_at trigger, handle_new_user trigger, and RLS are all in migrations (see 4.3 and 4.4). Do not run schema changes manually outside migrations.

### 4.3 Automatic profile creation trigger

- [x] Create a migration (new file or add to existing) that defines:
  - A function (e.g. `public.handle_new_user()`) that runs AFTER INSERT on `auth.users`.
  - The function inserts one row into `public.profiles` with: `id = NEW.id`, `email = NEW.email` (or from `NEW.raw_user_meta_data`), and defaults for `full_name`, `avatar_url`, `updated_at`.
  - A trigger on `auth.users`: AFTER INSERT FOR EACH ROW EXECUTE FUNCTION `public.handle_new_user()`.
- [x] Use `SECURITY DEFINER` for the function if required so it can insert into `public.profiles` in the auth context.

### 4.4 Row Level Security (RLS)

- [x] In a migration, enable RLS on `public.profiles`: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- [x] Add policy: users can SELECT their own row — `USING (auth.uid() = id)`.
- [x] Add policy: users can UPDATE their own row — `USING (auth.uid() = id)`.
- [x] Add policy: users can INSERT their own row — `WITH CHECK (auth.uid() = id)`.
- [x] Ensure there is no policy that allows reading or updating another user’s profile.

### 4.5 Apply and verify migrations

- [x] Start Supabase: `npx supabase start`.
- [x] Run: `npx supabase db reset` (or `npx supabase migration up`) to apply all migrations.
- [x] Verify: `public.profiles` exists; trigger on `auth.users` exists; RLS is enabled and policies are in place (e.g. via Supabase Studio or `psql`).

---

## Phase 5: Auth helpers and patterns

### 5.1 Server-side auth helper

- [x] In `lib/` (e.g. `lib/auth.ts` or alongside Supabase helpers), implement a function such as `getUser()` or `getSession()`.
- [x] The function creates the server Supabase client (from `lib/supabase/server.ts`), then calls `supabase.auth.getUser()` (or `getSession()`), and returns the user (or null/session).
- [x] Use this helper in Server Components and server actions whenever the current user is needed. Use it in protected routes to redirect if user is null.

### 5.2 Client-side auth hook

- [x] In `hooks/`, create a hook (e.g. `useAuth.ts` or `useUser.ts`) that:
  - Uses the browser Supabase client from `lib/supabase/client.ts`.
  - Subscribes to auth state changes (e.g. `onAuthStateChange`) and updates local state.
  - Returns an object such as `{ user, loading, signOut }` (or equivalent).
- [x] Use this hook in Client Components for nav, dashboard, and profile (e.g. sign-out button, display email).

### 5.3 Documentation reminder

- [x] In README (Phase 12), document: (1) how to get the current user in a Server Component or server action, (2) how to get the current user in a Client Component (the hook), (3) how protected routes are implemented (server-side check + redirect).

---

## Phase 6: Auth pages (login, signup) and home

### 6.1 Home page

- [x] Update `app/page.tsx`: show a welcome message; display authentication status (logged in vs not).
- [x] If not authenticated: show links to login and signup.
- [x] If authenticated: show link to dashboard (and optionally profile). Use the server auth helper to get the user (do not rely only on client state for initial render).

### 6.2 Login page

- [x] Create `app/login/page.tsx` (or `app/auth/login/page.tsx` if you prefer that structure; keep consistent).
- [x] Implement an email + password form. Use a server action or client-side call to `signInWithPassword`.
- [x] On success: `redirect('/dashboard')` (or your dashboard path).
- [x] On error: display a user-friendly message (e.g. “Invalid email or password”). Map Supabase error codes to clear messages; do not expose raw errors.
- [x] Add a link to the signup page.

### 6.3 Signup page

- [x] Create `app/signup/page.tsx` (or `app/auth/signup/page.tsx`).
- [x] Implement an email + password form. Use `signUp` from Supabase.
- [x] On success: `redirect('/dashboard')`.
- [x] On error: display a user-friendly message (e.g. “Email already registered” or “Password too weak”). Map Supabase errors appropriately.
- [x] Add a link to the login page.

### 6.4 Error handling

- [x] Ensure all auth forms handle loading state (disable submit or show spinner) and error state (show message). Never leave catch blocks empty; log or surface errors appropriately.

---

## Phase 7: Protected routes — dashboard and profile shell

### 7.1 Dashboard page

- [x] Create `app/dashboard/page.tsx` (or under a route group like `app/(protected)/dashboard/page.tsx`).
- [x] At the top of the page (or in a shared layout), get the current user via the server auth helper. If user is null, call `redirect('/login')` and do not render dashboard content.
- [x] Display user information (e.g. email). Add a link to the profile page. Add a sign-out button (use a client component that calls `signOut` and then redirects to home or login).

### 7.2 Profile page (initial)

- [x] Create `app/profile/page.tsx` (or `app/(protected)/profile/page.tsx`).
- [x] Same auth check: get user via server helper; if null, `redirect('/login')`.
- [x] Fetch the current user’s profile from `public.profiles` using the server Supabase client (RLS will restrict to one row). Display current profile data (e.g. email, full_name, avatar_url if present).
- [x] Optionally use a shared layout for dashboard and profile that performs the auth check once (e.g. `app/(protected)/layout.tsx`).

---

## Phase 8: Profile edit form and avatar upload

### 8.1 Profile update form

- [x] On the profile page, add a form to edit `full_name` (and any other editable fields you added to the profile model).
- [x] On submit: update `public.profiles` via a server action or client Supabase call. RLS will ensure only the current user’s row is updated.
- [x] Show loading state during submit and success/error messages. Validate input (e.g. length) and return clear errors.

### 8.2 Supabase Storage bucket

- [x] Create a storage bucket (e.g. `avatars`) in Supabase. This can be done via migration (SQL) or via Supabase Studio/dashboard; if via migration, document the SQL or use Supabase’s storage schema.
- [x] Set storage policies so that users can read and write only their own path (e.g. path prefix or pattern using `auth.uid()::text`). Do not allow users to read or overwrite other users’ files.

### 8.3 Avatar upload UI and logic

- [x] On the profile page, add an avatar section: file input (accept image types; optionally enforce max file size).
- [x] On file select: upload the file to the avatars bucket with a path like `{userId}/avatar` or `{userId}/{filename}`. Get the public URL after upload.
- [x] Update `profiles.avatar_url` with that URL (via server action or client). Refetch or revalidate so the UI shows the new avatar.
- [x] Display the current avatar (from `profiles.avatar_url`) with a fallback (e.g. initials or placeholder) when no URL is set.

### 8.4 Avatar error handling

- [x] Handle and surface: unsupported file type, file too large, upload failure, and profile update failure. Do not leave the user without feedback.

---

## Phase 9: Setup script

### 9.1 Create the script

- [x] Create `setup.sh` (bash) or `setup.js` (Node.js) at the project root. Choose one; document in README.
- [x] Implement in order:
  1. Run `npm install`. On failure, print error and exit with non-zero code.
  2. Run `npx supabase start`. If Supabase is already running (detect from output or `supabase status`), do not fail — print a message and continue.
  3. Extract the API URL and anon key from the output of `supabase start` or `supabase status` (parse the printed table or JSON).
  4. Create or update `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the file exists, overwrite or update these two variables so they match the running local instance.
  5. Run `npx supabase db reset` (or `npx supabase migration up`) to apply migrations.
  6. Print a clear success message and next steps (e.g. “Run `npm run dev` to start the app”).

### 9.2 Idempotency and errors

- [x] Script is idempotent: safe to run multiple times (already running Supabase and existing `.env.local` are handled).
- [x] On any step failure, print a helpful error message and exit with a non-zero code. Do not continue if `supabase start` or migrations fail.
- [x] If using bash, make the script executable: `chmod +x setup.sh`.

### 9.3 README instructions

- [x] In README (Phase 12), add a “Quick start” section: how to run the setup script (e.g. `./setup.sh` or `node setup.js`), and note prerequisites (Node, Docker).

---

## Phase 10: GitHub Actions for database migrations

### 10.1 Create workflow file

- [x] Create `.github/workflows/` if it does not exist.
- [x] Create a workflow file (e.g. `migrate.yml` or `supabase-migrate.yml`).

### 10.2 Workflow definition

- [x] Trigger: on push to `main` (or your production branch), and optionally on workflow_dispatch for manual runs.
- [x] Jobs: checkout repository; set up Node if needed; install or use Supabase CLI (e.g. via npm script or direct download).
- [x] Connect to the **production** Supabase project using GitHub Secrets (e.g. `SUPABASE_ACCESS_TOKEN`, or `SUPABASE_PROJECT_REF` + `SUPABASE_DB_PASSWORD` or service role key — follow Supabase CI docs).
- [x] Run pending migrations: e.g. `supabase link` (if using project ref) then `supabase db push` or `supabase migration up`. Use the secret so the CLI is authenticated.
- [x] On migration failure: fail the job and print clear output. Do not log secrets.

### 10.3 README documentation

- [x] In README (Phase 12), add a “GitHub Actions” or “CI/CD” section: list required secrets, how to add them in repo Settings → Secrets, and how the workflow is triggered. Explain that it runs migrations against the linked production database.

---

## Phase 11: Unit testing

### 11.1 Install and configure test framework

- [x] Choose one: Jest or Vitest. Add React Testing Library for component tests.
- [x] Install dependencies (e.g. `@testing-library/react`, `jest` or `vitest`, and any Jest/Vitest adapters for React and TypeScript).
- [x] Add config file: `jest.config.ts`/`jest.config.js` or `vitest.config.ts`. Configure for TypeScript and Next.js (path aliases like `@/`, env vars if needed).
- [x] Add npm script: `"test": "jest"` or `"test": "vitest run"` (and optionally `"test:watch": "vitest"`).

### 11.2 Example tests

- [x] **Component test:** Create a test that renders a simple component (e.g. a button or small form) and asserts on text or user interaction. Use React Testing Library’s `render`, `screen`, and `userEvent` (or `fireEvent`).
- [x] **Utility test:** Create a test for a pure utility function (e.g. formatter or validator). Assert on return values or thrown errors.
- [x] **Auth-related test:** Create a test that mocks the Supabase client or auth helper (e.g. return null user) and asserts that protected behavior redirects or shows login (or that a helper returns the mocked user). Do not call real Supabase in unit tests.

### 11.3 README

- [x] In README (Phase 12), add a “Testing” section: how to run tests (`npm test`), where tests live (e.g. `__tests__/` or colocated `*.test.tsx`), how to add new tests, and that Supabase is mocked in unit tests.

---

## Phase 12: README and documentation

### 12.1 Required README sections

- [x] **Project description and purpose** — Reusable Next.js + Supabase starter; auth, profiles, RLS; use as a base for new projects.
- [x] **Prerequisites** — Node.js version, Docker (for local Supabase), Git.
- [x] **Quick start** — How to run the setup script; one-command setup and then `npm run dev`.
- [x] **Manual setup** — Step-by-step for those who prefer not to use the script: install deps, start Supabase, set `.env.local`, run migrations.
- [x] **Project structure** — Where `app/`, `components/`, `lib/`, `hooks/` live and what they contain; where reusable components vs route-specific code go.
- [x] **How to use this starter for new projects** — Clone or copy; run setup; change project name/env; add features.
- [x] **Environment variables** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; that `.env.local` is not committed.
- [x] **Database schema overview** — `public.profiles` table; trigger for new user; RLS; optional diagram or table listing.
- [x] **Authentication flow** — How to get current user on server (helper) and client (hook); how protected routes work (server check + redirect).
- [x] **Deployment** — Steps to set up production Supabase project; configure env vars on Vercel/Netlify (or chosen host); link production DB; run migrations (manual or via GitHub Action); platform-specific notes.
- [x] **GitHub Actions setup** — Required secrets; how to configure the migration workflow; when it runs.
- [x] **Troubleshooting** — Common issues (e.g. Docker not running, Supabase already running, migration failures, env vars missing).

### 12.2 Code organization and auth patterns

- [x] Explicitly document: where reusable components (buttons, forms, etc.) are stored; where custom hooks are; how utility functions are organized; and that auth patterns (getUser on server, useAuth on client) are consistent and documented here.

---

## Phase 13: Final verification and submission

### 13.1 Test setup from scratch

- [x] Remove `node_modules` and `.env.local`. Do **not** delete the `supabase/` directory (migrations and schemas must remain).
- [x] Run the setup script from the project root. It should: install deps, start Supabase (or detect already running), write `.env.local`, run migrations.
- [x] Run `npm run dev` and verify: home page loads; can sign up, sign in, see dashboard and profile; can update profile and upload avatar; sign out works. Confirm no console or runtime errors.

### 13.2 Pre-submission checklist

- [x] Remove `node_modules` again before creating the zip (per assignment).
- [x] Ensure the setup script is included in the repo and is executable (if bash).
- [x] Verify README is comprehensive and includes all sections listed in Phase 12.
- [x] Zip the project folder and submit as required. Do not include `node_modules` in the zip.

---

## Summary

| Phase | Description |
|-------|-------------|
| 1 | Prerequisites and current state |
| 2 | Project structure and dependencies |
| 3 | Supabase local setup and client utilities |
| 4 | Database — declarative schema and migrations |
| 5 | Auth helpers and patterns |
| 6 | Auth pages (login, signup) and home |
| 7 | Protected routes — dashboard and profile shell |
| 8 | Profile edit form and avatar upload |
| 9 | Setup script |
| 10 | GitHub Actions for migrations |
| 11 | Unit testing |
| 12 | README and documentation |
| 13 | Final verification and submission |

Complete phases in order. Use this document as the single source of truth for building the starter application.
