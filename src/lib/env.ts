function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  // Server-only. Must never be imported from a "use client" module.
  supabaseServiceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // "mock" (default) or "anthropic". Server-only.
  moderationProvider: () => process.env.MODERATION_PROVIDER ?? "mock",
  // Server-only. Required only when moderationProvider() === "anthropic" —
  // read lazily inside AnthropicModerationProvider, not at module load, so
  // the mock provider keeps working without it set.
  anthropicApiKey: () => requireEnv("ANTHROPIC_API_KEY"),
  // Server-only. The single shared passphrase gating /admin — there are no
  // per-moderator accounts, see src/lib/admin/.
  adminPassword: () => requireEnv("ADMIN_PASSWORD"),
  // Server-only. Signs the stateless /admin session cookie — must be a
  // long random string, distinct from ADMIN_PASSWORD.
  adminSessionSecret: () => requireEnv("ADMIN_SESSION_SECRET"),
};
