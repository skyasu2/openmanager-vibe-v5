import { supabase, supabaseAdmin } from '@/lib/supabase'
import { redis } from '@/lib/redis'
import { DB_TABLES } from '@/config/database'
import { REDIS_PREFIXES, REDIS_TTL } from '@/config/redis'

// Supabase 스토리지 모니터링을 위한 상수
const SUPABASE_LIMITS = {
  STORAGE_LIMIT_MB: 500,
  WARNING_THRESHOLD_MB: 400,
  MIN_ARCHIVE_AGE_DAYS: 30
}

export interface SupabaseStorageStats {
  totalStorageUsed: number; // MB 단위
  tableUsage: Record<string, number>; // 테이블별 사용량 (MB)
  percentUsed: number;
  lastUpdated: string;
  isWarning: boolean;
  isLimitReached: boolean;
}

export class SupabaseMonitor {
  // 스토리지 사용량 통계 키
  private static getStorageStatsKey(): string {
    return `${REDIS_PREFIXES.STATS}supabase_storage`
  }

  // 스토리지 사용량 계산
  static async calculateStorageUsage(): Promise<SupabaseStorageStats> {
    try {
      // 캐시된 통계 확인
      const cachedStats = await redis.get(this.getStorageStatsKey())
      if (cachedStats) {
        return JSON.parse(cachedStats as string) as SupabaseStorageStats
      }

      // 테이블별 사용량 계산
      const tableUsage: Record<string, number> = {}
      let totalStorageUsed = 0

      // 주요 테이블 목록
      const tables = Object.values(DB_TABLES)

      // 각 테이블의 사용량 조회
      for (const table of tables) {
        const { count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })

        // 평균 행 크기 추정 (KB)
        const { data: sampleData } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(10)

        // 샘플 데이터 크기 계산 (JSON 문자열 길이 기반)
        let avgRowSizeKB = 0.5 // 기본값
        if (sampleData && sampleData.length > 0) {
          const totalSize = sampleData.reduce(
            (size, row) => size + JSON.stringify(row).length / 1024,
            0
          )
          avgRowSizeKB = totalSize / sampleData.length
        }

        // 테이블 총 사용량 계산 (MB)
        // count가 null이면 0으로 기본값 설정
        const rowCount = count || 0
        const tableSizeMB = (rowCount * avgRowSizeKB) / 1024
        tableUsage[table] = parseFloat(tableSizeMB.toFixed(2))
        totalStorageUsed += tableSizeMB
      }

      // 실제 파일 스토리지 사용량 추가
      try {
        const { data: storageData, error: storageError } = await supabaseAdmin
          .storage
          .getBucket('files')

        if (!storageError && storageData) {
          // 파일 스토리지 크기 - 실제 데이터가 없으므로 추정값 사용
          // 참고: Supabase API에서 getBucket 응답에 size 속성이 없을 수 있음
          // @ts-expect-error - 실제 환경에서는 size가 있을 수 있지만, 타입 정의에는 없음
          const fileSizeMB = (storageData.size || 0) / (1024 * 1024)
          tableUsage['storage:files'] = parseFloat(fileSizeMB.toFixed(2))
          totalStorageUsed += fileSizeMB
        }
      } catch (storageError) {
        console.error('Failed to get storage bucket info:', storageError)
        // 오류 발생 시 추정값 사용
        tableUsage['storage:files'] = 0
      }

      // 최종 통계 생성
      const stats: SupabaseStorageStats = {
        totalStorageUsed: parseFloat(totalStorageUsed.toFixed(2)),
        tableUsage,
        percentUsed: Math.round((totalStorageUsed / SUPABASE_LIMITS.STORAGE_LIMIT_MB) * 100),
        lastUpdated: new Date().toISOString(),
        isWarning: totalStorageUsed >= SUPABASE_LIMITS.WARNING_THRESHOLD_MB,
        isLimitReached: totalStorageUsed >= SUPABASE_LIMITS.STORAGE_LIMIT_MB
      }

      // 통계 캐싱
      await redis.setex(
        this.getStorageStatsKey(),
        REDIS_TTL.CACHE_MEDIUM,
        JSON.stringify(stats)
      )

      // 경고 임계값 도달 시 알림
      if (stats.isWarning) {
        await this.logWarning('Supabase 저장공간이 경고 임계값에 도달했습니다', stats as unknown as Record<string, unknown>)
      }

      // 제한에 도달하면 자동 아카이빙 시작
      if (stats.isWarning) {
        void this.startArchiving()
      }

      // 데이터베이스에도 저장
      await this.saveStorageStats(stats)

      return stats
    } catch (error) {
      console.error('Supabase storage calculation error:', error)

      // 오류 발생 시 기본값 반환
      return {
        totalStorageUsed: 0,
        tableUsage: {},
        percentUsed: 0,
        lastUpdated: new Date().toISOString(),
        isWarning: false,
        isLimitReached: false
      }
    }
  }

  // 사용량 통계 저장
  private static async saveStorageStats(stats: SupabaseStorageStats): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Supabase에 저장
      await supabase
        .from('monitoring_stats')
        .upsert({
          date: today,
          type: 'supabase_storage',
          data: stats,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving Supabase storage stats:', error)
    }
  }

  // 경고 로깅
  private static async logWarning(message: string, data: Record<string, unknown>): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .insert({
          type: 'supabase_warning',
          message,
          data,
          severity: 'warning',
          created_at: new Date().toISOString()
        })
      
      console.warn(`[Supabase Warning] ${message}`, data)
    } catch (error) {
      console.error('Error logging Supabase warning:', error)
    }
  }

  // 자동 아카이빙 프로세스
  static async startArchiving(): Promise<void> {
    try {
      const stats = await this.calculateStorageUsage()
      
      // 경고 임계값 이상일 때만 아카이빙 시작
      if (stats.totalStorageUsed < SUPABASE_LIMITS.WARNING_THRESHOLD_MB) {
        return
      }
      
      console.log('[Supabase Monitor] 자동 아카이빙 프로세스 시작...')
      
      // 오래된 데이터 찾기 (30일 이상)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - SUPABASE_LIMITS.MIN_ARCHIVE_AGE_DAYS)
      const oldDateStr = oldDate.toISOString()
      
      // 아카이빙 대상 테이블들 (가장 사용량이 많은 테이블부터)
      const targetTables = Object.entries(stats.tableUsage)
        .filter(([table]) => !table.startsWith('storage:') && !table.includes('archive'))
        .sort((a, b) => b[1] - a[1]) // 사용량 내림차순
        .map(([table]) => table)
      
      let totalArchived = 0
      
      for (const table of targetTables) {
        // 아카이브 테이블 이름
        const archiveTable = `${table}_archive`
        
        // 아카이브 테이블 존재 여부 확인 및 생성
        const { error: checkError } = await supabaseAdmin
          .from(archiveTable)
          .select('*')
          .limit(1)
        
        if (checkError && checkError.code === '42P01') { // 테이블이 없음
          // 원본 테이블 구조 복제 (실제로는 migration이나 RPC 사용 필요)
          console.log(`[Supabase Monitor] 아카이브 테이블 생성 필요: ${archiveTable}`)
          continue
        }
        
        // 오래된 데이터 조회
        const { data: oldData, error: queryError } = await supabaseAdmin
          .from(table)
          .select('*')
          .lt('created_at', oldDateStr)
          .limit(100)
        
        if (queryError || !oldData || oldData.length === 0) {
          continue
        }
        
        // 아카이브 테이블로 데이터 이동
        const { error: insertError } = await supabaseAdmin
          .from(archiveTable)
          .insert(oldData)
        
        if (insertError) {
          console.error(`[Supabase Monitor] 아카이빙 실패 (${table}):`, insertError)
          continue
        }
        
        // 원본 데이터 삭제
        const idsToDelete = oldData.map(row => row.id)
        const { error: deleteError } = await supabaseAdmin
          .from(table)
          .delete()
          .in('id', idsToDelete)
        
        if (deleteError) {
          console.error(`[Supabase Monitor] 원본 데이터 삭제 실패 (${table}):`, deleteError)
          continue
        }
        
        // 아카이빙 성공 통계
        totalArchived += oldData.length
        console.log(`[Supabase Monitor] ${table}에서 ${oldData.length}개 레코드를 아카이빙했습니다`)
        
        // 충분히 아카이빙했으면 중단
        if (totalArchived >= 300) {
          break
        }
      }
      
      if (totalArchived > 0) {
        // 아카이빙 작업 기록
        await supabase
          .from('system_logs')
          .insert({
            type: 'supabase_archiving',
            message: `${totalArchived}개의 레코드를 자동으로 아카이빙했습니다`,
            data: { archived_count: totalArchived },
            created_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Supabase archiving error:', error)
    }
  }
} 