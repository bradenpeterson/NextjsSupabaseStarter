"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error getting user for avatar upload:", userError);
        setError("You must be signed in to upload an avatar.");
        return;
      }

      const fileExt = file.name.split(".").pop() ?? "png";
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        setError("Could not upload avatar. Please try again.");
        return;
      }

      const { data: publicUrlResult } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      // Append a cache-busting query param so the browser and Next.js
      // treat each upload as a new URL and don't show a stale image.
      const publicUrl = `${publicUrlResult.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating avatar URL on profile:", updateError);
        setError("Could not save avatar. Please try again.");
        return;
      }

      setSuccess("Avatar updated.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    } catch (err) {
      console.error("Unexpected avatar upload error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-2">
      <div>
        <label
          htmlFor="avatar-upload"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Avatar
        </label>
        <input
          id="avatar-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:text-zinc-200 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      )}
    </section>
  );
}

