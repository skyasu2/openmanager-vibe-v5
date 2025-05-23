import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database-types'
import { env } from './env'

export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('servers').select('count').limit(1)
    return { 
      status: error ? 'error' : 'connected' as 'error' | 'connected',
      message: error?.message || 'Supabase connected successfully'
    }
  } catch (error) {
    return { 
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
} 