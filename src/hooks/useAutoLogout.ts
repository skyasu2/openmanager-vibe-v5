/**
 * 🔐 Auto Logout Hook
 *
 * OpenManager Vibe v5 자동 로그아웃 시스템 (Google OAuth 제거됨)
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface UseAutoLogoutOptions {
  /** 비활성 시간 (밀리초) */
  inactivityTimeout?: number;
  /** 경고 시간 (밀리초) */
  warningTimeout?: number;
  /** 로그아웃 후 리다이렉트 경로 */
  redirectPath?: string;
  /** 경고 콜백 */
  onWarning?: () => void;
  /** 로그아웃 콜백 */
  onLogout?: () => void;
  /** 타임아웃 시간 (분) */
  timeoutMinutes?: number;
  /** 경고 시간 (분) */
  warningMinutes?: number;
}

export function useAutoLogout({
  inactivityTimeout = 30 * 60 * 1000, // 30분
  warningTimeout = 5 * 60 * 1000, // 5분 전 경고
  redirectPath = '/login',
  onWarning,
  onLogout,
  timeoutMinutes = 30,
  warningMinutes = 5,
}: UseAutoLogoutOptions = {}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [remainingTime, setRemainingTime] = useState(inactivityTimeout);
  const [isWarning, setIsWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // 활동 업데이트
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    resetTimers();
  };

  // 타이머 초기화
  const resetTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    setIsWarning(false);
    setRemainingTime(inactivityTimeout);

    // 로그인된 사용자만 타이머 설정
    if (isLoggedIn) {
      // 경고 타이머
      warningTimeoutRef.current = setTimeout(() => {
        setIsWarning(true);
        onWarning?.();
      }, inactivityTimeout - warningTimeout);

      // 로그아웃 타이머
      timeoutRef.current = setTimeout(() => {
        handleAutoLogout();
      }, inactivityTimeout);
    }
  };

  // 자동 로그아웃 처리
  const handleAutoLogout = async () => {
    try {
      onLogout?.();

      // 게스트 모드 - 로컬 스토리지 정리
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      setIsLoggedIn(false);
      router.push(redirectPath);

      console.log('🔐 자동 로그아웃 완료');
    } catch (error) {
      console.error('❌ 자동 로그아웃 실패:', error);
      // 실패해도 로그인 페이지로 이동
      router.push(redirectPath);
    }
  };

  // 강제 로그아웃
  const forceLogout = async () => {
    await handleAutoLogout();
  };

  // 수동 로그아웃
  const logout = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      await handleAutoLogout();
    } catch (error) {
      console.error('❌ 수동 로그아웃 실패:', error);
    }
  };

  // 활동 감지 이벤트 리스너
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      updateActivity();
    };

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // 초기 타이머 설정
    resetTimers();

    return () => {
      // 이벤트 리스너 제거
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isLoggedIn, inactivityTimeout, warningTimeout]);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = () => {
      const sessionId = localStorage.getItem('auth_session_id');
      const authType = localStorage.getItem('auth_type');
      setIsLoggedIn(!!sessionId && authType === 'guest');
    };

    checkAuthStatus();

    // 주기적으로 상태 확인
    const interval = setInterval(checkAuthStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // 로그인 상태가 변경될 때 타이머 재설정
  useEffect(() => {
    resetTimers();
  }, [isLoggedIn]);

  return {
    logout,
    updateActivity,
    lastActivity: lastActivityRef.current,
    isLoggedIn,
    remainingTime,
    isWarning,
    resetTimer: resetTimers,
    forceLogout,
  };
}
