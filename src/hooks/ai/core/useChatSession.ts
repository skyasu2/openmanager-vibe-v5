'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * 고유 세션 ID 생성
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `session-${crypto.randomUUID()}`;
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 세션 ID 관리 훅
 *
 * useState + useRef 하이브리드 패턴:
 * - useState: 세션 변경 시 리렌더 트리거
 * - useRef: 콜백 내부에서 최신 값 참조
 */
export function useChatSession(initialSessionId?: string) {
  const [sessionId, setSessionIdState] = useState(
    () => initialSessionId ?? generateSessionId()
  );
  const sessionIdRef = useRef(sessionId);

  // ref를 항상 최신 상태와 동기화
  sessionIdRef.current = sessionId;

  const refreshSessionId = useCallback(() => {
    const next = generateSessionId();
    sessionIdRef.current = next;
    setSessionIdState(next);
    return next;
  }, []);

  const setSessionId = useCallback((newSessionId: string) => {
    sessionIdRef.current = newSessionId;
    setSessionIdState(newSessionId);
  }, []);

  return {
    sessionId,
    sessionIdRef,
    refreshSessionId,
    setSessionId,
  };
}
