import { getVercelOptimizedConfig } from '@/config/environment';
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeEnv, getSupabaseConfig } from './env';
import type { ServerMetrics } from '@/types/common';
import type { AIAnalysisResponse } from '@/types/ai-analysis';

// 🔐 안전한 환경변수 접근을 통한 Supabase URL 가져오기
function _getSupabaseUrl() {
  // 1차: 환경변수 직접 확인 (가장 신뢰할 수 있는 방법)
  const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    directUrl &&
    directUrl !== '' &&
    directUrl !== 'https://temp.supabase.co'
  ) {
    console.log('✅ Supabase URL (직접):', directUrl.substring(0, 30) + '...');
    return directUrl;
  }

  // 2차: safeEnv를 통한 확인
  const config = getSupabaseConfig();

  // 설정이 되어 있고 임시 URL이 아닌 경우
  if (
    config.isConfigured &&
    config.url &&
    config.url !== 'https://temp.supabase.co'
  ) {
    console.log(
      '✅ Supabase URL (safeEnv):',
      config.url.substring(0, 30) + '...'
    );
    return config.url;
  }

  // 3차: 빌드 타임인 경우에만 임시 URL 반환
  if (safeEnv.isBuildTime() && process.env.npm_lifecycle_event === 'build') {
    console.warn('⚠️ 빌드 타임 - 임시 Supabase URL 사용');
    return 'https://temp.supabase.co';
  }

  // 런타임인데 URL이 없는 경우 에러
  throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
}

// 🔐 안전한 환경변수 접근을 통한 Supabase Anon Key 가져오기
function _getSupabaseAnonKey() {
  // 1차: 환경변수 직접 확인
  const directKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (directKey && directKey !== '' && directKey !== 'temp-anon-key') {
    return directKey;
  }

  // 2차: safeEnv를 통한 확인
  const config = getSupabaseConfig();

  // 설정이 되어 있고 임시 키가 아닌 경우
  if (
    config.isConfigured &&
    config.anonKey &&
    config.anonKey !== 'temp-anon-key'
  ) {
    return config.anonKey;
  }

  // 3차: 빌드 타임인 경우에만 임시 키 반환
  if (safeEnv.isBuildTime() && process.env.npm_lifecycle_event === 'build') {
    console.warn('⚠️ 빌드 타임 - 임시 Supabase Anon Key 사용');
    return 'temp-anon-key';
  }

  // 런타임인데 키가 없는 경우 에러
  throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Supabase 싱글톤 사용으로 전환
import {
  getSupabaseClient,
  checkSupabaseConnection as checkConnection,
} from './supabase-singleton';
export const supabase = getSupabaseClient();

// 기존 checkSupabaseConnection을 싱글톤 버전으로 대체
export { checkConnection as checkSupabaseConnection };

// 스마트 Supabase 클라이언트 래퍼
class SmartSupabaseClient {
  private fallbackStorage = new Map<string, any>();

  // SELECT 작업 (사용량 체크 포함)
  async select(table: string, query?: string) {
    const cacheKey = `select_${table}_${query || 'all'}`;

    try {
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

  // INSERT 작업
  async insert<T = Record<string, unknown>>(table: string, data: T) {
    try {
      const result = await supabase.from(table).insert(data);
      return result;
    } catch (error) {
      console.warn('Supabase INSERT error:', error);
      return {
        data: [data],
        error,
      };
    }
  }

  // UPDATE 작업
  async update<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    match: Partial<T>
  ) {
    try {
      return await supabase.from(table).update(data).match(match);
    } catch (error) {
      console.warn('Supabase UPDATE error:', error);
      return {
        data: [] as T[],
        error,
      };
    }
  }

  // DELETE 작업
  async delete<T = Record<string, unknown>>(table: string, match: Partial<T>) {
    try {
      return await supabase.from(table).delete().match(match);
    } catch (error) {
      console.warn('Supabase DELETE error:', error);
      return {
        data: [] as T[],
        error,
      };
    }
  }

  // RPC 호출
  async rpc<TParams = Record<string, unknown>, _TResult = unknown>(
    functionName: string,
    params?: TParams
  ) {
    const cacheKey = `rpc_${functionName}_${JSON.stringify(params)}`;

    try {
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
        // 조용히 처리 - 이미 다른 곳에서 경고 표시됨
        return;
      }

      // 싱글톤 인스턴스 사용
      this.client = getSupabaseClient();
      this.isConnected = true;
      console.log('✅ Supabase 싱글톤 연결 사용');
    } catch (error) {
      console.error('❌ Supabase 연결 실패:', error);
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * 📊 서버 메트릭 저장
   */
  async saveServerMetrics(metrics: ServerMetrics[]): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase 미연결 - 메트릭 저장 스킵');
      return;
    }

    try {
      // 배치 크기 제한 (Vercel 메모리 최적화)
      const batchSize = this.config.IS_VERCEL ? 100 : 500;

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
  async getServerMetrics(
    serverId?: string,
    limit = 100
  ): Promise<ServerMetrics[]> {
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
  async saveAIAnalysis(analysis: AIAnalysisResponse): Promise<void> {
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
  async getAIAnalysis(
    analysisId?: string,
    limit = 50
  ): Promise<AIAnalysisResponse[]> {
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
  static async saveServerStatus(
    serverId: string,
    status: ServerMetrics
  ): Promise<void> {
    try {
      const metricsData = {
        ...status,
        server_id: serverId,
        timestamp: new Date(),
      };
      await vercelSupabase.saveServerMetrics([metricsData]);
    } catch (error) {
      console.error('❌ 서버 상태 저장 실패:', error);
    }
  }

  /**
   * 📈 대시보드 데이터 조회
   */
  static async getDashboardData(): Promise<{
    servers: ServerMetrics[];
    metrics: ServerMetrics[];
    analysis: AIAnalysisResponse[];
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
    } catch {
      // 무시 - 연결 유지 시도
    }
  }
}

// 기존 내보내기는 기존 smartSupabase로 유지
