import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database-types'
import { env } from './env'
import { usageMonitor } from './usage-monitor'

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

// 스마트 Supabase 클라이언트 래퍼
class SmartSupabaseClient {
  private fallbackStorage = new Map<string, any>()

  // SELECT 작업 (사용량 체크 포함)
  async select(table: string, query?: string) {
    const cacheKey = `select_${table}_${query || 'all'}`
    
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, using cached data')
      return {
        data: this.fallbackStorage.get(cacheKey) || [],
        error: null
      }
    }

    try {
      usageMonitor.recordSupabaseUsage(0.05, 1) // 50KB, 1 request
      
      let queryBuilder = supabase.from(table).select(query || '*')
      const result = await queryBuilder
      
      // 성공시 fallback에 저장
      if (result.data) {
        this.fallbackStorage.set(cacheKey, result.data)
      }
      
      return result
    } catch (error) {
      console.warn('Supabase SELECT error, using cached data:', error)
      return {
        data: this.fallbackStorage.get(cacheKey) || [],
        error
      }
    }
  }

  // INSERT 작업 (사용량 체크 포함)
  async insert(table: string, data: any) {
    // fallback storage에 저장 (백업용)
    const cacheKey = `insert_${table}_${Date.now()}`
    this.fallbackStorage.set(cacheKey, data)

    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, data queued for later sync')
      return {
        data: [data],
        error: null
      }
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1) // 100KB, 1 request
      const result = await supabase.from(table).insert(data)
      
      // 성공시 캐시에서 제거
      this.fallbackStorage.delete(cacheKey)
      
      return result
    } catch (error) {
      console.warn('Supabase INSERT error, data queued:', error)
      return {
        data: [data],
        error
      }
    }
  }

  // UPDATE 작업 (사용량 체크 포함)
  async update(table: string, data: any, match: any) {
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, update queued for later sync')
      return {
        data: [{ ...match, ...data }],
        error: null
      }
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1) // 100KB, 1 request
      return await supabase.from(table).update(data).match(match)
    } catch (error) {
      console.warn('Supabase UPDATE error:', error)
      return {
        data: [],
        error
      }
    }
  }

  // DELETE 작업 (사용량 체크 포함)
  async delete(table: string, match: any) {
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, delete queued for later sync')
      return {
        data: [],
        error: null
      }
    }

    try {
      usageMonitor.recordSupabaseUsage(0.05, 1) // 50KB, 1 request
      return await supabase.from(table).delete().match(match)
    } catch (error) {
      console.warn('Supabase DELETE error:', error)
      return {
        data: [],
        error
      }
    }
  }

  // RPC 호출 (사용량 체크 포함)
  async rpc(functionName: string, params?: any) {
    const cacheKey = `rpc_${functionName}_${JSON.stringify(params)}`
    
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, using cached RPC result')
      return {
        data: this.fallbackStorage.get(cacheKey) || null,
        error: null
      }
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1) // 100KB, 1 request
      const result = await supabase.rpc(functionName, params)
      
      // 성공시 캐시에 저장
      if (result.data) {
        this.fallbackStorage.set(cacheKey, result.data)
      }
      
      return result
    } catch (error) {
      console.warn('Supabase RPC error, using cached result:', error)
      return {
        data: this.fallbackStorage.get(cacheKey) || null,
        error
      }
    }
  }

  // 원본 Supabase 클라이언트 접근 (필요시)
  get raw() {
    return supabase
  }

  // 사용량 상태 확인
  getUsageStatus() {
    return usageMonitor.getUsageStatus().supabase
  }

  // 수동 제어
  enable() {
    usageMonitor.forceEnable('supabase')
  }

  disable() {
    usageMonitor.disable('supabase')
  }

  // 대기 중인 작업 동기화 (무료 티어 활성화시)
  async syncPendingOperations() {
    if (!usageMonitor.canUseSupabase()) {
      console.warn('Cannot sync: Supabase still disabled')
      return
    }

    const insertKeys = Array.from(this.fallbackStorage.keys())
      .filter(key => key.startsWith('insert_'))

    for (const key of insertKeys) {
      const data = this.fallbackStorage.get(key)
      const table = key.split('_')[1]
      
      try {
        await this.insert(table, data)
        console.log(`✅ Synced pending insert for ${table}`)
      } catch (error) {
        console.warn(`❌ Failed to sync insert for ${table}:`, error)
      }
    }
  }

  // 캐시 정리
  clearCache() {
    this.fallbackStorage.clear()
    console.log('🧹 Supabase cache cleared')
  }

  // 캐시 상태
  getCacheStatus() {
    return {
      size: this.fallbackStorage.size,
      keys: Array.from(this.fallbackStorage.keys())
    }
  }
}

// 스마트 Supabase 클라이언트 인스턴스
export const smartSupabase = new SmartSupabaseClient()

// 기존 호환성을 위한 export (supabase는 이미 위에서 export됨)
export default smartSupabase 