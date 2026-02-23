"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileNameFormProps = {
  initialFullName: string;
};

export function ProfileNameForm({ initialFullName }: ProfileNameFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (updateError) {
        console.error("Error updating profile name:", updateError);
        setError("Could not update your name. Please try again.");
        return;
      }

      setSuccess("Profile updated.");
      setFullName(trimmed);
      router.refresh();
    } catch (err) {
      console.error("Profile name update error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <div>
        <label
          htmlFor="profile-full-name"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Full name
        </label>
        <input
          id="profile-full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

