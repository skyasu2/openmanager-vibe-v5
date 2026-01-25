'use client';

import { useRef, useCallback } from 'react';

/**
 * 고유 세션 ID 생성
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `session-${crypto.randomUUID()}`;
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useChatSession(initialSessionId?: string) {
  const sessionIdRef = useRef<string>(initialSessionId || generateSessionId());

  const refreshSessionId = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    return sessionIdRef.current;
  }, []);

  const setSessionId = useCallback((newSessionId: string) => {
    sessionIdRef.current = newSessionId;
  }, []);

  return {
    sessionId: sessionIdRef.current,
    refreshSessionId,
    setSessionId,
  };
}
