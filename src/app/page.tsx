'use client';

import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { BarChart3, Bot, Loader2, Play, X, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// 토스트 알림과 인라인 피드백 시스템 제거됨

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-32 bg-white/10 rounded-lg animate-pulse' />
        ))}
      </div>
    ),
  }
);

// 토스트 알림 훅 제거됨

export default function Home() {
  const router = useRouter();
  const {
    isSystemStarted,
    aiAgent,
    adminMode,
    startSystem,
    stopSystem,
    logout,
    getSystemRemainingTime,
  } = useUnifiedAdminStore();

  // 📊 다중 사용자 시스템 상태 관리 (새로 추가)
  const {
    status: multiUserStatus,
    isLoading: statusLoading,
    startSystem: startMultiUserSystem,
  } = useSystemStatus();

  // 토스트 알림 기능 제거됨
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🚀 시스템 시작 카운트다운 상태
  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 🔄 클라이언트 마운트 상태 (hydration 문제 방지)
  const [isMounted, setIsMounted] = useState(false);

  // 🔄 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true);

    // 🔥 홈페이지 접속 시 MCP 서버 웜업 실행 (배포된 사이트와 일치)
    const performMCPWarmup = async () => {
      try {
        // 🚨 비상 모드 체크 - 웜업 차단
        const isEmergencyMode =
          process.env.NEXT_PUBLIC_EMERGENCY_MODE === 'true';
        if (isEmergencyMode) {
          console.log('🚨 비상 모드 - MCP 웜업 차단');
          return;
        }

        console.log('🔥 MCP 서버 웜업 시작 (백그라운드)');

        // 캐시 확인 - 세션당 한 번만 실행
        const warmupKey = 'mcp-warmup-session';
        const lastWarmup = sessionStorage.getItem(warmupKey);
        const now = Date.now();

        if (lastWarmup && now - parseInt(lastWarmup) < 10 * 60 * 1000) {
          console.log('📦 MCP 웜업 캐시 사용 (10분 이내)');
          return;
        }

        // 백그라운드에서 조용히 웜업 실행
        const response = await fetch('/api/mcp/warmup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRefresh: false }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ MCP 웜업 완료: ${data.responseTime}ms`);
          sessionStorage.setItem(warmupKey, now.toString());
        } else {
          console.warn(`⚠️ MCP 웜업 실패: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ MCP 웜업 중 오류 (무시됨):', error);
      }
    };

    // 🚀 비동기 웜업 실행 (백그라운드)
    performMCPWarmup();
  }, []);

  // 🔧 상태 변화 디버깅 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    console.log('🔍 Home - 시스템 상태 변화:', {
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
      console.warn(
        '⚠️ 상태 불일치 감지: 시스템이 활성화되었지만 AI 에이전트가 비활성화됨'
      );
    }
  }, [isMounted, isSystemStarted, aiAgent.isEnabled]);

  // 시스템 타이머 업데이트 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    if (isSystemStarted) {
      const updateTimer = () => {
        const remaining = getSystemRemainingTime();
        setSystemTimeRemaining(remaining);
      };

      updateTimer(); // 즉시 실행
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else {
      setSystemTimeRemaining(0);
    }
  }, [isMounted, isSystemStarted, getSystemRemainingTime]);

  // 컴포넌트 언마운트 시 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  // 시간 포맷 함수
  const formatTime = (ms: number) => {
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
            className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold'
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

  // 🚀 시스템 시작 카운트다운 함수
  const startSystemCountdown = () => {
    setSystemStartCountdown(5);
    const timer = setInterval(() => {
      setSystemStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSystemStart(); // 기존 시스템 시작 함수 호출
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownTimer(timer);
  };

  const stopSystemCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setSystemStartCountdown(0);
  };

  // 🚀 시스템 시작 함수 (다중 사용자 기능 통합)
  const handleSystemStart = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 1. 다중 사용자 상태 업데이트
      await startMultiUserSystem();

      // 2. 기존 시스템 시작 로직 실행
      await startSystem();

      console.log('🚀 시스템 시작 완료 (다중 사용자 지원)');

      // 3. 시스템 시작 완료 후 대시보드로 이동
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 시스템 토글 함수 (기존 로직 보존 + 다중 사용자 상태 연동)
  const handleSystemToggle = async () => {
    if (isLoading) return;

    if (systemStartCountdown > 0) {
      stopSystemCountdown();
      return;
    }

    // 🔄 다중 사용자 상태에 따른 동작 결정
    if (multiUserStatus.isRunning || isSystemStarted) {
      // 시스템이 이미 실행 중이면 대시보드로 이동
      handleDashboardClick();
    } else {
      // 시스템이 정지 상태면 카운트다운 시작
      startSystemCountdown();
    }
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  // 📊 버튼 텍스트와 상태 결정 (다중 사용자 기능 적용)
  const getButtonConfig = () => {
    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: <X className='w-5 h-5' />,
        className:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50',
      };
    }

    if (isLoading || statusLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: <Loader2 className='w-5 h-5 animate-spin' />,
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
      };
    }

    // 다중 사용자 상태 우선 확인
    if (multiUserStatus.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus.userCount}명)`,
        icon: <BarChart3 className='w-5 h-5' />,
        className:
          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
      };
    }

    return {
      text: '🚀 시스템 시작',
      icon: <Play className='w-5 h-5' />,
      className:
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
    };
  };

  // 🔄 클라이언트 마운트 전에는 기본 상태로 렌더링 (hydration 문제 방지)
  if (!isMounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin text-white mx-auto mb-4' />
            <p className='text-white/80'>시스템 초기화 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const buttonConfig = getButtonConfig();

  return (
    <div
      className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'
      data-system-active={isSystemStarted ? 'true' : 'false'}
    >
      {/* 웨이브 파티클 배경 효과 */}
      <div className='wave-particles'></div>

      {/* 헤더 */}
      <header className='relative z-10 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          {/* AI 컨셉 아이콘 - 통합 AI 카드 스타일 애니메이션 적용 */}
          <motion.div
            className='w-10 h-10 rounded-lg flex items-center justify-center relative shadow-lg'
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
                className='fas fa-server text-white text-lg'
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
                aria-hidden='true'
              />
            ) : (
              <i
                className='fas fa-server text-white text-lg'
                aria-hidden='true'
              />
            )}
          </motion.div>

          {/* 브랜드 텍스트 */}
          <div>
            <h1 className='text-xl font-bold text-white'>OpenManager</h1>
            <p className='text-xs text-white/70'>
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
        <div className='flex items-center gap-3'>
          {/* 프로필 컴포넌트 */}
          <UnifiedProfileComponent userName='사용자' />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className='relative z-10 container mx-auto px-6 pt-8'>
        {/* 타이틀 섹션 */}
        <motion.div
          className='text-center mb-12'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className='text-3xl md:text-5xl font-bold mb-4'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              {renderTextWithAIGradient('AI')}
            </span>{' '}
            <span className='font-semibold text-white'>기반</span>{' '}
            <span className='text-white'>서버 모니터링</span>
          </h1>
          <p className='text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-white/80'>
            <span className='text-sm text-white/60'>
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </motion.div>

        {/* 제어 패널 */}
        <motion.div
          className='mb-12'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {!isSystemStarted ? (
            /* 시스템 중지 상태 - 대시보드 버튼 중심으로 변경 */
            <div className='max-w-2xl mx-auto text-center'>
              {/* 시스템 종료 상태 안내 */}
              <div className='mb-6 p-4 rounded-xl border bg-red-500/20 border-red-400/30'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                  <span className='font-semibold text-red-200'>
                    시스템 종료됨
                  </span>
                </div>
                <p className='text-sm text-red-100'>
                  모든 서비스가 중지되었습니다.
                  <br />
                  <strong>
                    시스템 시작 버튼으로 전체 서비스를 활성화할 수 있습니다.
                  </strong>
                </p>
              </div>

              {/* 메인 제어 버튼들 */}
              <div className='flex flex-col items-center mb-6 space-y-4'>
                {/* 시스템 시작 버튼 */}
                <motion.button
                  onClick={handleSystemToggle}
                  disabled={isLoading}
                  className={`w-64 h-16 flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-200 border shadow-xl ${buttonConfig.className}`}
                  whileHover={!isLoading ? { scale: 1.05 } : {}}
                  whileTap={!isLoading ? { scale: 0.95 } : {}}
                >
                  {buttonConfig.icon}
                  <span className='text-lg'>{buttonConfig.text}</span>
                </motion.button>

                {/* 상태 안내 */}
                <div className='mt-2 flex justify-center'>
                  <span
                    className={`text-sm font-medium opacity-80 ${
                      systemStartCountdown > 0
                        ? 'text-orange-300 animate-pulse'
                        : multiUserStatus.isRunning
                          ? 'text-green-300'
                          : 'text-white'
                    }`}
                  >
                    {systemStartCountdown > 0
                      ? '⚠️ 시작 예정 - 취소하려면 클릭'
                      : multiUserStatus.isRunning
                        ? `✅ 시스템 가동 중 (${multiUserStatus.userCount}명 접속)`
                        : '클릭하여 시작하기'}
                  </span>
                </div>

                {/* 시작 버튼 안내 아이콘 - 시스템 정지 상태일 때만 표시 */}
                {!systemStartCountdown && !multiUserStatus.isRunning && (
                  <div className='mt-2 flex justify-center'>
                    <span className='finger-pointer-primary'>👆</span>
                  </div>
                )}
              </div>

              {/* 추가 설명 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='p-3 rounded-lg bg-white/5'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Zap className='w-4 h-4 text-blue-400' />
                    <span className='font-semibold'>시스템 시작 과정</span>
                  </div>
                  <p className='text-white/70'>
                    MCP 서버 Wake-up → 서버 시딩 → 시뮬레이션 → 대시보드 이동
                  </p>
                </div>
                <div className='p-3 rounded-lg bg-white/5'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Bot className='w-4 h-4 text-purple-400' />
                    <span className='font-semibold'>AI 어시스턴트</span>
                  </div>
                  <p className='text-white/70'>
                    시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <motion.div
              className='max-w-4xl mx-auto text-center'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* 시스템 활성 상태 안내 */}
              <div className='mb-6 p-4 rounded-xl border bg-green-500/20 border-green-400/30'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='font-semibold text-green-200'>
                    시스템 활성 - 남은 시간: {formatTime(systemTimeRemaining)}
                  </span>
                </div>
                <p className='text-sm text-green-100'>
                  모든 서비스가 정상 동작 중입니다. 대시보드에서 상세 정보를
                  확인하세요.
                </p>
              </div>

              {/* 대시보드 버튼 - 중앙 배치 */}
              <div className='flex justify-center mb-6'>
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleDashboardClick}
                    className='w-64 h-16 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50 shadow-xl'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className='w-5 h-5' />
                    <span className='text-lg'>📊 대시보드 열기</span>
                  </motion.button>

                  {/* 안내 아이콘 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='finger-pointer-dashboard'>👆</span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-xs opacity-70 text-white'>
                      클릭하세요
                    </span>
                  </div>
                </div>
              </div>

              <p className='text-white/60 text-xs mt-4 text-center'>
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을
                확인하세요.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 기능 카드 그리드 */}
        <div className='mb-12'>
          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className='mt-8 pt-6 border-t text-center border-white/20'>
          <p className='text-white/70'>
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 왼쪽 하단 실행중 기능들과 토스트 알람 제거됨 */}
    </div>
  );
}
