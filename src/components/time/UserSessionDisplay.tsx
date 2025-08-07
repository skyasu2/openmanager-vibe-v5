'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Play, Pause, RotateCw, AlertCircle, User } from 'lucide-react';
import { userSessionService, type UserSession } from '@/services/time/UserSessionService';
import dynamic from 'next/dynamic';

// framer-motion을 동적 import로 처리
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);

interface UserSessionDisplayProps {
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

/**
 * 🎯 사용자 세션 표시 컴포넌트
 * 30분 세션 타이머 및 제어 UI
 */
export const UserSessionDisplay: React.FC<UserSessionDisplayProps> = ({
  className = '',
  showControls = true,
  compact = false,
}) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionInfo, setSessionInfo] = useState(userSessionService.getFormattedSessionInfo());
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 세션 상태 구독
    const unsubscribeSession = userSessionService.subscribeToSession((newSession) => {
      setSession(newSession);
      setSessionInfo(userSessionService.getFormattedSessionInfo());
    });

    // 경고 알림 구독
    const unsubscribeWarning = userSessionService.subscribeToWarnings((remainingMinutes) => {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      
      // 브라우저 알림 (권한이 있는 경우)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('세션 종료 임박', {
          body: `${remainingMinutes}분 후 세션이 종료됩니다.`,
          icon: '/favicon.ico',
        });
      }
    });

    // 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 정기 업데이트 (1초마다)
    const interval = setInterval(() => {
      setSessionInfo(userSessionService.getFormattedSessionInfo());
    }, 1000);

    return () => {
      unsubscribeSession();
      unsubscribeWarning();
      clearInterval(interval);
    };
  }, []);

  // 세션 시작/재시작
  const handleStartSession = () => {
    userSessionService.startSession('user-' + Date.now());
  };

  // 세션 일시정지/재개
  const handleTogglePause = () => {
    if (session?.isPaused) {
      userSessionService.resumeSession();
    } else {
      userSessionService.pauseSession();
    }
  };

  // 세션 갱신
  const handleRenewSession = () => {
    userSessionService.renewSession();
  };

  // 세션 종료
  const handleEndSession = () => {
    userSessionService.endSession('사용자 요청');
  };

  // 경고 레벨에 따른 색상
  const getWarningColor = () => {
    switch (sessionInfo.warningLevel) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'low': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-blue-600 bg-blue-100 border-blue-300';
    }
  };

  // 컴팩트 모드
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-gray-500" />
        {session ? (
          <>
            <span className={`text-sm font-medium ${sessionInfo.warningLevel !== 'none' ? 'text-orange-600' : 'text-gray-700'}`}>
              세션: {sessionInfo.remainingTime}
            </span>
            {sessionInfo.warningLevel !== 'none' && (
              <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
            )}
          </>
        ) : (
          <button
            onClick={handleStartSession}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            세션 시작
          </button>
        )}
      </div>
    );
  }

  // 전체 UI
  return (
    <div className={`rounded-lg border p-3 ${getWarningColor()} ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <User className="h-5 w-5" />
            {session?.isActive && (
              <MotionDiv
                className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                사용자 세션
              </span>
              {session && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  session.isPaused ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                }`}>
                  {sessionInfo.status}
                </span>
              )}
            </div>
            
            {session ? (
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {sessionInfo.remainingTime}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600">
                  진행률: {sessionInfo.progress}
                </div>
                
                {session.completedCycles > 0 && (
                  <div className="text-xs text-gray-600">
                    주기: {session.completedCycles}회
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-600 mt-1">
                세션이 시작되지 않았습니다
              </div>
            )}
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {!session ? (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                title="세션 시작"
              >
                <Play className="h-4 w-4" />
                <span>시작</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleTogglePause}
                  className="p-1.5 bg-white rounded-md hover:bg-gray-100 transition-colors"
                  title={session.isPaused ? '재개' : '일시정지'}
                >
                  {session.isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </button>
                
                <button
                  onClick={handleRenewSession}
                  className="p-1.5 bg-white rounded-md hover:bg-gray-100 transition-colors"
                  title="세션 갱신 (30분 연장)"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                
                <button
                  onClick={handleEndSession}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs"
                  title="세션 종료"
                >
                  종료
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 경고 메시지 */}
      {showWarning && session && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-md"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-800 font-medium">
              세션이 곧 종료됩니다. 필요시 갱신해주세요.
            </span>
          </div>
        </MotionDiv>
      )}

      {/* 진행 바 */}
      {session && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <MotionDiv
              className={`h-full ${
                sessionInfo.warningLevel === 'high' ? 'bg-red-500' :
                sessionInfo.warningLevel === 'medium' ? 'bg-orange-500' :
                sessionInfo.warningLevel === 'low' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${sessionInfo.progress}` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 🎯 헤더용 컴팩트 세션 표시
 */
export const UserSessionHeader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <UserSessionDisplay className={className} compact showControls={false} />;
};