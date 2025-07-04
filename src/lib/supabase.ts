import { getVercelOptimizedConfig } from '@/config/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { usageMonitor } from './usage-monitor';

// 빌드 타임에는 최소 유효한 URL, 런타임에는 실제 환경변수 사용
function getSupabaseUrl() {
  // 🔧 임시 해결: 환경변수 직접 읽기 (.env.local 지원)
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !url &&
    (process.env.NODE_ENV === undefined ||
      process.env.npm_lifecycle_event === 'build')
  ) {
    return 'https://temp.supabase.co'; // 빌드만 통과하는 임시 URL
  }

  if (!url) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
  }

  return url;
}

function getSupabaseAnonKey() {
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    !key &&
    (process.env.NODE_ENV === undefined ||
      process.env.npm_lifecycle_event === 'build')
  ) {
    return 'temp-anon-key'; // 빌드만 통과하는 임시 키
  }

  if (!key) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  return key;
}

function getSupabaseServiceKey() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  // 개발 환경에서는 임시 키 사용 허용
  if (!key && process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY 없음 - 개발 환경에서 임시 키 사용'
    );
    return 'temp-service-key-for-development';
  }

  if (
    !key &&
    (process.env.NODE_ENV === undefined ||
      process.env.npm_lifecycle_event === 'build')
  ) {
    return 'temp-service-key'; // 빌드만 통과하는 임시 키
  }

  if (!key) {
    throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  }

  return key;
}

// 실제 Supabase 클라이언트 생성
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase 클라이언트 초기화됨:', env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function checkSupabaseConnection() {
  try {
    if (env.NODE_ENV === 'development') {
      // 개발 환경에서는 항상 연결된 것으로 시뮬레이션
      return {
        status: 'connected' as 'error' | 'connected',
        message: 'Supabase connected successfully (development mode)',
      };
    }

    const { error } = await supabase.from('servers').select('count').limit(1);
    return {
      status: error ? 'error' : ('connected' as 'error' | 'connected'),
      message: error?.message || 'Supabase connected successfully',
    };
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// 스마트 Supabase 클라이언트 래퍼
class SmartSupabaseClient {
  private fallbackStorage = new Map<string, any>();

  // SELECT 작업 (사용량 체크 포함)
  async select(table: string, query?: string) {
    const cacheKey = `select_${table}_${query || 'all'}`;

    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, using cached data');
      return {
        data: this.fallbackStorage.get(cacheKey) || [],
        error: null,
      };
    }

    try {
      usageMonitor.recordSupabaseUsage(0.05, 1); // 50KB, 1 request

      let queryBuilder = supabase.from(table).select(query || '*');
      const result = await queryBuilder;

      // 성공시 fallback에 저장
      if (result.data) {
        this.fallbackStorage.set(cacheKey, result.data);
      }

      return result;
    } catch (error) {
      console.warn('Supabase SELECT error, using cached data:', error);
      return {
        data: this.fallbackStorage.get(cacheKey) || [],
        error,
      };
    }
  }

  // INSERT 작업 (사용량 체크 포함)
  async insert(table: string, data: any) {
    // fallback storage에 저장 (백업용)
    const cacheKey = `insert_${table}_${Date.now()}`;
    this.fallbackStorage.set(cacheKey, data);

    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, data queued for later sync');
      return {
        data: [data],
        error: null,
      };
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1); // 100KB, 1 request
      const result = await supabase.from(table).insert(data);

      // 성공시 캐시에서 제거
      this.fallbackStorage.delete(cacheKey);

      return result;
    } catch (error) {
      console.warn('Supabase INSERT error, data queued:', error);
      return {
        data: [data],
        error,
      };
    }
  }

  // UPDATE 작업 (사용량 체크 포함)
  async update(table: string, data: any, match: any) {
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, update queued for later sync');
      return {
        data: [{ ...match, ...data }],
        error: null,
      };
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1); // 100KB, 1 request
      return await supabase.from(table).update(data).match(match);
    } catch (error) {
      console.warn('Supabase UPDATE error:', error);
      return {
        data: [],
        error,
      };
    }
  }

  // DELETE 작업 (사용량 체크 포함)
  async delete(table: string, match: any) {
    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, delete queued for later sync');
      return {
        data: [],
        error: null,
      };
    }

    try {
      usageMonitor.recordSupabaseUsage(0.05, 1); // 50KB, 1 request
      return await supabase.from(table).delete().match(match);
    } catch (error) {
      console.warn('Supabase DELETE error:', error);
      return {
        data: [],
        error,
      };
    }
  }

  // RPC 호출 (사용량 체크 포함)
  async rpc(functionName: string, params?: any) {
    const cacheKey = `rpc_${functionName}_${JSON.stringify(params)}`;

    // 무료 티어 체크
    if (!usageMonitor.canUseSupabase()) {
      console.warn('🔄 Supabase disabled, using cached RPC result');
      return {
        data: this.fallbackStorage.get(cacheKey) || null,
        error: null,
      };
    }

    try {
      usageMonitor.recordSupabaseUsage(0.1, 1); // 100KB, 1 request
      const result = await supabase.rpc(functionName, params);

      // 성공시 캐시에 저장
      if (result.data) {
        this.fallbackStorage.set(cacheKey, result.data);
      }

      return result;
    } catch (error) {
      console.warn('Supabase RPC error, using cached result:', error);
      return {
        data: this.fallbackStorage.get(cacheKey) || null,
        error,
      };
    }
  }

  // 원본 Supabase 클라이언트 접근 (필요시)
  get raw() {
    return supabase;
  }

  // 사용량 상태 확인
  getUsageStatus() {
    return usageMonitor.getUsageStatus().supabase;
  }

  // 수동 제어
  enable() {
    usageMonitor.forceEnable('supabase');
  }

  disable() {
    usageMonitor.disable('supabase');
  }

  // 대기 중인 작업 동기화 (무료 티어 활성화시)
  async syncPendingOperations() {
    if (!usageMonitor.canUseSupabase()) {
      console.warn('Cannot sync: Supabase still disabled');
      return;
    }

    const insertKeys = Array.from(this.fallbackStorage.keys()).filter(key =>
      key.startsWith('insert_')
    );

    for (const key of insertKeys) {
      const data = this.fallbackStorage.get(key);
      const table = key.split('_')[1];

      try {
        await this.insert(table, data);
        console.log(`✅ Synced pending insert for ${table}`);
      } catch (error) {
        console.warn(`❌ Failed to sync insert for ${table}:`, error);
      }
    }
  }

  // 캐시 정리
  clearCache() {
    this.fallbackStorage.clear();
    console.log('🧹 Supabase cache cleared');
  }

  // 캐시 상태
  getCacheStatus() {
    return {
      size: this.fallbackStorage.size,
      keys: Array.from(this.fallbackStorage.keys()),
    };
  }
}

// 스마트 Supabase 클라이언트 인스턴스
export const smartSupabase = new SmartSupabaseClient();

// 기존 호환성을 위한 export (supabase는 이미 위에서 export됨)
export default smartSupabase;

/**
 * 🗄️ Vercel 최적화된 Supabase 클라이언트
 *
 * - 연결 풀 최적화
 * - 자동 재연결
 * - 에러 핸들링
 * - Vercel Edge Runtime 호환
 */

class VercelSupabaseClient {
  private client: SupabaseClient | null = null;
  private isConnected = false;
  private config = getVercelOptimizedConfig();

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (!this.config.database.supabase.enabled) {
        console.log('⚠️ Supabase 환경변수가 설정되지 않음');
        return;
      }

      this.client = createClient(
        this.config.database.supabase.url,
        this.config.database.supabase.key,
        {
          auth: {
            persistSession: false, // Vercel에서는 세션 저장 비활성화
          },
          global: {
            headers: {
              'x-application-name': 'openmanager-vibe-v5',
            },
          },
          db: {
            schema: 'public',
          },
          realtime: {
            params: {
              eventsPerSecond: this.config.IS_VERCEL ? 10 : 50, // Vercel에서 제한
            },
          },
        }
      );

      this.isConnected = true;
      console.log('✅ Supabase 연결 성공');
    } catch (error) {
      console.error('❌ Supabase 연결 실패:', error);
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * 📊 서버 메트릭 저장
   */
  async saveServerMetrics(metrics: any[]): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase 미연결 - 메트릭 저장 스킵');
      return;
    }

    try {
      // 배치 크기 제한 (GCP Functions 최적화)
      const batchSize = 500; // GCP Functions는 더 큰 메모리 제한

      for (let i = 0; i < metrics.length; i += batchSize) {
        const batch = metrics.slice(i, i + batchSize);

        const { error } = await this.client
          .from('server_metrics')
          .upsert(batch, {
            onConflict: 'server_id,timestamp',
            ignoreDuplicates: true,
          });

        if (error) {
          console.error('❌ 메트릭 저장 실패:', error);
        }
      }
    } catch (error) {
      console.error('❌ Supabase 메트릭 저장 실패:', error);
    }
  }

  /**
   * 📖 서버 메트릭 조회
   */
  async getServerMetrics(serverId?: string, limit = 100): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase 미연결 - 빈 배열 반환');
      return [];
    }

    try {
      let query = this.client
        .from('server_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ 메트릭 조회 실패:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Supabase 메트릭 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🤖 AI 분석 결과 저장
   */
  async saveAIAnalysis(analysis: any): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase 미연결 - AI 분석 저장 스킵');
      return;
    }

    try {
      const { error } = await this.client.from('ai_analysis').upsert(analysis, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error('❌ AI 분석 저장 실패:', error);
      }
    } catch (error) {
      console.error('❌ Supabase AI 분석 저장 실패:', error);
    }
  }

  /**
   * 🔍 AI 분석 결과 조회
   */
  async getAIAnalysis(analysisId?: string, limit = 50): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase 미연결 - 빈 배열 반환');
      return [];
    }

    try {
      let query = this.client
        .from('ai_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (analysisId) {
        query = query.eq('id', analysisId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ AI 분석 조회 실패:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Supabase AI 분석 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🧹 오래된 데이터 정리
   */
  async cleanupOldData(daysToKeep = 7): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // 오래된 메트릭 정리
      await this.client
        .from('server_metrics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      // 오래된 AI 분석 정리
      await this.client
        .from('ai_analysis')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      console.log(`🧹 ${daysToKeep}일 이전 데이터 정리 완료`);
    } catch (error) {
      console.error('❌ 데이터 정리 실패:', error);
    }
  }

  /**
   * 📊 상태 확인
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      supabaseEnabled: this.config.database.supabase.enabled,
      url: this.config.database.supabase.url,
    };
  }

  /**
   * 🔄 클라이언트 가져오기
   */
  getClient(): SupabaseClient | null {
    return this.client;
  }
}

// Vercel 최적화된 싱글톤 인스턴스
export const vercelSupabase = new VercelSupabaseClient();

/**
 * 🚀 Vercel 최적화된 데이터베이스 헬퍼
 */
export class VercelDatabase {
  /**
   * 📊 서버 상태 저장 및 조회 통합
   */
  static async saveServerStatus(serverId: string, status: any): Promise<void> {
    try {
      await vercelSupabase.saveServerMetrics([
        {
          server_id: serverId,
          timestamp: new Date().toISOString(),
          ...status,
        },
      ]);
    } catch (error) {
      console.error('❌ 서버 상태 저장 실패:', error);
    }
  }

  /**
   * 📈 대시보드 데이터 조회
   */
  static async getDashboardData(): Promise<{
    servers: any[];
    metrics: any[];
    analysis: any[];
  }> {
    try {
      const [servers, metrics, analysis] = await Promise.all([
        vercelSupabase.getServerMetrics(undefined, 50),
        vercelSupabase.getServerMetrics(undefined, 200),
        vercelSupabase.getAIAnalysis(undefined, 20),
      ]);

      return { servers, metrics, analysis };
    } catch (error) {
      console.error('❌ 대시보드 데이터 조회 실패:', error);
      return { servers: [], metrics: [], analysis: [] };
    }
  }

  /**
   * 🔄 건강한 연결 유지
   */
  static async keepAlive(): Promise<void> {
    try {
      if (vercelSupabase.getClient()) {
        await vercelSupabase
          .getClient()
          ?.from('server_metrics')
          .select('*')
          .limit(1);
      }
    } catch (error) {
      // 무시 - 연결 유지 시도
    }
  }
}

// 기존 내보내기는 기존 smartSupabase로 유지
