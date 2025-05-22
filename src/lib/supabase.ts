import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드 API 라우트용 관리자 클라이언트
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 연결 상태 체크
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('healthcheck').select('*').limit(1)
    
    if (error) throw error
    
    return { 
      status: 'connected', 
      timestamp: new Date().toISOString() 
    }
  } catch (error) {
    console.error('Supabase connection error:', error)
    return { 
      status: 'error', 
      error: (error as Error).message 
    }
  }
} 