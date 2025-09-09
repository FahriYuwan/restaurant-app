import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure you have:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api'
  )
}

if (supabaseUrl.includes('YOUR_SUPABASE') || supabaseAnonKey.includes('YOUR_SUPABASE')) {
  throw new Error(
    'Please replace the placeholder values in your .env.local file with actual Supabase credentials.\n' +
    'Visit https://supabase.com to create a project and get your credentials.'
  )
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)