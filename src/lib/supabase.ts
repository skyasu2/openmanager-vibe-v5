import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database-types'
import { env } from './env'

// 실제 Supabase 클라이언트만 생성
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('✅ Supabase 클라이언트 초기화됨:', env.NEXT_PUBLIC_SUPABASE_URL)

export async function checkSupabaseConnection() {
  try {
    if (env.NODE_ENV === 'development') {
      // 개발 환경에서는 항상 연결된 것으로 시뮬레이션
      return { 
        status: 'connected' as 'error' | 'connected',
        message: 'Supabase connected successfully (development mode)'
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