import { createClient } from '@supabase/supabase-js'

import { env } from '@/shared/api/env'
import type { Database } from '@/shared/types/database'

export const supabase = env.hasSupabase
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
  : null
