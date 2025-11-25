/**
 * 🧠 AI 세션 저장소 v1.0
 *
 * ✅ Supabase 기반 AI 응답 및 thinking process 저장
 * ✅ Edge Runtime 호환
 * ✅ 프론트엔드 상태 유지 지원
 * ✅ Redis 대체 (Vercel 최적화)
 */

import { EdgeLogger } from '../runtime/edge-runtime-utils';
import type { SupabaseClient } from '@supabase/supabase-js';

// ==============================================
// 🎯 AI 세션 관련 타입 정의
// ==============================================

export interface AISessionData {
  session_id: string;
  user_id?: string;
  query: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
  response: {
    success: boolean;
    response: string;
    confidence: number;
    engine_path: string[];
    processing_time: number;
    fallbacks_used: number;
  };
  thinking_process?: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: number;
  }>;
  reasoning_steps?: string[];
  metadata: {
    timestamp: string;
    ip_address?: string;
    user_agent?: string;
    vercel_deployment?: string;
  };
  expires_at: string;
}

export interface AISessionSummary {
  session_id: string;
  query_preview: string;
  mode: string;
  success: boolean;
  response_time: number;
  created_at: string;
}

export interface AISession {
  sessionId: string;
  query: string;
  response: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
  timestamp: string;
  duration?: number;
  confidence?: number;
  enginePath?: string[];
  metadata?: Record<string, unknown>;
}

export interface AISessionRequest {
  query: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
  context?: Record<string, unknown>;
}

// ==============================================
// 🏗️ AI 세션 저장소 클래스
// ==============================================

export class AISessionStorage {
  private supabase: SupabaseClient | null = null;
  private supabaseInitialized = false;
  private logger: EdgeLogger;
  private readonly TABLE_NAME = 'ai_sessions';
  private readonly SUMMARY_TABLE = 'ai_session_summaries';
  private readonly DEFAULT_TTL_HOURS = 24; // 24시간 보존

  constructor() {
    this.logger = EdgeLogger.getInstance();
    // Supabase client will be initialized lazily on first use
  }

  /**
   * 🔄 Lazy initialization of Supabase client (SSR-compatible)
   */
  private async initializeSupabase(): Promise<void> {
    if (this.supabaseInitialized) return;

    try {
      const { createClient } = await import('@/lib/supabase/server');
      this.supabase = await createClient();
      this.supabaseInitialized = true;
    } catch (error) {
      this.logger.warn(
        'Supabase 클라이언트 초기화 실패 - 메모리 캐시 사용',
        error
      );
      this.supabase = null;
      this.supabaseInitialized = true;
    }
  }

  /**
   * 🔄 AI 응답 저장
   */
  async saveSession(data: AISessionData): Promise<boolean> {
    try {
      // Lazy initialization (SSR-compatible)
      await this.initializeSupabase();

      if (!this.supabase) {
        this.logger.warn('Supabase 비활성화 - 세션 저장 생략');
        return false;
      }

      // 만료 시간 설정 (24시간 후)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.DEFAULT_TTL_HOURS);
      data.expires_at = expiresAt.toISOString();

      // 세션 데이터 저장
      const { error: sessionError } = await this.supabase
        .from(this.TABLE_NAME)
        .upsert(data, {
          onConflict: 'session_id',
          ignoreDuplicates: false,
        });

      if (sessionError) {
        this.logger.error('세션 저장 실패', sessionError);
        return false;
      }

      // 요약 정보 저장 (빠른 조회용)
      const summary: AISessionSummary = {
        session_id: data.session_id,
        query_preview: data.query.substring(0, 100),
        mode: data.mode,
        success: data.response.success,
        response_time: data.response.processing_time,
        created_at: data.metadata.timestamp,
      };

      const { error: summaryError } = await this.supabase
        .from(this.SUMMARY_TABLE)
        .upsert(summary, {
          onConflict: 'session_id',
          ignoreDuplicates: false,
        });

      if (summaryError) {
        this.logger.warn('요약 정보 저장 실패', summaryError);
      }

      this.logger.info(`AI 세션 저장 완료: ${data.session_id}`);
      return true;
    } catch (error) {
      this.logger.error('AI 세션 저장 중 오류', error);
      return false;
    }
  }

  /**
   * 🔍 AI 세션 조회
   */
  async getSession(sessionId: string): Promise<AISessionData | null> {
    try {
      // Lazy initialization (SSR-compatible)
      await this.initializeSupabase();

      if (!this.supabase) {
        this.logger.warn('Supabase 비활성화 - 세션 조회 불가');
        return null;
      }

      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없거나 만료됨
          return null;
        }
        this.logger.error('세션 조회 실패', error);
        return null;
      }

      return data as AISessionData;
    } catch (error) {
      this.logger.error('AI 세션 조회 중 오류', error);
      return null;
    }
  }

  /**
   * 📝 사용자별 세션 목록 조회
   */
  async getUserSessions(
    userId?: string,
    limit: number = 10
  ): Promise<AISessionSummary[]> {
    try {
      // Lazy initialization (SSR-compatible)
      await this.initializeSupabase();

      if (!this.supabase) {
        return [];
      }

      const query = this.supabase
        .from(this.SUMMARY_TABLE)
        .select('*')
        .gt(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ) // 24시간 이내
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        // 사용자별 조회는 향후 구현
        // query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('세션 목록 조회 실패', error);
        return [];
      }

      return data as AISessionSummary[];
    } catch (error) {
      this.logger.error('사용자 세션 목록 조회 중 오류', error);
      return [];
    }
  }

  /**
   * 🧹 만료된 세션 정리
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      // Lazy initialization (SSR-compatible)
      await this.initializeSupabase();

      if (!this.supabase) {
        return 0;
      }

      const now = new Date().toISOString();

      // 만료된 세션 삭제
      const { error: sessionError, count: sessionCount } = await this.supabase
        .from(this.TABLE_NAME)
        .delete()
        .lt('expires_at', now);

      if (sessionError) {
        this.logger.error('만료 세션 정리 실패', sessionError);
        return 0;
      }

      // 만료된 요약 정보 삭제 (24시간 초과)
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const { error: summaryError, count: summaryCount } = await this.supabase
        .from(this.SUMMARY_TABLE)
        .delete()
        .lt('created_at', yesterday);

      if (summaryError) {
        this.logger.warn('만료 요약 정보 정리 실패', summaryError);
      }

      const totalCleaned = (sessionCount || 0) + (summaryCount || 0);
      this.logger.info(`만료된 세션 ${totalCleaned}개 정리 완료`);

      return totalCleaned;
    } catch (error) {
      this.logger.error('세션 정리 중 오류', error);
      return 0;
    }
  }

  /**
   * 🔄 세션 ID 생성
   */
  generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ai_${timestamp}_${random}`;
  }

  /**
   * 📊 저장소 상태 조회
   */
  async getStorageStats(): Promise<{
    total_sessions: number;
    active_sessions: number;
    storage_health: 'healthy' | 'degraded' | 'unavailable';
  }> {
    try {
      // Lazy initialization (SSR-compatible)
      await this.initializeSupabase();

      if (!this.supabase) {
        return {
          total_sessions: 0,
          active_sessions: 0,
          storage_health: 'unavailable',
        };
      }

      const now = new Date().toISOString();

      // 총 세션 수
      const { count: totalCount } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      // 활성 세션 수 (24시간 이내)
      const { count: activeCount } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', now);

      return {
        total_sessions: totalCount || 0,
        active_sessions: activeCount || 0,
        storage_health: 'healthy',
      };
    } catch (error) {
      this.logger.error('저장소 상태 조회 실패', error);
      return {
        total_sessions: 0,
        active_sessions: 0,
        storage_health: 'degraded',
      };
    }
  }
}

// ==============================================
// 🎯 싱글톤 인스턴스 및 유틸리티 함수
// ==============================================

let sessionStorageInstance: AISessionStorage | null = null;

export function getAISessionStorage(): AISessionStorage {
  if (!sessionStorageInstance) {
    sessionStorageInstance = new AISessionStorage();
  }
  return sessionStorageInstance;
}

/**
 * 🔄 AI 응답을 세션에 저장하는 헬퍼 함수
 */
export async function saveAIResponse(
  sessionId: string,
  query: string,
  mode: 'LOCAL' | 'GOOGLE_AI',
  response: unknown,
  thinkingProcess?: unknown[],
  reasoningSteps?: string[]
): Promise<boolean> {
  const storage = getAISessionStorage();

  const typedResponse = response as Record<string, unknown>;
  const sessionData: AISessionData = {
    session_id: sessionId,
    query,
    mode,
    response: {
      success: (typedResponse.success as boolean | undefined) ?? false,
      response:
        (typedResponse.response as string | undefined) ||
        (typedResponse.result as string | undefined) ||
        '',
      confidence: (typedResponse.confidence as number | undefined) ?? 0.7,
      engine_path:
        (typedResponse.enginePath as string[] | undefined) ||
        (typedResponse.engines as { used?: string[] } | undefined)?.used ||
        [],
      processing_time:
        (typedResponse.processingTime as number | undefined) ||
        (typedResponse.response_time as number | undefined) ||
        0,
      fallbacks_used:
        (typedResponse.fallbacksUsed as number | undefined) ??
        (typedResponse.engines as { fallbacks?: number } | undefined)
          ?.fallbacks ??
        0,
    },
    thinking_process: thinkingProcess as
      | Array<{
          type: string;
          title: string;
          description: string;
          timestamp: number;
        }>
      | undefined,
    reasoning_steps: reasoningSteps,
    metadata: {
      timestamp: new Date().toISOString(),
      vercel_deployment: process.env.VERCEL_URL || 'local',
    },
    expires_at: '', // saveSession에서 설정됨
  };

  return await storage.saveSession(sessionData);
}
