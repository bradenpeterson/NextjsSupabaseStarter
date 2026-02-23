import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Home() {
  let user: Awaited<ReturnType<typeof getUser>> = null;
  let authError = false;

  try {
    user = await getUser();
  } catch (err) {
    console.error("Home page auth error:", err);
    authError = true;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome
        </h1>

        {authError && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            We couldn’t load your sign-in status. Please try again or sign in below.
          </p>
        )}

        {user ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              You are signed in as <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Profile
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              You are not signed in. Sign in or create an account to continue.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
