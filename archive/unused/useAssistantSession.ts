'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePowerStore } from '../stores/powerStore';

export interface AssistantSession {
  isActive: boolean;
  mode: 'active' | 'monitoring' | 'sleep' | 'emergency';
  lastActivity: Date | null;
  sessionDuration: number;
}

export function useAssistantSession() {
  const { mode, updateActivity, activateSystem, enterSleepMode } = usePowerStore();
  const [session, setSession] = useState<AssistantSession>({
    isActive: false,
    mode: 'sleep',
    lastActivity: null,
    sessionDuration: 0
  });

  // 세션 상태 업데이트
  useEffect(() => {
    setSession(prev => ({
      ...prev,
      isActive: mode === 'active' || mode === 'monitoring',
      mode: mode
    }));
  }, [mode]);

  // 세션 지속 시간 계산
  useEffect(() => {
    if (!session.isActive || !session.lastActivity) return;

    const interval = setInterval(() => {
      setSession(prev => ({
        ...prev,
        sessionDuration: Date.now() - (prev.lastActivity?.getTime() || 0)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isActive, session.lastActivity]);

  // 활동 기록
  const recordActivity = useCallback(() => {
    const now = new Date();
    setSession(prev => ({
      ...prev,
      lastActivity: now
    }));
    updateActivity();
  }, [updateActivity]);

  // 세션 시작
  const startSession = useCallback(async () => {
    try {
      activateSystem();
      const now = new Date();
      setSession(prev => ({
        ...prev,
        isActive: true,
        lastActivity: now,
        sessionDuration: 0
      }));
      console.log('🚀 AI 어시스턴트 세션 시작');
      return true;
    } catch (error) {
      console.error('세션 시작 실패:', error);
      return false;
    }
  }, [activateSystem]);

  // 세션 종료
  const endSession = useCallback(async () => {
    try {
      enterSleepMode();
      setSession(prev => ({
        ...prev,
        isActive: false,
        lastActivity: null,
        sessionDuration: 0
      }));
      console.log('🛑 AI 어시스턴트 세션 종료');
      return true;
    } catch (error) {
      console.error('세션 종료 실패:', error);
      return false;
    }
  }, [enterSleepMode]);

  // 자동 활성화 (비활성 상태에서 활동 감지 시)
  const autoActivate = useCallback(async () => {
    if (!session.isActive) {
      console.log('🔄 자동 활성화 중...');
      return await startSession();
    }
    recordActivity();
    return true;
  }, [session.isActive, startSession, recordActivity]);

  // 세션 상태 정보
  const getSessionInfo = useCallback(() => {
    const formatDuration = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}시간 ${minutes % 60}분`;
      } else if (minutes > 0) {
        return `${minutes}분 ${seconds % 60}초`;
      } else {
        return `${seconds}초`;
      }
    };

    return {
      status: session.isActive ? '활성화' : '대기중',
      mode: session.mode,
      duration: session.sessionDuration > 0 ? formatDuration(session.sessionDuration) : '0초',
      lastActivity: session.lastActivity?.toLocaleTimeString('ko-KR') || '없음'
    };
  }, [session]);

  // 절전 모드 상태 확인
  const isPowerSaveMode = useCallback(() => {
    return mode === 'sleep';
  }, [mode]);

  // 시스템 활성화 상태 확인
  const isSystemActive = useCallback(() => {
    return mode === 'active' || mode === 'monitoring';
  }, [mode]);

  return {
    session,
    recordActivity,
    startSession,
    endSession,
    autoActivate,
    getSessionInfo,
    isPowerSaveMode,
    isSystemActive
  };
} 