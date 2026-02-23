import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileNameForm } from "./ProfileNameForm";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
  }

  const email = profile?.email ?? user.email;
  const fullName = profile?.full_name ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const displayName = fullName || email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile
        </h1>

        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {displayName}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{email}</p>
          </div>
        </div>

        <ProfileNameForm initialFullName={fullName} />

        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-3 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

