"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleClick() {
    await signOut();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      Sign out
    </button>
  );
}
