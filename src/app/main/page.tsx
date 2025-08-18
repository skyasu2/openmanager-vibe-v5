/**
 * 🏠 OpenManager 메인 페이지 - Commit 18a89a4 UI 복원
 *
 * GitHub OAuth + 게스트 로그인 지원 + 원래 UI 구조 복원
 * 웨이브 파티클 배경, 고급 애니메이션, 카운트다운 시스템 복원
 */

'use client';

import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { BarChart3, Bot, Loader2, Play, X, LogIn } from 'lucide-react';
import {
  getCurrentUser,
  isGitHubAuthenticated,
  onAuthStateChange,
} from '@/lib/supabase-auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import debug from '@/utils/debug';

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="h-32 rounded-lg bg-white/10 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    ),
  }
);

export default function Home() {
  const router = useRouter();
  const [isGitHubUser, setIsGitHubUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email?: string;
    avatar?: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [_redirecting, _setRedirecting] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // 🔄 클라이언트 마운트 상태 (hydration 문제 방지)

  const {
    isSystemStarted,
    aiAgent,
    adminMode: _adminMode,
    startSystem,
    stopSystem,
    logout: _logout,
    getSystemRemainingTime,
  } = useUnifiedAdminStore();

  // 📊 다중 사용자 시스템 상태 관리 - 개선된 동기화
  const {
    status: multiUserStatus,
    isLoading: statusLoading,
    startSystem: startMultiUserSystem,
    refresh: refreshSystemStatus,
  } = useSystemStatus();

  const [isLoading, _setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🚀 시스템 시작 카운트다운 상태
  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isSystemStarting, setIsSystemStarting] = useState(false); // 시스템 시작 중 상태 추가

  // 시스템 상태 동기화 - 실시간 업데이트 (깜박임 방지 최적화)
  useEffect(() => {
    if (!isMounted) return;

    // 상태 변경 배치화를 위한 타이머
    const syncTimer = setTimeout(() => {
      // 시스템 상태가 변경되면 로컬 상태도 동기화
      if (multiUserStatus?.isRunning && !isSystemStarted) {
        debug.log('🔄 시스템 상태 동기화: 시스템이 다른 사용자에 의해 시작됨');
        startSystem(); // 로컬 상태 동기화
      } else if (
        multiUserStatus &&
        !multiUserStatus.isRunning &&
        isSystemStarted
      ) {
        debug.log('🔄 시스템 상태 동기화: 시스템이 다른 사용자에 의해 정지됨');
        stopSystem(); // 로컬 상태 동기화
      }

      // 시스템 시작 중 상태 동기화
      if (multiUserStatus?.isStarting !== isSystemStarting) {
        setIsSystemStarting(multiUserStatus?.isStarting || false);
      }
    }, 50); // 50ms 디바운스로 빠른 상태 변경 배치화

    return () => clearTimeout(syncTimer);
  }, [
    isMounted,
    multiUserStatus?.isRunning,
    multiUserStatus?.isStarting,
    isSystemStarted,
    isSystemStarting,
    startSystem,
    stopSystem,
  ]);

  // 🔄 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Supabase Auth 상태 확인 (깜박임 방지 최적화)
  useEffect(() => {
    if (!isMounted) return;

    let authListener: { subscription: { unsubscribe: () => void } } | null;
    let isCheckingAuth = false; // 중복 체크 방지

    const checkAuth = async () => {
      if (isCheckingAuth) return; // 이미 체크 중이면 무시
      isCheckingAuth = true;
      
      setAuthLoading(true);
      try {
        // GitHub 인증 확인
        const isGitHub = await isGitHubAuthenticated();
        
        // 현재 사용자 정보 가져오기
        const user = await getCurrentUser();

        // 상태가 실제로 변경된 경우에만 업데이트 (깜박임 방지)
        setIsGitHubUser(prev => prev !== isGitHub ? isGitHub : prev);
        
        // 사용자 정보 설정
        if (user) {
          const newUserData = {
            name: user.name || 'User',
            email: user.email,
            avatar: user.avatar,
          };
          setCurrentUser(prev => {
            if (!prev || prev.name !== newUserData.name || prev.email !== newUserData.email) {
              return newUserData;
            }
            return prev;
          });
        } else {
          setCurrentUser(prev => prev !== null ? null : prev);
        }

        debug.log('🔐 인증 상태:', { isGitHub, user });
        setAuthChecked(true);
      } catch (error) {
        debug.error('❌ 인증 확인 오류:', error);
      } finally {
        setAuthLoading(false);
        isCheckingAuth = false;
      }
    };

    void checkAuth();

    // 인증 상태 변경 리스너 (디바운스 적용)
    let authChangeTimer: NodeJS.Timeout;
    authListener = onAuthStateChange(async (_session) => {
      debug.log('🔄 Auth 상태 변경 감지');
      // 100ms 디바운스로 빠른 상태 변경 배치화
      clearTimeout(authChangeTimer);
      authChangeTimer = setTimeout(() => {
        void checkAuth();
      }, 100);
    });

    return () => {
      authListener?.subscription.unsubscribe();
      clearTimeout(authChangeTimer);
    };
  }, [isMounted]);

  // 즉시 리다이렉션 체크 (깜박임 방지 최적화)
  useEffect(() => {
    if (!isMounted || authLoading) return;

    // 인증 체크 완료 후 사용자가 없으면 지연된 리다이렉션 (깜박임 방지)
    if (authChecked && !currentUser) {
      debug.log('🚨 인증 정보 없음 - 로그인 페이지로 이동');
      // 200ms 지연으로 부드러운 전환
      const redirectTimer = setTimeout(() => {
        router.replace('/login');
      }, 200);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isMounted, authLoading, authChecked, currentUser, router]);

  // 🔧 상태 변화 디버깅 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    debug.log('🔍 Home - 시스템 상태 변화:', {
      isSystemStarted,
      aiAgentEnabled: aiAgent.isEnabled,
      aiAgentState: aiAgent.state,
      timeRemaining: systemTimeRemaining,
    });
  }, [
    isMounted,
    isSystemStarted,
    aiAgent.isEnabled,
    aiAgent.state,
    systemTimeRemaining,
  ]);

  // 🛡️ 상태 불일치 방지 - AI 에이전트가 시스템 중지 시 비활성화되는지 확인 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    // 🚨 시스템이 시작된 후에만 상태 불일치 감지
    if (isSystemStarted && !aiAgent.isEnabled) {
      debug.warn(
        '⚠️ 상태 불일치 감지: 시스템이 활성화되었지만 AI 에이전트가 비활성화됨'
      );
    }
  }, [isMounted, isSystemStarted, aiAgent.isEnabled]);

  // 시스템 타이머 업데이트 (클라이언트에서만) - 깜박임 방지 최적화
  useEffect(() => {
    if (!isMounted) return;

    if (isSystemStarted) {
      const updateTimer = () => {
        const remaining = getSystemRemainingTime();
        // 시간이 실제로 변경된 경우에만 상태 업데이트 (초 단위)
        const remainingSeconds = Math.floor(remaining / 1000);
        const currentSeconds = Math.floor(systemTimeRemaining / 1000);
        
        if (remainingSeconds !== currentSeconds) {
          setSystemTimeRemaining(remaining);
        }
      };

      updateTimer(); // 즉시 실행
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else {
      // 시스템이 정지되면 즉시 0으로 설정하지 않고 부드럽게 처리
      if (systemTimeRemaining > 0) {
        const fadeTimer = setTimeout(() => setSystemTimeRemaining(0), 100);
        return () => clearTimeout(fadeTimer);
      }
      return;
    }
  }, [isMounted, isSystemStarted, getSystemRemainingTime, systemTimeRemaining]);

  // 카운트다운 중지 함수 (깜빡임 방지 개선)
  const stopSystemCountdown = useCallback(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setSystemStartCountdown(0);
    setIsSystemStarting(false); // 시스템 시작 상태도 초기화
  }, [countdownTimer]);

  // 컴포넌트 언마운트 시 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  // ESC 키로 카운트다운 취소
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && systemStartCountdown > 0) {
        stopSystemCountdown();
      }
    };

    if (systemStartCountdown > 0) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }

    // 모든 코드 경로에서 값을 반환해야 함
    return undefined;
  }, [systemStartCountdown, stopSystemCountdown]);

  // 시간 포맷 함수
  const _formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // AI 단어에 그라데이션 애니메이션 적용하는 함수
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;

    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        return (
          <motion.span
            key={index}
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text font-bold text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  // 🚀 백그라운드 시스템 시작 함수 (사용자는 로딩 페이지에서 대기)
  const handleSystemStartBackground = useCallback(async () => {
    debug.log('🔄 백그라운드에서 시스템 시작 프로세스 실행');

    try {
      // 1. 다중 사용자 상태 업데이트
      await startMultiUserSystem();

      // 2. 데이터 동기화 및 백업 체크 (시스템 시작 시에만)
      debug.log('🔄 시스템 시작 시 데이터 동기화 중...');
      try {
        const syncResponse = await fetch('/api/system/sync-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggerType: 'system-start' }),
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          debug.log('✅ 데이터 동기화 완료:', syncResult);
        } else {
          debug.warn('⚠️ 데이터 동기화 실패, 시스템 계속 진행');
        }
      } catch (syncError) {
        debug.warn('⚠️ 데이터 동기화 중 오류:', syncError);
      }

      // 3. 기존 시스템 시작 로직 실행
      await startSystem();

      // 4. 시스템 상태 새로고침
      await refreshSystemStatus();

      debug.log('✅ 백그라운드 시스템 시작 완료');
    } catch (error) {
      debug.error('❌ 백그라운드 시스템 시작 실패:', error);
      setIsSystemStarting(false); // 실패 시 상태 초기화
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록
    }
  }, [startMultiUserSystem, startSystem, refreshSystemStatus]);

  // 🚀 시스템 시작 카운트다운 함수 (바로 로딩 페이지 이동)
  const startSystemCountdown = useCallback(() => {
    setSystemStartCountdown(3); // 3초 카운트다운
    setIsSystemStarting(false); // 카운트다운 시작 시 시스템 시작 상태 초기화

    const timer = setInterval(() => {
      setSystemStartCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          debug.log('🚀 카운트다운 완료 - 로딩 페이지로 이동');

          // 백그라운드에서 시스템 시작 프로세스 실행 (비동기)
          void handleSystemStartBackground();

          // 즉시 로딩 페이지로 이동
          router.push('/system-boot');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownTimer(timer);
  }, [router, handleSystemStartBackground]);

  // 🚀 기존 시스템 시작 함수 (직접 호출용 - 호환성 유지)
  const _handleSystemStart = useCallback(async () => {
    if (isLoading || isSystemStarting) return;

    debug.log('🚀 직접 시스템 시작 프로세스 시작');
    setIsSystemStarting(true);

    try {
      await handleSystemStartBackground();

      // 성공 시 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      debug.error('❌ 시스템 시작 실패:', error);
      setIsSystemStarting(false); // 실패 시 상태 초기화
    }
  }, [isLoading, isSystemStarting, handleSystemStartBackground, router]);

  // 대시보드 클릭 핸들러
  const handleDashboardClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // 시스템 토글 함수 (깜빡임 방지 개선)
  const handleSystemToggle = useCallback(async () => {
    // 로딩 중이거나 시스템 시작 중이면 무시
    if (isLoading || isSystemStarting) return;

    // 카운트다운 중이면 취소
    if (systemStartCountdown > 0) {
      stopSystemCountdown();
      return;
    }

    // 다중 사용자 상태에 따른 동작 결정
    if (multiUserStatus?.isRunning || isSystemStarted) {
      // 시스템이 이미 실행 중이면 대시보드로 이동
      handleDashboardClick();
    } else {
      // 시스템이 정지 상태면 카운트다운 시작
      startSystemCountdown();
    }
  }, [
    isLoading,
    isSystemStarting,
    systemStartCountdown,
    multiUserStatus?.isRunning,
    isSystemStarted,
    stopSystemCountdown,
    startSystemCountdown,
    handleDashboardClick,
  ]);

  // 📊 버튼 텍스트와 상태 결정 (진행바 효과로 개선)
  const getButtonConfig = useMemo(
    () => () => {
      // 1. 카운트다운 중 (최우선)
      if (systemStartCountdown > 0) {
        return {
          text: `시작 취소 (${systemStartCountdown}초)`,
          icon: <X className="h-5 w-5" />,
          className:
            'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
        };
      }

      // 2. 시스템 시작 중 (카운트다운 완료 후)
      if (isSystemStarting) {
        return {
          text: '시스템 시작 중...',
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          className:
            'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
        };
      }

      // 3. 일반 로딩 상태
      if (isLoading || statusLoading) {
        return {
          text: '시스템 초기화 중...',
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          className:
            'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
        };
      }

      // 4. 시스템 실행 중 (대시보드 이동)
      if (multiUserStatus?.isRunning || isSystemStarted) {
        return {
          text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
          icon: <BarChart3 className="h-5 w-5" />,
          className:
            'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
        };
      }

      // 5. 기본 상태 (시스템 시작 대기)
      return {
        text: '🚀 시스템 시작',
        icon: <Play className="h-5 w-5" />,
        className:
          'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
      };
    },
    [
      systemStartCountdown,
      isSystemStarting,
      isLoading,
      statusLoading,
      multiUserStatus?.isRunning,
      multiUserStatus?.userCount,
      isSystemStarted,
    ]
  );

  // 로그아웃 처리는 UnifiedProfileHeader에서 처리됨

  // 🔄 클라이언트 마운트 전에는 로딩 표시
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-white" />
            <p className="text-white/80">페이지 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 인증 로딩 중이고 아직 인증 체크가 안됐으면 대기
  if (authLoading && !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-white" />
            <p className="text-white/80">인증 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (authChecked && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-white" />
            <p className="text-white/80">로그인 페이지로 이동 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const buttonConfig = getButtonConfig();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
      data-system-active={isSystemStarted ? 'true' : 'false'}
    >
      {/* 웨이브 파티클 배경 효과 */}
      <div className="wave-particles"></div>

      {/* 헤더 */}
      <header className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          {/* AI 컨셉 아이콘 - 통합 AI 카드 스타일 애니메이션 적용 */}
          <motion.div
            className="relative flex h-10 w-10 items-center justify-center rounded-lg shadow-lg"
            animate={
              aiAgent.isEnabled
                ? {
                    background: [
                      'linear-gradient(135deg, #a855f7, #ec4899)',
                      'linear-gradient(135deg, #ec4899, #06b6d4)',
                      'linear-gradient(135deg, #06b6d4, #a855f7)',
                    ],
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                    boxShadow: [
                      '0 4px 15px rgba(168, 85, 247, 0.3)',
                      '0 6px 20px rgba(236, 72, 153, 0.4)',
                      '0 4px 15px rgba(6, 182, 212, 0.3)',
                      '0 6px 20px rgba(168, 85, 247, 0.4)',
                    ],
                  }
                : isSystemStarted
                  ? {
                      background: [
                        'linear-gradient(135deg, #10b981, #059669)',
                        'linear-gradient(135deg, #059669, #047857)',
                        'linear-gradient(135deg, #047857, #10b981)',
                      ],
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 4px 15px rgba(16, 185, 129, 0.3)',
                        '0 6px 20px rgba(5, 150, 105, 0.4)',
                        '0 4px 15px rgba(16, 185, 129, 0.3)',
                      ],
                    }
                  : {
                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                      scale: 1,
                      rotate: 0,
                    }
            }
            transition={{
              duration: aiAgent.isEnabled ? 2 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.15,
              transition: { duration: 0.3 },
            }}
          >
            {/* AI 활성화 시 회전 아이콘 */}
            {aiAgent.isEnabled ? (
              <motion.i
                className="fas fa-server text-lg text-white"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                aria-hidden="true"
              />
            ) : (
              <i
                className="fas fa-server text-lg text-white"
                aria-hidden="true"
              />
            )}
          </motion.div>

          {/* 브랜드 텍스트 */}
          <div>
            <h1 className="text-xl font-bold text-white">OpenManager</h1>
            <p className="text-xs text-white/70">
              {aiAgent.isEnabled && !isSystemStarted
                ? 'AI 독립 모드'
                : aiAgent.isEnabled && isSystemStarted
                  ? 'AI + 시스템 통합 모드'
                  : isSystemStarted
                    ? '기본 모니터링'
                    : '시스템 정지'}
            </p>
          </div>
        </div>

        {/* 오른쪽 헤더 컨트롤 */}
        <div className="flex items-center gap-3">
          {/* 통합 프로필 헤더 */}
          <UnifiedProfileHeader />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 mx-auto px-6 pt-8">
        {/* 타이틀 섹션 */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {renderTextWithAIGradient('AI')}
            </span>{' '}
            <span className="font-semibold text-white">기반</span>{' '}
            <span className="text-white">서버 모니터링</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            <span className="text-sm text-white/60">
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </motion.div>

        {/* 제어 패널 */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {!isSystemStarted ? (
            /* 시스템 중지 상태 - 대시보드 버튼 중심으로 변경 */
            <div className="mx-auto max-w-2xl text-center">
              {/* 메인 제어 버튼들 */}
              <div className="mb-6 flex flex-col items-center space-y-4">
                {isGitHubUser ? (
                  <>
                    {/* GitHub 인증 사용자 - 시스템 시작 버튼 표시 */}
                    <motion.button
                      onClick={handleSystemToggle}
                      disabled={isLoading || isSystemStarting}
                      className={`flex h-16 w-64 items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 ${buttonConfig.className}`}
                      whileHover={
                        !isLoading && systemStartCountdown === 0
                          ? { scale: 1.05 }
                          : {}
                      }
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {/* 카운트다운 진행바 */}
                      {systemStartCountdown > 0 && (
                        <motion.div
                          className="absolute inset-0 overflow-hidden rounded-xl"
                          style={{ transformOrigin: 'left' }}
                        >
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3, ease: 'linear' }}
                          />
                          <motion.div
                            className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{
                              x: ['-100%', '100%'],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />
                        </motion.div>
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        {buttonConfig.icon}
                        <span className="text-lg">{buttonConfig.text}</span>
                      </div>
                    </motion.button>

                    {/* 상태 안내 */}
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-medium opacity-80 transition-all duration-300 ${
                          systemStartCountdown > 0
                            ? 'text-orange-300'
                            : isSystemStarting
                              ? 'text-purple-300'
                              : multiUserStatus?.isRunning
                                ? 'text-green-300'
                                : 'text-white'
                        }`}
                      >
                        {systemStartCountdown > 0
                          ? '⚠️ 시작 예정 - 취소하려면 클릭'
                          : isSystemStarting
                            ? '🚀 시스템 부팅 중...'
                            : multiUserStatus?.isRunning || isSystemStarted
                              ? (() => {
                                  // 자동 종료 시간 계산
                                  const shutdownTime = localStorage.getItem(
                                    'system_auto_shutdown'
                                  );
                                  if (shutdownTime) {
                                    const timeLeft = Math.max(
                                      0,
                                      Math.floor(
                                        (parseInt(shutdownTime) - Date.now()) /
                                          60000
                                      )
                                    );
                                    return `✅ 시스템 가동 중 (${timeLeft}분 후 자동 종료)`;
                                  }
                                  return `✅ 시스템 가동 중 - 대시보드로 이동`;
                                })()
                              : '클릭하여 시작하기'}
                      </span>
                      {systemStartCountdown > 0 && (
                        <span className="text-xs text-white/60">
                          또는 ESC 키를 눌러 취소
                        </span>
                      )}
                    </div>

                    {/* 시작 버튼 안내 아이콘 - 시스템 정지 상태일 때만 표시 */}
                    {!systemStartCountdown &&
                      !isSystemStarting &&
                      !multiUserStatus?.isRunning &&
                      !isSystemStarted && (
                        <div className="mt-2 flex justify-center">
                          <span className="finger-pointer-primary">👆</span>
                        </div>
                      )}
                  </>
                ) : (
                  /* 게스트 사용자 - 안내 메시지 표시 */
                  <div className="text-center">
                    <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
                      <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        GitHub 로그인이 필요합니다
                      </h3>
                      <p className="mb-4 text-sm text-blue-100">
                        시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수
                        있습니다.
                      </p>
                      <motion.button
                        onClick={() => router.push('/login')}
                        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        로그인 페이지로 이동
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-400">
                      게스트 모드에서는 읽기 전용 기능만 사용 가능합니다
                    </p>
                  </div>
                )}
              </div>

              {/* AI 어시스턴트 안내 */}
              <div className="flex justify-center text-sm">
                <div className="max-w-md rounded-lg bg-white/5 p-3">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <Bot className="h-4 w-4 text-purple-400" />
                    <span className="font-semibold">AI 어시스턴트</span>
                  </div>
                  <p className="text-center text-white/70">
                    시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <motion.div
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* 대시보드 버튼 - 중앙 배치 */}
              <div className="mb-6 flex justify-center">
                <div className="flex flex-col items-center">
                  {isGitHubUser ? (
                    <motion.button
                      onClick={handleDashboardClick}
                      className="flex h-16 w-64 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-600 font-semibold text-white shadow-xl transition-all duration-200 hover:bg-emerald-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-lg">📊 대시보드 열기</span>
                    </motion.button>
                  ) : (
                    <div className="text-center">
                      <p className="mb-2 text-sm text-gray-400">
                        시스템이 다른 사용자에 의해 실행 중입니다
                      </p>
                      <p className="text-xs text-gray-500">
                        GitHub 로그인 후 대시보드 접근이 가능합니다
                      </p>
                    </div>
                  )}

                  {/* 안내 아이콘 */}
                  <div className="mt-2 flex justify-center">
                    <span className="finger-pointer-dashboard">👆</span>
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className="text-xs text-white opacity-70">
                      클릭하세요
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-white/60">
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을
                확인하세요.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 기능 카드 그리드 */}
        <div className="mb-12">
          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className="mt-8 border-t border-white/20 pt-6 text-center">
          <p className="text-white/70">
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 왼쪽 하단 실행중 기능들과 토스트 알람 제거됨 */}
    </div>
  );
}
