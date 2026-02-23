import { createClient } from "@/lib/supabase/server"

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  // No session (e.g. not logged in) is normal — return null instead of throwing
  if (error) {
    const isSessionMissing =
      error.name === "AuthSessionMissingError" ||
      error.message?.toLowerCase().includes("auth session missing")
    if (isSessionMissing) return null
    throw error
  }

  return data.user
}

export default getUser