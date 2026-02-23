import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/profile"
            className="rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Profile
          </Link>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
