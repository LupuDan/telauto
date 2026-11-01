/**
 * Absolute address of the site root, e.g. "https://lupudan.github.io/telauto/" or "http://localhost:5173/".
 * Used for links in emails (must be listed in Supabase "Redirect URLs", see supabase/config.toml).
 */
export function getSiteBaseUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

/** Only allow internal paths like "/account" as redirect targets (never "//evil.com" or full URLs). */
export function safeInternalPath(path: string | null | undefined, fallback = '/'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return fallback
  }
  return path
}
