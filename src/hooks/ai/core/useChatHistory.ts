'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logging';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import {
  clearChatHistory as clearStorage,
  loadChatHistory,
  saveChatHistory,
} from '../utils/chat-history-storage';

// Restored message structure (minimal for history restore)
interface RestoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts: Array<{ type: 'text'; text: string }>;
}

interface UseChatHistoryProps<
  TMessage extends RestoredMessage = RestoredMessage,
> {
  sessionId: string;
  isMessagesEmpty: boolean;
  enhancedMessages: EnhancedChatMessage[];
  /** setMessages that accepts our restored message format */
  setMessages: (messages: TMessage[]) => void;
  isLoading: boolean;
  onSessionRestore?: (sessionId: string) => void;
}

export function useChatHistory<TMessage extends RestoredMessage>({
  sessionId,
  isMessagesEmpty,
  enhancedMessages,
  setMessages,
  isLoading,
  onSessionRestore,
}: UseChatHistoryProps<TMessage>) {
  const isHistoryLoaded = useRef(false);

  // 로컬 스토리지에서 히스토리 복원
  useEffect(() => {
    if (isHistoryLoaded.current || !isMessagesEmpty) return;

    const history = loadChatHistory();
    if (history && history.messages.length > 0) {
      const restoredMessages = history.messages
        .filter((m) => m.content && m.content.trim().length > 0)
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
        }));

      // Cast to TMessage[] - the restored messages satisfy RestoredMessage constraint
      setMessages(restoredMessages as TMessage[]);

      if (history.sessionId && onSessionRestore) {
        onSessionRestore(history.sessionId);
      }

      if (process.env.NODE_ENV === 'development') {
        logger.info(
          `📂 [ChatHistory] Restored ${restoredMessages.length} messages`
        );
      }
    }

    isHistoryLoaded.current = true;
  }, [isMessagesEmpty, setMessages, onSessionRestore]);

  // 메시지 변경 시 자동 저장
  useEffect(() => {
    if (!isLoading && enhancedMessages.length > 0) {
      saveChatHistory(sessionId, enhancedMessages);
    }
  }, [enhancedMessages, isLoading, sessionId]);

  const clearHistory = () => {
    clearStorage();
  };

  return {
    clearHistory,
    // Original code updated sessionId ref on restore.
    // We might need to handle that.
    // For now, let's keep it simple and assume session ID management is separate,
    // OR we export a restore function.
  };
}
