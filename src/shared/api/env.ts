const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000'

export const env = {
  apiBaseUrl,
  supabaseUrl,
  supabaseAnonKey,
  hasSupabase:
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0,
}
