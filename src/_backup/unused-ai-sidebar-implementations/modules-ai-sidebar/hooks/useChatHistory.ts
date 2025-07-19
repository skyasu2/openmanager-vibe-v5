/**
 * useChatHistory Hook
 * 
 * 📚 채팅 히스토리 관리를 위한 React 훅
 */

import { useState, useCallback, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types';
import { loadChatHistory, saveChatHistory, generateSessionId } from '../utils';

interface ChatHistoryOptions {
  maxSessions?: number;
  autoSave?: boolean;
  storageKey?: string;
}

export const useChatHistory = (options: ChatHistoryOptions = {}) => {
  const {
    maxSessions = 10,
    autoSave = true,
    storageKey = 'ai-sidebar-sessions'
  } = options;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  /**
   * 로컬 스토리지에서 세션 목록 로드
   */
  const loadSessions = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, [storageKey]);

  /**
   * 로컬 스토리지에 세션 목록 저장
   */
  const saveSessions = useCallback((sessionsToSave: ChatSession[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [storageKey]);

  /**
   * 새 세션 생성
   */
  const createSession = useCallback((title?: string): string => {
    const sessionId = generateSessionId();
    const newSession: ChatSession = {
      id: sessionId,
      title: title || `채팅 ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      // 최대 세션 수 제한
      const limited = updated.slice(0, maxSessions);
      
      if (autoSave) {
        saveSessions(limited);
      }
      
      return limited;
    });

    setCurrentSessionId(sessionId);
    return sessionId;
  }, [sessions.length, maxSessions, autoSave, saveSessions]);

  /**
   * 세션 선택
   */
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  /**
   * 세션 삭제
   */
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(session => session.id !== sessionId);
      
      if (autoSave) {
        saveSessions(updated);
      }
      
      return updated;
    });

    // 현재 세션이 삭제된 경우
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId, autoSave, saveSessions]);

  /**
   * 세션 제목 업데이트
   */
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => {
      const updated = prev.map(session =>
        session.id === sessionId
          ? { ...session, title, updatedAt: new Date().toISOString() }
          : session
      );
      
      if (autoSave) {
        saveSessions(updated);
      }
      
      return updated;
    });
  }, [autoSave, saveSessions]);

  /**
   * 세션에 메시지 추가
   */
  const addMessageToSession = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions(prev => {
      const updated = prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: new Date().toISOString()
            }
          : session
      );
      
      if (autoSave) {
        saveSessions(updated);
      }
      
      return updated;
    });
  }, [autoSave, saveSessions]);

  /**
   * 세션의 메시지 목록 업데이트
   */
  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => {
      const updated = prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages,
              updatedAt: new Date().toISOString()
            }
          : session
      );
      
      if (autoSave) {
        saveSessions(updated);
      }
      
      return updated;
    });
  }, [autoSave, saveSessions]);

  /**
   * 모든 세션 삭제
   */
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);
    
    if (autoSave) {
      saveSessions([]);
    }
  }, [autoSave, saveSessions]);

  /**
   * 현재 세션 조회
   */
  const getCurrentSession = useCallback((): ChatSession | null => {
    if (!currentSessionId) return null;
    return sessions.find(session => session.id === currentSessionId) || null;
  }, [currentSessionId, sessions]);

  /**
   * 컴포넌트 마운트 시 세션 로드
   */
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    // 상태
    sessions,
    currentSessionId,
    currentSession: getCurrentSession(),
    
    // 액션
    createSession,
    selectSession,
    deleteSession,
    updateSessionTitle,
    addMessageToSession,
    updateSessionMessages,
    clearAllSessions,
    
    // 유틸리티
    sessionCount: sessions.length,
    hasCurrentSession: !!currentSessionId,
    canCreateSession: sessions.length < maxSessions
  };
}; 