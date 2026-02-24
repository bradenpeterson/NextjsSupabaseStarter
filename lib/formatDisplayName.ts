/**
 * Returns a display name from full name and email (e.g. for profile headers).
 * Uses fullName when present, otherwise the local part of the email.
 */
export function formatDisplayName(fullName: string | null | undefined, email: string): string {
  const trimmed = fullName?.trim()
  if (trimmed) return trimmed
  const at = email.indexOf("@")
  return at > 0 ? email.slice(0, at) : email
}
