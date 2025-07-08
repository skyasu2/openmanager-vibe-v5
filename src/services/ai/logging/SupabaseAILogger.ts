/**
 * 🗄️ Supabase AI 로거
 *
 * AI 자연어 질의 로그를 Supabase 데이터베이스에 저장하는 서비스
 * - 베르셀 파일 업로드 제거 대응
 * - 구조화된 AI 로그 관리
 * - 무료 티어 최적화
 */

import { vercelSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AIQueryLog {
  id?: string;
  session_id: string;
  query: string;
  response: string;
  engine_used: string;
  mode: string;
  confidence: number;
  processing_time: number;
  user_intent?: string;
  category?: string;
  language?: string;
  token_count?: number;
  cost_estimate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AIQueryLogFilter {
  session_id?: string;
  engine_used?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export class SupabaseAILogger {
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;
  private localCache: AIQueryLog[] = [];
  private readonly TABLE_NAME = 'ai_query_logs';
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.initialize();
  }

  /**
   * 🔧 초기화
   */
  private async initialize(): Promise<void> {
    try {
      // Vercel 최적화된 Supabase 클라이언트 사용
      this.supabase = vercelSupabase.getClient();

      if (!this.supabase) {
        console.warn('⚠️ Supabase 클라이언트 없음 - 로컬 캐시 모드');
        this.isInitialized = true;
        return;
      }

      // 테이블 존재 확인
      await this.ensureTableExists();

      this.isInitialized = true;
      console.log('✅ Supabase AI Logger 초기화 완료');
    } catch (error) {
      console.error('❌ Supabase AI Logger 초기화 실패:', error);
      this.isInitialized = true; // 로컬 캐시로 폴백
    }
  }

  /**
   * 📝 AI 질의 로그 저장
   */
  async logQuery(
    log: Omit<AIQueryLog, 'id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const logEntry: AIQueryLog = {
      ...log,
      language: log.language || 'ko',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Supabase 저장 시도
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from(this.TABLE_NAME)
          .insert([logEntry])
          .select();

        if (error) {
          console.error('❌ Supabase AI 로그 저장 실패:', error);
          this.addToLocalCache(logEntry);
          return false;
        }

        console.log('✅ AI 질의 로그 저장 완료:', {
          session_id: logEntry.session_id,
          engine: logEntry.engine_used,
          processing_time: logEntry.processing_time,
        });
        return true;
      }

      // 로컬 캐시 저장
      this.addToLocalCache(logEntry);
      return true;
    } catch (error) {
      console.error('❌ AI 로그 저장 실패:', error);
      this.addToLocalCache(logEntry);
      return false;
    }
  }

  /**
   * 📊 AI 질의 로그 조회
   */
  async getLogs(filter: AIQueryLogFilter = {}): Promise<AIQueryLog[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.supabase) {
        let query = this.supabase
          .from(this.TABLE_NAME)
          .select('*')
          .order('created_at', { ascending: false });

        // 필터 적용
        if (filter.session_id) {
          query = query.eq('session_id', filter.session_id);
        }
        if (filter.engine_used) {
          query = query.eq('engine_used', filter.engine_used);
        }
        if (filter.category) {
          query = query.eq('category', filter.category);
        }
        if (filter.date_from) {
          query = query.gte('created_at', filter.date_from);
        }
        if (filter.date_to) {
          query = query.lte('created_at', filter.date_to);
        }

        query = query.limit(filter.limit || 100);

        const { data, error } = await query;

        if (error) {
          console.error('❌ AI 로그 조회 실패:', error);
          return this.getFromLocalCache(filter);
        }

        return data || [];
      }

      // 로컬 캐시에서 조회
      return this.getFromLocalCache(filter);
    } catch (error) {
      console.error('❌ AI 로그 조회 실패:', error);
      return this.getFromLocalCache(filter);
    }
  }

  /**
   * 📈 AI 사용 통계 조회
   */
  async getStatistics(): Promise<{
    total_queries: number;
    engines: Record<string, number>;
    categories: Record<string, number>;
    avg_processing_time: number;
    avg_confidence: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from(this.TABLE_NAME)
          .select('engine_used, category, processing_time, confidence')
          .gte(
            'created_at',
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          ); // 최근 24시간

        if (error) {
          console.error('❌ AI 통계 조회 실패:', error);
          return this.getLocalStatistics();
        }

        return this.calculateStatistics(data || []);
      }

      return this.getLocalStatistics();
    } catch (error) {
      console.error('❌ AI 통계 조회 실패:', error);
      return this.getLocalStatistics();
    }
  }

  /**
   * 🧹 오래된 로그 정리 (무료 티어 최적화)
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<void> {
    if (!this.supabase) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('❌ 오래된 로그 정리 실패:', error);
        return;
      }

      console.log(`✅ ${retentionDays}일 이전 로그 정리 완료`);
    } catch (error) {
      console.error('❌ 로그 정리 실패:', error);
    }
  }

  /**
   * 🔧 테이블 존재 확인 및 생성
   */
  private async ensureTableExists(): Promise<void> {
    if (!this.supabase) return;

    try {
      // 테이블 존재 확인
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log('⚠️ AI 로그 테이블이 존재하지 않음 - 수동 생성 필요');
        // 실제 운영에서는 마이그레이션 스크립트로 처리
      }
    } catch (error) {
      console.warn('⚠️ 테이블 확인 실패:', error);
    }
  }

  /**
   * 💾 로컬 캐시 관리
   */
  private addToLocalCache(log: AIQueryLog): void {
    this.localCache.unshift(log);
    if (this.localCache.length > this.MAX_CACHE_SIZE) {
      this.localCache = this.localCache.slice(0, this.MAX_CACHE_SIZE);
    }
  }

  private getFromLocalCache(filter: AIQueryLogFilter): AIQueryLog[] {
    let filtered = [...this.localCache];

    if (filter.session_id) {
      filtered = filtered.filter(log => log.session_id === filter.session_id);
    }
    if (filter.engine_used) {
      filtered = filtered.filter(log => log.engine_used === filter.engine_used);
    }
    if (filter.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    return filtered.slice(0, filter.limit || 100);
  }

  private calculateStatistics(logs: any[]): any {
    const total = logs.length;
    const engines: Record<string, number> = {};
    const categories: Record<string, number> = {};
    let totalProcessingTime = 0;
    let totalConfidence = 0;

    logs.forEach(log => {
      engines[log.engine_used] = (engines[log.engine_used] || 0) + 1;
      categories[log.category] = (categories[log.category] || 0) + 1;
      totalProcessingTime += log.processing_time || 0;
      totalConfidence += log.confidence || 0;
    });

    return {
      total_queries: total,
      engines,
      categories,
      avg_processing_time: total > 0 ? totalProcessingTime / total : 0,
      avg_confidence: total > 0 ? totalConfidence / total : 0,
    };
  }

  private getLocalStatistics(): any {
    return this.calculateStatistics(this.localCache);
  }
}

// 싱글톤 인스턴스
export const supabaseAILogger = new SupabaseAILogger();
