/**
 * 🔍 InteractionLogger - AI 상호작용 로깅 서비스
 *
 * Supabase 연동으로 사용자 피드백을 실제 저장합니다.
 * 무료 티어 한도 내에서 동작 (월 50,000 행)
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { UserFeedback } from '@/types/ai-learning';

// 피드백 저장 결과 타입
interface FeedbackSaveResult {
  success: boolean;
  id?: string;
  error?: string;
}

export class InteractionLogger {
  private static instance: InteractionLogger;
  private pendingQueue: UserFeedback[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): InteractionLogger {
    if (!InteractionLogger.instance) {
      InteractionLogger.instance = new InteractionLogger();
    }
    return InteractionLogger.instance;
  }

  /**
   * 일반 이벤트 로깅 (콘솔)
   */
  log(event: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[InteractionLogger] ${event}`, data);
    }
  }

  /**
   * 피드백 로깅 (Supabase 저장)
   */
  async logFeedback(feedback: UserFeedback): Promise<FeedbackSaveResult> {
    return this.saveFeedbackToSupabase(feedback);
  }

  /**
   * 사용자 피드백 로깅 (Supabase 저장) - 비동기 큐 방식
   */
  logUserFeedback(feedback: UserFeedback): void {
    // 큐에 추가하고 비동기 처리
    this.pendingQueue.push(feedback);
    this.processQueue();
  }

  /**
   * 에러 로깅
   */
  logError(error: Error, context?: unknown): void {
    console.error('[InteractionLogger] Error:', error.message, context);

    // 개발 환경에서만 스택 트레이스 출력
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  }

  /**
   * 피드백을 Supabase에 저장
   */
  private async saveFeedbackToSupabase(
    feedback: UserFeedback
  ): Promise<FeedbackSaveResult> {
    try {
      const supabase = getSupabaseClient();

      // 브라우저 환경 메타데이터 수집
      const metadata = this.collectBrowserMetadata();

      const { data, error } = await supabase
        .from('ai_user_feedback')
        .insert({
          interaction_id: feedback.interactionId,
          feedback: feedback.feedback,
          detailed_reason: feedback.detailedReason || null,
          additional_comments: feedback.additionalComments || null,
          session_id: metadata.sessionId,
          user_agent: metadata.userAgent,
          page_url: metadata.pageUrl,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[InteractionLogger] Supabase 저장 실패:', error.message);
        return { success: false, error: error.message };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[InteractionLogger] 피드백 저장 성공:', data?.id);
      }

      return { success: true, id: data?.id };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('[InteractionLogger] 저장 중 예외:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 브라우저 메타데이터 수집
   */
  private collectBrowserMetadata(): {
    sessionId: string | null;
    userAgent: string | null;
    pageUrl: string | null;
  } {
    if (typeof window === 'undefined') {
      return { sessionId: null, userAgent: null, pageUrl: null };
    }

    // 세션 ID 생성 또는 가져오기
    let sessionId = sessionStorage.getItem('ai_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('ai_session_id', sessionId);
    }

    return {
      sessionId,
      userAgent: navigator.userAgent.slice(0, 255), // 255자 제한
      pageUrl: window.location.pathname,
    };
  }

  /**
   * 대기열 처리 (배치 저장)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.pendingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 큐에서 최대 10개씩 처리
      const batch = this.pendingQueue.splice(0, 10);

      for (const feedback of batch) {
        await this.saveFeedbackToSupabase(feedback);
      }
    } finally {
      this.isProcessing = false;

      // 남은 항목이 있으면 다시 처리
      if (this.pendingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * 피드백 통계 조회 (분석용)
   */
  async getFeedbackStats(): Promise<{
    total: number;
    helpful: number;
    notHelpful: number;
    incorrect: number;
  } | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('ai_feedback_stats')
        .select('feedback, count')
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('[InteractionLogger] 통계 조회 실패:', error.message);
        return null;
      }

      // 최근 30일 데이터 집계
      const stats = {
        total: 0,
        helpful: 0,
        notHelpful: 0,
        incorrect: 0,
      };

      for (const row of data || []) {
        const count = Number(row.count) || 0;
        stats.total += count;

        if (row.feedback === 'helpful') {
          stats.helpful += count;
        } else if (row.feedback === 'not_helpful') {
          stats.notHelpful += count;
        } else if (row.feedback === 'incorrect') {
          stats.incorrect += count;
        }
      }

      return stats;
    } catch (err) {
      console.error('[InteractionLogger] 통계 조회 예외:', err);
      return null;
    }
  }
}
