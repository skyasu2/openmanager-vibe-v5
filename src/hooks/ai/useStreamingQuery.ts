/**
 * useStreamingQuery Hook
 *
 * @description AI SDK v6 기반 실시간 스트리밍 쿼리 처리
 * useHybridAIQuery에서 분리된 스트리밍 전용 로직
 *
 * @created 2026-01-28
 */

import type { UIMessage } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { extractStreamError } from '@/lib/ai/constants/stream-errors';
import type { QueryComplexity } from '@/lib/ai/utils/query-complexity';
import { logger } from '@/lib/logging';
import type { FileAttachment } from './useFileAttachments';
import type {
  RedirectEventData,
  StreamDataPart,
  WarningEventData,
} from './useHybridAIQuery';

// ============================================================================
// Types
// ============================================================================

export interface StreamingQueryState {
  isLoading: boolean;
  error: string | null;
  warning: string | null;
  processingTime: number;
}

export interface UseStreamingQueryOptions {
  sessionId: string;
  apiEndpoint?: string;
  onData?: (dataPart: StreamDataPart) => void;
  onStreamFinish?: () => void;
  onRedirect?: (complexity: QueryComplexity, query: string) => void;
  onWarning?: (warning: string, processingTime?: number) => void;
  onError?: (error: string) => void;
}

export interface UseStreamingQueryReturn {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  sendStreamingQuery: (query: string, attachments?: FileAttachment[]) => void;
  stop: () => void;
  isLoading: boolean;
  status: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * 메시지 배열에서 undefined parts를 정리
 */
function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    if (!msg.parts || msg.parts.length === 0) {
      return {
        ...msg,
        parts: [{ type: 'text' as const, text: '' }],
      };
    }

    const sanitizedParts = msg.parts
      .filter((part): part is NonNullable<typeof part> => part != null)
      .map((part) => {
        if (
          part.type === 'text' &&
          typeof (part as { text?: string }).text !== 'string'
        ) {
          return { ...part, text: '' };
        }
        return part;
      });

    if (sanitizedParts.length === 0) {
      return {
        ...msg,
        parts: [{ type: 'text' as const, text: '' }],
      };
    }

    return {
      ...msg,
      parts: sanitizedParts,
    };
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useStreamingQuery(
  options: UseStreamingQueryOptions
): UseStreamingQueryReturn {
  const {
    sessionId,
    apiEndpoint = '/api/ai/supervisor/stream/v2',
    onData,
    onStreamFinish,
    onRedirect,
    onWarning,
    onError,
  } = options;

  // Error handling flag (prevent race condition)
  const errorHandledRef = useRef<boolean>(false);
  const currentQueryRef = useRef<string | null>(null);

  // Transport configuration
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        prepareReconnectToStreamRequest: ({ id }) => ({
          api: `${apiEndpoint}?sessionId=${id}`,
        }),
      }),
    [apiEndpoint]
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    stop: stopChat,
  } = useChat({
    id: sessionId,
    transport,
    resume: false,
    onFinish: ({ message }) => {
      if (errorHandledRef.current) {
        logger.debug(
          '[StreamingQuery] onFinish skipped (error already handled)'
        );
        onStreamFinish?.();
        return;
      }

      const parts = message.parts ?? [];
      const content = parts
        .filter(
          (p): p is { type: 'text'; text: string } =>
            p != null && p.type === 'text'
        )
        .map((p) => p.text)
        .join('');

      const errorMessage = extractStreamError(content);

      if (errorMessage) {
        logger.warn(`[StreamingQuery] Stream error detected: ${errorMessage}`);
        errorHandledRef.current = true;
        onError?.(errorMessage);
      }

      onStreamFinish?.();
    },
    onData: (dataPart) => {
      const part = dataPart as StreamDataPart;

      // Warning event handling
      if (part.type === 'warning' && part.data) {
        const warningData = part.data as WarningEventData;
        if (warningData.code === 'SLOW_PROCESSING') {
          logger.warn(
            `⚠️ [StreamingQuery] Slow processing: ${warningData.message}`
          );
          onWarning?.(warningData.message, warningData.elapsed);
        } else {
          logger.warn(
            `⚠️ [StreamingQuery] Stream error: ${warningData.message}`
          );
          onWarning?.(warningData.message);
        }
        return;
      }

      // Redirect event handling (Job Queue switch)
      if (part.type === 'redirect' && part.data) {
        const redirectData = part.data as RedirectEventData;
        logger.info(
          `🔀 [StreamingQuery] Redirect received: ${redirectData.complexity}`
        );
        stopChat();
        const query = currentQueryRef.current;
        if (query) {
          onRedirect?.(redirectData.complexity, query);
        }
        return;
      }

      onData?.(part);
    },
    onError: async (error) => {
      logger.error('[StreamingQuery] useChat error:', error);

      if (errorHandledRef.current) {
        logger.debug('[StreamingQuery] onError skipped (already handled)');
        return;
      }
      errorHandledRef.current = true;

      onError?.(error.message || 'AI 응답 중 오류가 발생했습니다.');
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const sendStreamingQuery = useCallback(
    (query: string, attachments?: FileAttachment[]) => {
      errorHandledRef.current = false;
      currentQueryRef.current = query;

      type FileUIPart = {
        type: 'file';
        mediaType: string;
        url: string;
        filename?: string;
      };

      const hasAttachments = attachments && attachments.length > 0;
      const fileUIParts: FileUIPart[] = hasAttachments
        ? attachments.map((att) => ({
            type: 'file' as const,
            mediaType: att.mimeType,
            url: att.data,
            filename: att.name,
          }))
        : [];

      // Pre-sanitize messages
      flushSync(() => {
        setMessages((prev) => sanitizeMessages(prev));
      });

      const messagePayload = hasAttachments
        ? { text: query, files: fileUIParts }
        : { text: query };

      Promise.resolve(
        sendMessage(messagePayload as Parameters<typeof sendMessage>[0])
      ).catch((error) => {
        logger.error('[StreamingQuery] Send failed:', error);
        onError?.(
          error instanceof Error ? error.message : '스트리밍 전송 실패'
        );
      });
    },
    [sendMessage, setMessages, onError]
  );

  const stop = useCallback(() => {
    stopChat();
  }, [stopChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentQueryRef.current = null;
    };
  }, []);

  return {
    messages,
    setMessages,
    sendStreamingQuery,
    stop,
    isLoading,
    status,
  };
}
