const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  hasSupabase:
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0,
}
