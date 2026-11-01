import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

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

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost.invalid',
  supabaseAnonKey ?? 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // PKCE: email links come back as "?code=..." (not "#access_token=..."),
      // which does not clash with HashRouter. The code is handled in features/auth/authRedirect.ts.
      flowType: 'pkce',
      detectSessionInUrl: false,
    },
  },
)

export const LISTING_IMAGES_BUCKET = 'listing-images'
