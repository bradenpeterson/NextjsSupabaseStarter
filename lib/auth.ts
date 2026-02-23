import { createClient } from "@/lib/supabase/server"

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export default getUser