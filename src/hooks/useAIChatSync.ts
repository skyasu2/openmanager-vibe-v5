/**
 * 🔄 AI 채팅 상태 동기화 훅
 *
 * 사이드바(useAISidebarStore)와 풀페이지(useAIChatStore) 간
 * 메시지 상태를 동기화합니다.
 *
 * 사용 시나리오:
 * - 사이드바에서 대화 중 풀페이지로 전환 시 대화 유지
 * - 풀페이지에서 대화 후 사이드바로 복귀 시 대화 유지
 */

import { useCallback, useEffect, useRef } from 'react';
import { type ChatMessage, useAIChatStore } from '@/stores/ai-chat-store';
import {
  type EnhancedChatMessage,
  useAISidebarStore,
} from '@/stores/useAISidebarStore';

// 메시지 변환 유틸리티
const sidebarToChatMessage = (msg: EnhancedChatMessage): ChatMessage => ({
  id: msg.id,
  content: msg.content,
  role: msg.role === 'thinking' ? 'system' : msg.role,
  timestamp: msg.timestamp,
  type: 'text',
  error: !!msg.metadata?.error,
  engine: msg.engine,
  responseTime: msg.metadata?.processingTime,
});

const chatToSidebarMessage = (msg: ChatMessage): EnhancedChatMessage => ({
  id: msg.id,
  content: msg.content,
  role: msg.role,
  timestamp: msg.timestamp,
  engine: msg.engine,
  metadata: {
    processingTime: msg.responseTime,
    error: msg.error ? 'Error occurred' : undefined,
  },
  thinkingSteps: msg.thinkingSteps,
  isCompleted: true,
});

interface UseAIChatSyncOptions {
  /** 동기화 방향 ('sidebar-to-fullscreen' | 'fullscreen-to-sidebar' | 'bidirectional') */
  direction?:
    | 'sidebar-to-fullscreen'
    | 'fullscreen-to-sidebar'
    | 'bidirectional';
  /** 자동 동기화 활성화 */
  autoSync?: boolean;
}

export const useAIChatSync = (options: UseAIChatSyncOptions = {}) => {
  const { direction = 'bidirectional', autoSync = true } = options;

  // 스토어 상태
  const sidebarMessages = useAISidebarStore((state) => state.messages);
  const chatMessages = useAIChatStore((state) => state.messages);

  // 스토어 액션
  const setChatMessages = useAIChatStore((state) => state.setMessages);
  const sidebarAddMessage = useAISidebarStore((state) => state.addMessage);
  const sidebarClearMessages = useAISidebarStore(
    (state) => state.clearMessages
  );

  // 동기화 중복 방지
  const isSyncing = useRef(false);
  const lastSyncedSidebarCount = useRef(0);
  const lastSyncedChatCount = useRef(0);

  // 사이드바 → 풀페이지 동기화
  const syncSidebarToFullscreen = useCallback(() => {
    if (isSyncing.current) return;
    if (sidebarMessages.length === lastSyncedSidebarCount.current) return;

    isSyncing.current = true;

    try {
      const convertedMessages = sidebarMessages.map(sidebarToChatMessage);
      setChatMessages(convertedMessages);
      lastSyncedSidebarCount.current = sidebarMessages.length;
      lastSyncedChatCount.current = convertedMessages.length;
    } finally {
      isSyncing.current = false;
    }
  }, [sidebarMessages, setChatMessages]);

  // 풀페이지 → 사이드바 동기화
  const syncFullscreenToSidebar = useCallback(() => {
    if (isSyncing.current) return;
    if (chatMessages.length === lastSyncedChatCount.current) return;
    if (chatMessages.length <= lastSyncedChatCount.current) return; // 새 메시지만 동기화

    isSyncing.current = true;

    try {
      // 새로 추가된 메시지만 사이드바에 추가
      const newMessages = chatMessages.slice(lastSyncedChatCount.current);
      newMessages.forEach((msg) => {
        const convertedMsg = chatToSidebarMessage(msg);
        sidebarAddMessage(convertedMsg);
      });

      lastSyncedChatCount.current = chatMessages.length;
      lastSyncedSidebarCount.current =
        sidebarMessages.length + newMessages.length;
    } finally {
      isSyncing.current = false;
    }
  }, [chatMessages, sidebarMessages.length, sidebarAddMessage]);

  // 양방향 초기 동기화 (풀페이지 진입 시)
  const initializeSync = useCallback(() => {
    // 사이드바에 메시지가 있고, 풀페이지가 기본 상태면 → 사이드바 우선
    if (sidebarMessages.length > 0 && chatMessages.length <= 1) {
      syncSidebarToFullscreen();
    }
    // 풀페이지에 메시지가 더 많으면 → 풀페이지 우선
    else if (chatMessages.length > sidebarMessages.length + 1) {
      syncFullscreenToSidebar();
    }
  }, [
    sidebarMessages.length,
    chatMessages.length,
    syncSidebarToFullscreen,
    syncFullscreenToSidebar,
  ]);

  // 대화 초기화 (양쪽 모두)
  const resetBothStores = useCallback(() => {
    useAIChatStore.getState().resetChat();
    sidebarClearMessages();
    lastSyncedSidebarCount.current = 0;
    lastSyncedChatCount.current = 1; // resetChat은 환영 메시지 1개 남김
  }, [sidebarClearMessages]);

  // 자동 동기화 효과
  useEffect(() => {
    if (!autoSync) return;

    if (
      direction === 'sidebar-to-fullscreen' ||
      direction === 'bidirectional'
    ) {
      syncSidebarToFullscreen();
    }
  }, [autoSync, direction, syncSidebarToFullscreen]);

  useEffect(() => {
    if (!autoSync) return;

    if (
      direction === 'fullscreen-to-sidebar' ||
      direction === 'bidirectional'
    ) {
      syncFullscreenToSidebar();
    }
  }, [autoSync, direction, syncFullscreenToSidebar]);

  return {
    // 수동 동기화 함수
    syncSidebarToFullscreen,
    syncFullscreenToSidebar,
    initializeSync,
    resetBothStores,

    // 상태 정보
    sidebarMessageCount: sidebarMessages.length,
    fullscreenMessageCount: chatMessages.length,
    isSynced:
      lastSyncedSidebarCount.current === sidebarMessages.length &&
      lastSyncedChatCount.current === chatMessages.length,
  };
};

export default useAIChatSync;
