/**
 * 🏠 OpenManager 메인 페이지 - Commit 18a89a4 UI 복원
 *
 * GitHub OAuth + 게스트 로그인 지원 + 원래 UI 구조 복원
 * 웨이브 파티클 배경, 고급 애니메이션, 카운트다운 시스템 복원
 */

'use client';

// React import 제거 - Next.js 15 자동 JSX Transform 사용
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useInitialAuth } from '@/hooks/useInitialAuth';
import { useProfileSecurity } from '@/components/profile/hooks/useProfileSecurity';
import { BarChart3, Bot, Loader2, Play, X, LogIn } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import debug from '@/utils/debug';
import { vercelConfig, debugWithEnv } from '@/utils/vercel-env';
import FeatureCardsGrid from '@/components/home/FeatureCardsGrid';

// framer-motion 제거 - CSS 애니메이션 사용

function Home() {
  const router = useRouter();
  const pathname = usePathname();
  
  // 통합 초기화 훅 사용 (5-6초 지연 문제 해결)
  const {
    isLoading: authLoading,
    isAuthenticated,
    user: currentUser,
    isGitHubConnected: isGitHubUser,
    error: authError,
    isReady: authReady,
    shouldRedirect,
    getLoadingMessage,
    retry: retryAuth
  } = useInitialAuth();
  
  // 관리자 모드 보안 훅 (isAdminMode만 필요)
  const { isAdminMode } = useProfileSecurity();
  
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

  // 시스템 상태 동기화 debounce를 위한 ref
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 이전 상태 추적을 위한 ref (추가 안정성)
  const prevRunningRef = useRef<boolean | null>(null);

  // 🚨 stableFunctionsRef 패턴 제거 - React Error #310 근본 해결
  // React 권장 패턴: 훅 함수를 useEffect 의존성에 직접 포함

  // 상태 안내 메시지 메모이제이션 (JSX에서 분리하여 성능 최적화)
  const statusInfo = useMemo(() => {
    if (systemStartCountdown > 0) {
      return {
        color: 'text-orange-300',
        message: '⚠️ 시작 예정 - 취소하려면 클릭',
        showEscHint: true
      };
    }
    if (isSystemStarting) {
      return {
        color: 'text-purple-300',
        message: '🚀 시스템 부팅 중...',
        showEscHint: false
      };
    }
    if (multiUserStatus?.isRunning || isSystemStarted) {
      const shutdownTime = typeof window !== 'undefined' ? localStorage.getItem('system_auto_shutdown') : null;
      let message = '✅ 시스템 가동 중 - 대시보드로 이동';
      if (shutdownTime) {
        const timeLeft = Math.max(0, Math.floor((parseInt(shutdownTime) - Date.now()) / 60000));
        message = `✅ 시스템 가동 중 (${timeLeft}분 후 자동 종료)`;
      }
      return {
        color: 'text-green-300',
        message,
        showEscHint: false
      };
    }
    return {
      color: 'text-white',
      message: '클릭하여 시작하기',
      showEscHint: false
    };
  }, [systemStartCountdown, isSystemStarting, multiUserStatus?.isRunning, isSystemStarted]);

  // 🎯 분할된 useEffect 시스템 - React Error #310 완전 해결

  // 1️⃣ 클라이언트 마운트 처리 (독립적)
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
      debug.log(debugWithEnv('✅ 클라이언트 마운트 완료'));
    }, vercelConfig.mountDelay);

    return () => clearTimeout(mountTimer);
  }, []); // 의존성 없음 - 마운트 시 한 번만 실행

  // 2️⃣ 시스템 상태 동기화 처리 (독립적)
  useEffect(() => {
    if (!authReady || !multiUserStatus) return;

    const currentRunning = multiUserStatus.isRunning;
    if (prevRunningRef.current !== currentRunning) {
      prevRunningRef.current = currentRunning;
      
      // 3초 debounce로 시스템 상태 동기화
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        const needsStart = multiUserStatus.isRunning && !isSystemStarted;
        const needsStop = !multiUserStatus.isRunning && isSystemStarted;
        
        if (needsStart) {
          debug.log(debugWithEnv('🔄 시스템이 다른 사용자에 의해 시작됨'));
          startSystem();
        } else if (needsStop) {
          debug.log(debugWithEnv('🔄 시스템이 다른 사용자에 의해 정지됨'));
          stopSystem();
        }
      }, vercelConfig.syncDebounce);
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [authReady, multiUserStatus?.isRunning, isSystemStarted, startSystem, stopSystem]); // 함수 의존성 복원하여 stale closure 방지

  // 3️⃣ 시스템 시작 상태 동기화 (독립적)
  useEffect(() => {
    if (!multiUserStatus) return;
    
    const currentStarting = multiUserStatus.isStarting || false;
    if (currentStarting !== isSystemStarting) {
      debug.log(debugWithEnv(`🔄 시스템 시작 상태 업데이트: ${isSystemStarting} → ${currentStarting}`));
      setIsSystemStarting(currentStarting);
    }
  }, [multiUserStatus?.isStarting, isSystemStarting]);

  // 4️⃣ 인증 에러 재시도 처리 (독립적)
  useEffect(() => {
    if (!authError || !authReady) return;

    debug.error(debugWithEnv('❌ 인증 에러 발생'), authError);
    const authRetryTimeout = setTimeout(() => {
      debug.log(debugWithEnv(`🔄 인증 재시도 시작 (${vercelConfig.authRetryDelay/1000}초 후)`));
      retryAuth();
    }, vercelConfig.authRetryDelay);

    return () => clearTimeout(authRetryTimeout);
  }, [authError, authReady, retryAuth]); // 함수 의존성 복원하여 stale closure 방지

  // 5️⃣ 시스템 타이머 업데이트 (독립적)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (isSystemStarted) {
        const remaining = getSystemRemainingTime();
        setSystemTimeRemaining(remaining);
      } else {
        setSystemTimeRemaining(0);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isSystemStarted, getSystemRemainingTime]); // 함수 의존성 복원하여 stale closure 방지

  // 기존 인증 로직은 useInitialAuth 훅으로 대체됨

  // 리다이렉션은 useInitialAuth 훅에서 자동 처리됨

  // ✅ 모든 타이머 로직은 위 마스터 타이머에서 통합 처리됨

  // ✅ stopSystemCountdown useCallback 제거 - 순환 참조 해결

  // 컴포넌트 언마운트 시 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  // ESC 키로 카운트다운 취소 - 순환 참조 제거
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && systemStartCountdown > 0) {
        // 직접 로직 실행으로 순환 참조 제거
        if (countdownTimer) {
          clearInterval(countdownTimer);
          setCountdownTimer(null);
        }
        setSystemStartCountdown(0);
        setIsSystemStarting(false);
      }
    };

    if (systemStartCountdown > 0) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }

    return undefined;
  }, [systemStartCountdown, countdownTimer]); // stopSystemCountdown 의존성 제거

  // 시간 포맷 함수
  const _formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // AI 단어에 그라데이션 애니메이션 적용하는 함수 - SSR 안전성 보장
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;

    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        // SSR에서는 정적 스타일, 클라이언트에서는 애니메이션 적용
        if (!isMounted) {
          return (
            <span
              key={index}
              className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text font-bold text-transparent"
            >
              {part}
            </span>
          );
        }
        
        return (
          <span
            key={index}
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text font-bold text-transparent"
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // ✅ handleSystemStartBackground, startSystemCountdown useCallback 제거 - 순환 참조 해결
  // 로직이 handleSystemToggle에 직접 통합됨

  // ✅ _handleSystemStart, handleDashboardClick useCallback 제거 - 순환 참조 해결
  // 로직이 handleSystemToggle에 직접 통합됨

  // 시스템 토글 함수 (깜빡임 방지 개선)
  const handleSystemToggle = useCallback(async () => {
    // 로딩 중이거나 시스템 시작 중이면 무시
    if (isLoading || isSystemStarting) return;

    // 카운트다운 중이면 취소 - 직접 로직 실행으로 순환 참조 제거
    if (systemStartCountdown > 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        setCountdownTimer(null);
      }
      setSystemStartCountdown(0);
      setIsSystemStarting(false);
      return;
    }

    // 다중 사용자 상태에 따른 동작 결정
    if (multiUserStatus?.isRunning || isSystemStarted) {
      // 시스템이 이미 실행 중이면 대시보드로 이동 - 직접 로직 실행
      if (pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    } else {
      // 시스템이 정지 상태면 카운트다운 시작 - 직접 로직 실행
      setSystemStartCountdown(3);
      setIsSystemStarting(false);

      const timer = setInterval(() => {
        setSystemStartCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            debug.log('🚀 카운트다운 완료 - 로딩 페이지로 이동');
            
            // 백그라운드에서 시스템 시작 (비동기)
            void (async () => {
              try {
                await startMultiUserSystem();
                await startSystem();
              } catch (error) {
                debug.error('❌ 시스템 시작 실패:', error);
                setIsSystemStarting(false);
              }
            })();

            router.push('/system-boot');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCountdownTimer(timer);
    }
  }, [
    isLoading,
    isSystemStarting,
    systemStartCountdown,
    multiUserStatus?.isRunning,
    isSystemStarted,
    countdownTimer,
    pathname,
    router,
    startMultiUserSystem,
    startSystem
    // 함수 의존성 복원하여 stale closure 방지 - React Error #310 근본 해결
  ]);

  // 📊 버튼 설정 메모이제이션 최적화 - 렌더링 성능 향상 + SSR 안전성
  const buttonConfig = useMemo(() => {
    // SSR 안전성: 클라이언트 마운트 전에는 아이콘 없이 렌더링
    const getIcon = (IconComponent: any, className: string) => {
      if (!isMounted) return null;
      return <IconComponent className={className} />;
    };

    // 1. 카운트다운 중 (최우선)
    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: getIcon(X, "h-5 w-5"),
        className:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
        disabled: false,
      };
    }

    // 2. 시스템 시작 중 (카운트다운 완료 후)
    if (isSystemStarting) {
      return {
        text: '시스템 시작 중...',
        icon: getIcon(Loader2, "h-5 w-5 animate-spin"),
        className:
          'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
        disabled: true,
      };
    }

    // 3. 일반 로딩 상태
    if (isLoading || statusLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: getIcon(Loader2, "h-5 w-5 animate-spin"),
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
        disabled: true,
      };
    }

    // 4. 시스템 실행 중 (대시보드 이동)
    if (multiUserStatus?.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
        icon: getIcon(BarChart3, "h-5 w-5"),
        className:
          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
        disabled: false,
      };
    }

    // 5. 기본 상태 (시스템 시작 대기)
    return {
      text: '🚀 시스템 시작',
      icon: getIcon(Play, "h-5 w-5"),
      className:
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
      disabled: false,
    };
  }, [
    isMounted, // SSR 안전성을 위한 의존성 추가
    systemStartCountdown,
    isSystemStarting,
    isLoading,
    statusLoading,
    multiUserStatus?.isRunning,
    multiUserStatus?.userCount,
    isSystemStarted,
  ]);

  // 로그아웃 처리는 UnifiedProfileHeader에서 처리됨

  // 🔄 통합 로딩 상태 - 안정된 환경 감지
  const shouldShowLoading = !isMounted || authLoading || shouldRedirect;
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div
            >
              <Loader2 className="mx-auto mb-4 h-8 w-8 text-white" />
            </div>
            <p className="text-white/90 font-medium">
              {getLoadingMessage()} ({vercelConfig.envLabel} 환경)
            </p>
            {authError && (
              <div className="mt-4 max-w-md mx-auto">
                <p className="text-red-400 text-sm mb-2">인증 오류: {authError}</p>
                <button 
                  onClick={retryAuth}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}
            <div className="mt-2 text-xs text-white/50">
              {vercelConfig.envLabel} 서버에서 로딩 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 인증이 완료되지 않았으면 대기 - 안정된 환경 처리
  if (!authReady || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="h-4 w-4 mx-auto mb-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm">리다이렉션 중... ({vercelConfig.envLabel})</div>
        </div>
      </div>
    );
  }

  // buttonConfig is now directly available as a memoized object

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      data-system-active={isSystemStarted ? 'true' : 'false'}
    >
      {/* 웨이브 파티클 배경 효과 */}
      <div className="wave-particles"></div>

      {/* 헤더 */}
      <header className="relative z-50 flex items-center justify-between p-6">
        <button 
          className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => router.push('/')}
          aria-label="홈으로 이동"
        >
          {/* AI 컨셉 아이콘 - 통합 AI 카드 스타일 애니메이션 적용 */}
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-lg shadow-lg"
            style={{
              background: aiAgent.isEnabled 
                ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                : isSystemStarted
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6b7280, #4b5563)'
            }}
          >
            {/* 시스템 활성화 또는 AI 활성화 시 회전 아이콘 */}
            {(aiAgent.isEnabled || isSystemStarted) ? (
              <i
                className="fas fa-server text-lg text-white animate-spin"
                aria-hidden="true"
              />
            ) : (
              <i
                className="fas fa-server text-lg text-white"
                aria-hidden="true"
              />
            )}
          </div>

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
        </button>

        {/* 오른쪽 헤더 컨트롤 */}
        <div className="flex items-center gap-3">
          {/* 통합 프로필 헤더 */}
          <UnifiedProfileHeader />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 mx-auto px-6 pt-8">
        {/* 타이틀 섹션 */}
        <div
          className="mb-12 text-center"
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
        </div>

        {/* 제어 패널 */}
        <div
          className="mb-12"
        >
          {!isSystemStarted ? (
            <div className="mx-auto max-w-2xl text-center">
              {/* 시스템 중지 상태 - 대시보드 버튼 중심으로 변경 */}
              {/* 메인 제어 버튼들 */}
              <div className="mb-6 flex flex-col items-center space-y-4">
                {isGitHubUser || isAdminMode ? (
                  <>
                    {/* GitHub 인증 사용자 - 시스템 시작 버튼 표시 */}
                    {/* 현재 사용자: {currentUser?.name || currentUser?.email || 'Unknown'} */}
                    <button
                      onClick={handleSystemToggle}
                      disabled={buttonConfig.disabled}
                      className={`flex h-16 w-64 items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 ${buttonConfig.className}`}
                    >
                      {/* 카운트다운 진행바 */}
                      {systemStartCountdown > 0 && (
                        <div
                          className="absolute inset-0 overflow-hidden rounded-xl"
                          style={{ transformOrigin: 'left' }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40"
                          />
                          <div
                            className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          />
                        </div>
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        {buttonConfig.icon}
                        <span className="text-lg">{buttonConfig.text}</span>
                      </div>
                    </button>

                    {/* 상태 안내 - 메모이제이션으로 렌더링 최적화 - 컴포넌트 레벨로 이동 */}
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <span className={`text-sm font-medium opacity-80 transition-all duration-300 ${statusInfo.color}`}>
                        {statusInfo.message}
                      </span>
                      {statusInfo.showEscHint && (
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
                  <div className="text-center">
                    {/* 게스트 사용자 - 안내 메시지 표시 */}
                    <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
                      {isMounted && <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />}
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        GitHub 로그인이 필요합니다
                      </h3>
                      <p className="mb-4 text-sm text-blue-100">
                        시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수
                        있습니다.
                      </p>
                      <button
                        onClick={() => router.push('/login')}
                        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        로그인 페이지로 이동
                      </button>
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
                    {isMounted && <Bot className="h-4 w-4 text-purple-400" />}
                    <span className="font-semibold">AI 어시스턴트</span>
                  </div>
                  <p className="text-center text-white/70">
                    시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="mx-auto max-w-4xl text-center"
            >
              {/* 시스템 활성 상태 */}
              {/* 대시보드 버튼 - 중앙 배치 */}
              <div className="mb-6 flex justify-center">
                <div className="flex flex-col items-center">
                  {isGitHubUser || isAdminMode ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="flex h-16 w-64 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-600 font-semibold text-white shadow-xl transition-all duration-200 hover:bg-emerald-700"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-lg">📊 대시보드 열기</span>
                    </button>
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
            </div>
          )}
        </div>

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

// 클라이언트 컴포넌트로 export (use client 디렉티브로 충분)
export default Home;