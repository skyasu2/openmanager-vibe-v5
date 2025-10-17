/**
 * 🔄 Supabase Realtime Adapter
 *
 * Redis Streams를 대체하는 Supabase Realtime 기반 어댑터
 * - PostgreSQL 영구 저장
 * - WebSocket 실시간 구독
 * - RLS 보안 적용
 */

import { supabase } from '../../../lib/supabase/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  ThinkingStep,
  AIServiceType,
  ProcessingStatus,
} from '../interfaces/distributed-ai.interface';

// 테이블 타입 정의
interface ThinkingStepRecord {
  id: string;
  session_id: string;
  step: string;
  description: string | null;
  status: ProcessingStatus;
  service: AIServiceType | null;
  timestamp: number;
  duration: number | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export class SupabaseRealtimeAdapter {
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    // Using centralized supabase client with proper env handling
  }

  /**
   * 생각 단계 추가
   */
  async addThinkingStep(
    sessionId: string,
    step: Omit<ThinkingStep, 'id'>,
    userId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('thinking_steps')
        .insert({
          session_id: sessionId,
          step: step.step,
          description: step.description,
          status: step.status,
          service: step.service,
          timestamp: step.timestamp,
          duration: step.duration,
          user_id: userId,
          metadata: {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to add thinking step:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('SupabaseRealtimeAdapter.addThinkingStep error:', error);
      throw error;
    }
  }

  /**
   * 생각 단계 업데이트
   */
  async updateThinkingStep(
    stepId: string,
    updates: Partial<ThinkingStep>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('thinking_steps')
        .update({
          status: updates.status,
          duration: updates.duration,
          description: updates.description,
        })
        .eq('id', stepId);

      if (error) {
        console.error('Failed to update thinking step:', error);
        throw error;
      }
    } catch (error) {
      console.error('SupabaseRealtimeAdapter.updateThinkingStep error:', error);
      throw error;
    }
  }

  /**
   * 생각 단계 조회
   */
  async getThinkingSteps(
    sessionId: string,
    afterId?: string
  ): Promise<ThinkingStep[]> {
    try {
      let query = supabase
        .from('thinking_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (afterId) {
        // afterId 이후의 단계만 조회
        const { data: afterStep } = await supabase
          .from('thinking_steps')
          .select('created_at')
          .eq('id', afterId)
          .single();

        if (afterStep) {
          query = query.gt('created_at', afterStep.created_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get thinking steps:', error);
        throw error;
      }

      return (data || []).map(this.mapToThinkingStep);
    } catch (error) {
      console.error('SupabaseRealtimeAdapter.getThinkingSteps error:', error);
      return [];
    }
  }

  /**
   * 실시간 구독 시작
   */
  subscribeToSession(
    sessionId: string,
    onStep: (step: ThinkingStep) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      // 기존 채널이 있으면 재사용
      if (this.channels.has(sessionId)) {
        const existingChannel = this.channels.get(sessionId);
        existingChannel?.unsubscribe();
      }

      // 새 채널 생성
      const channel = supabase
        .channel(`thinking-steps:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'thinking_steps',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const step = this.mapToThinkingStep(
              payload.new as ThinkingStepRecord
            );
            onStep(step);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'thinking_steps',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const step = this.mapToThinkingStep(
              payload.new as ThinkingStepRecord
            );
            onStep(step);
          }
        )
        .subscribe((status) => {
          if (
            status === 'SUBSCRIBED' ||
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT'
          ) {
            // Supabase Realtime의 실제 상태값들
            if (status !== 'SUBSCRIBED') {
              onError?.(new Error(`Subscription failed: ${status}`));
            }
          }
        });

      this.channels.set(sessionId, channel);

      // Unsubscribe 함수 반환
      return () => {
        channel.unsubscribe();
        this.channels.delete(sessionId);
      };
    } catch (error) {
      console.error('SupabaseRealtimeAdapter.subscribeToSession error:', error);
      onError?.(error as Error);
      return () => {};
    }
  }

  /**
   * 세션의 모든 생각 단계 삭제 (테스트/정리용)
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('thinking_steps')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to clear session:', error);
        throw error;
      }
    } catch (error) {
      console.error('SupabaseRealtimeAdapter.clearSession error:', error);
      throw error;
    }
  }

  /**
   * 배치 생각 단계 추가 (성능 최적화)
   */
  async addThinkingStepsBatch(
    sessionId: string,
    steps: Array<Omit<ThinkingStep, 'id'>>,
    userId?: string
  ): Promise<string[]> {
    try {
      const records = steps.map((step) => ({
        session_id: sessionId,
        step: step.step,
        description: step.description,
        status: step.status,
        service: step.service,
        timestamp: step.timestamp,
        duration: step.duration,
        user_id: userId,
        metadata: {},
      }));

      const { data, error } = await supabase
        .from('thinking_steps')
        .insert(records)
        .select('id');

      if (error) {
        console.error('Failed to add thinking steps batch:', error);
        throw error;
      }

      return (data || []).map((record) => record.id);
    } catch (error) {
      console.error(
        'SupabaseRealtimeAdapter.addThinkingStepsBatch error:',
        error
      );
      throw error;
    }
  }

  /**
   * 모든 채널 정리
   */
  cleanup(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
  }

  /**
   * DB 레코드를 ThinkingStep 타입으로 변환
   */
  private mapToThinkingStep(record: ThinkingStepRecord): ThinkingStep {
    return {
      id: record.id,
      step: record.step,
      description: record.description || undefined,
      status: record.status,
      timestamp: record.timestamp,
      duration: record.duration || undefined,
      service: record.service || undefined,
    };
  }
}

// 싱글톤 인스턴스
export const supabaseRealtimeAdapter = new SupabaseRealtimeAdapter();
