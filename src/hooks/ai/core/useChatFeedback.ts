'use client';

import type { MutableRefObject } from 'react';
import { useCallback } from 'react';
import { logger } from '@/lib/logging';

/**
 * 피드백 API 호출 훅
 *
 * @param sessionIdRef - 세션 ID ref (최신 값 보장)
 */
export function useChatFeedback(sessionIdRef: MutableRefObject<string>) {
  const handleFeedback = useCallback(
    async (messageId: string, type: 'positive' | 'negative') => {
      try {
        const response = await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type,
            sessionId: sessionIdRef.current, // ref에서 최신 값 참조
            timestamp: new Date().toISOString(),
          }),
        });
        if (!response.ok) {
          logger.error('[AIChatCore] Feedback API error:', response.status);
        }
      } catch (err) {
        logger.error('[AIChatCore] Feedback error:', err);
      }
    },
    [sessionIdRef]
  );

  return { handleFeedback };
}
