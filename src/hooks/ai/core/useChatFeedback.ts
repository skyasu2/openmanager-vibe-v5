'use client';

import { useCallback } from 'react';
import { logger } from '@/lib/logging';

export function useChatFeedback(sessionId: string) {
  const handleFeedback = useCallback(
    async (messageId: string, type: 'positive' | 'negative') => {
      try {
        const response = await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            type,
            sessionId,
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
    [sessionId]
  );

  return { handleFeedback };
}
