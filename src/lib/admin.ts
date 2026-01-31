// Hardcoded admin identifiers - only these users can access admin
const ADMIN_EMAILS = ["matthew.parker@live.com.au"];
const ADMIN_DISCORD_USERNAMES = ["zoonmattau"];

export function isAdmin(user: { email?: string; user_metadata?: { full_name?: string; name?: string } } | null): boolean {
  if (!user) return false;
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  const discordName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  if (ADMIN_DISCORD_USERNAMES.includes(discordName.toLowerCase())) return true;
  return false;
}
