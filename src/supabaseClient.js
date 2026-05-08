import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const localTestMode = import.meta.env.VITE_LOCAL_TEST_MODE === 'true'

export const supabaseConfigured =
  !localTestMode &&
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key'

export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
