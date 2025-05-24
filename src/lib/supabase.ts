import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database-types'
import { env } from './env'

// 개발 환경에서는 더미 클라이언트 생성
const isDevelopment = env.NODE_ENV === 'development'
const isDummySupabase = env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')

export const supabase = isDummySupabase 
  ? null 
  : createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabaseAdmin = isDummySupabase
  ? null
  : createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

export async function checkSupabaseConnection() {
  try {
    if (isDummySupabase || isDevelopment) {
      // 개발 환경에서는 항상 연결된 것으로 시뮬레이션
      return { 
        status: 'connected' as 'error' | 'connected',
        message: 'Supabase connected successfully (development mode)'
      }
    }

    if (!supabase) {
      return {
        status: 'error' as const,
        message: 'Supabase client not initialized'
      }
    }

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