import { createClient } from '@supabase/supabase-js'

// Only the PUBLIC key (anon / publishable) may ever be used here.
// Never put the service_role / secret key in frontend code: everything in this
// folder ends up in the browser and in the public GitHub repository.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost.invalid',
  supabaseAnonKey ?? 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // HashRouter uses the URL hash for routes, so auth redirects are handled manually (phase 3).
      detectSessionInUrl: false,
    },
  },
)
