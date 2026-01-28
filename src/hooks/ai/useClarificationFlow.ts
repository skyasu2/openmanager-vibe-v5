/**
 * useClarificationFlow Hook
 *
 * @description 명확화(Clarification) 로직 전용 훅
 * useHybridAIQuery에서 분리된 명확화 관련 로직
 *
 * @created 2026-01-28
 */

import { useCallback, useRef, useState } from 'react';
import {
  applyClarification,
  applyCustomClarification,
  type ClarificationOption,
  type ClarificationRequest,
  generateClarification,
} from '@/lib/ai/clarification-generator';
import { classifyQuery } from '@/lib/ai/query-classifier';
import { logger } from '@/lib/logging';
import type { FileAttachment } from './useFileAttachments';

// ============================================================================
// Types
// ============================================================================

export interface ClarificationFlowState {
  clarification: ClarificationRequest | null;
  pendingQuery: string | null;
  pendingAttachments: FileAttachment[] | null;
}

export interface UseClarificationFlowOptions {
  onExecuteQuery: (query: string, attachments?: FileAttachment[]) => void;
  onError?: (error: string) => void;
}

export interface UseClarificationFlowReturn {
  /** 현재 명확화 요청 상태 */
  clarification: ClarificationRequest | null;
  /** 명확화 필요 여부 확인 및 처리 */
  processClarification: (
    query: string,
    attachments?: FileAttachment[]
  ) => Promise<boolean>;
  /** 명확화 옵션 선택 */
  selectClarification: (option: ClarificationOption) => void;
  /** 커스텀 명확화 입력 */
  submitCustomClarification: (customInput: string) => void;
  /** 명확화 건너뛰기 (원본 쿼리 실행) */
  skipClarification: () => void;
  /** 명확화 취소 (쿼리 미실행, 상태 정리) */
  dismissClarification: () => void;
  /** 상태 리셋 */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useClarificationFlow(
  options: UseClarificationFlowOptions
): UseClarificationFlowReturn {
  const { onExecuteQuery, onError } = options;

  const [clarification, setClarification] =
    useState<ClarificationRequest | null>(null);
  const pendingQueryRef = useRef<string | null>(null);
  const pendingAttachmentsRef = useRef<FileAttachment[] | null>(null);

  /**
   * 명확화 필요 여부 확인 및 처리
   * @returns true: 명확화 필요 (쿼리 실행 보류), false: 바로 실행 가능
   */
  const processClarification = useCallback(
    async (query: string, attachments?: FileAttachment[]): Promise<boolean> => {
      // 원본 쿼리 및 첨부 파일 저장
      pendingQueryRef.current = query;
      pendingAttachmentsRef.current = attachments || null;

      try {
        // 파일 첨부가 있으면 명확화 스킵 (Vision Agent 직접 호출)
        if (attachments && attachments.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            logger.info(
              `[Clarification] Skipping: ${attachments.length} attachment(s) detected`
            );
          }
          return false;
        }

        // 쿼리 분류 (Groq LLM 사용)
        const classification = await classifyQuery(query);

        if (process.env.NODE_ENV === 'development') {
          logger.info(
            `[Clarification] Classification: intent=${classification.intent}, complexity=${classification.complexity}, confidence=${classification.confidence}%`
          );
        }

        // 명확화 필요 여부 체크
        const clarificationRequest = generateClarification(
          query,
          classification
        );

        if (clarificationRequest) {
          setClarification(clarificationRequest);
          return true;
        }

        return false;
      } catch (error) {
        logger.error('[Clarification] processClarification error:', error);
        onError?.(
          error instanceof Error
            ? error.message
            : '쿼리 분류 중 오류가 발생했습니다.'
        );
        return false;
      }
    },
    [onError]
  );

  /**
   * 명확화 옵션 선택
   */
  const selectClarification = useCallback(
    (option: ClarificationOption) => {
      const clarifiedQuery = applyClarification(option);
      setClarification(null);
      onExecuteQuery(
        clarifiedQuery,
        pendingAttachmentsRef.current || undefined
      );
    },
    [onExecuteQuery]
  );

  /**
   * 커스텀 명확화 입력
   */
  const submitCustomClarification = useCallback(
    (customInput: string) => {
      if (!pendingQueryRef.current) return;

      const clarifiedQuery = applyCustomClarification(
        pendingQueryRef.current,
        customInput
      );

      setClarification(null);
      onExecuteQuery(
        clarifiedQuery,
        pendingAttachmentsRef.current || undefined
      );
    },
    [onExecuteQuery]
  );

  /**
   * 명확화 건너뛰기 - 원본 쿼리 그대로 실행
   */
  const skipClarification = useCallback(() => {
    const query = pendingQueryRef.current;
    const attachments = pendingAttachmentsRef.current;

    if (!query || !query.trim()) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[Clarification] skipClarification: No pending query');
      }
      setClarification(null);
      return;
    }

    setClarification(null);
    onExecuteQuery(query, attachments || undefined);
  }, [onExecuteQuery]);

  /**
   * 명확화 취소 - 쿼리 미실행, 상태 정리만
   */
  const dismissClarification = useCallback(() => {
    setClarification(null);
    pendingQueryRef.current = null;
    pendingAttachmentsRef.current = null;
  }, []);

  /**
   * 상태 리셋
   */
  const reset = useCallback(() => {
    setClarification(null);
    pendingQueryRef.current = null;
    pendingAttachmentsRef.current = null;
  }, []);

  return {
    clarification,
    processClarification,
    selectClarification,
    submitCustomClarification,
    skipClarification,
    dismissClarification,
    reset,
  };
}
