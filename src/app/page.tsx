'use client';

import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { useVercelSystemStore } from '@/stores/vercelSystemStore';
import { motion } from 'framer-motion';
import { Bot, Loader2, Play, Zap } from 'lucide-react';
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

  // 베르셀 친화적 시스템 상태 관리 (Redis 기반)
  const {
    systemInfo,
    startSystem,
    stopSystem,
    startPolling,
    stopPolling,
    isLoading: systemLoading,
    error: systemError,
    fetchSystemState,
  } = useVercelSystemStore();

  const isSystemStarted = systemInfo.state === 'RUNNING';
  const isSystemStarting = systemInfo.state === 'STARTING';

  // 토스트 알림 기능 제거됨
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🔄 클라이언트 마운트 상태 (hydration 문제 방지)
  const [isMounted, setIsMounted] = useState(false);

  // 🕐 카운트다운 상태 (점진적 수정용)
  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 🔄 클라이언트 마운트 감지
  useEffect(() => {
    // 즉시 클라이언트 마운트 처리
    setIsMounted(true);

    // 베르셀 시스템 폴링 시작 (상태 동기화)
    console.log('🔄 베르셀 시스템 폴링 시작 (상태 동기화)');

    // 초기 시스템 상태 가져오기 (비동기, 실패해도 무시)
    fetchSystemState().catch(error => {
      console.warn('⚠️ 초기 시스템 상태 확인 실패 (무시됨):', error);
    });

    startPolling();

    // 🔥 홈페이지 접속 시 Render 웜업만 실행 (시스템 시작과 무관)
    const performRenderWarmup = async () => {
      try {
        console.log('🔥 Render 서버 웜업 시작 (백그라운드)');

        // 캐시 확인 - 세션당 한 번만 실행
        const warmupKey = 'render-warmup-session';
        const lastWarmup = sessionStorage.getItem(warmupKey);
        const now = Date.now();

        if (lastWarmup && now - parseInt(lastWarmup) < 10 * 60 * 1000) {
          console.log('📦 Render 웜업 캐시 사용 (10분 이내)');
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
          console.log(`✅ Render 웜업 완료: ${data.responseTime}ms`);
          sessionStorage.setItem(warmupKey, now.toString());
        } else {
          console.warn(`⚠️ Render 웜업 실패: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Render 웜업 오류 (무시됨):', error);
      }
    };

    // 페이지 로드 3초 후 웜업 실행 (UI 렌더링 완료 후)
    const warmupTimer = setTimeout(performRenderWarmup, 3000);

    return () => {
      clearTimeout(warmupTimer);
      stopPolling(); // 페이지 언마운트 시 폴링 중지
    };
  }, [startPolling, stopPolling, fetchSystemState]);

  // 🔧 상태 변화 디버깅 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    console.log('🔍 Home - 시스템 상태 변화:', {
      systemState: systemInfo.state,
      isSystemStarted,
      activeUsers: systemInfo.activeUsers,
    });
  }, [isMounted, systemInfo.state, isSystemStarted]);

  // 🛡️ 상태 불일치 방지 - AI 에이전트가 시스템 중지 시 비활성화되는지 확인 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    // 🚨 시스템이 시작된 후에만 상태 불일치 감지
    // 베르셀 시스템에서는 AI 에이전트 체크 불필요
  }, [isMounted, isSystemStarted]);

  // 🛡️ 시스템 상태 일관성 확인 (베르셀 시스템용)
  useEffect(() => {
    if (!isMounted) return;

    // 시스템 상태 로깅 (aiAgent 관련 코드 제거)
    console.log('🔍 시스템 상태:', {
      state: systemInfo.state,
      started: isSystemStarted,
      starting: isSystemStarting,
      activeUsers: systemInfo.activeUsers,
    });
  }, [isMounted, systemInfo.state, isSystemStarted, isSystemStarting]);

  // 시스템 타이머 업데이트 (베르셀 시스템용) - Redis에서는 불필요
  useEffect(() => {
    if (!isMounted) return;

    // Redis 기반 시스템에서는 카운트다운이 없으므로 타이머 불필요
    setSystemTimeRemaining(0);
  }, [isMounted, isSystemStarted]);

  // 시간 포맷 함수 (초 단위를 분:초로 변환)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    console.log('🚀 시스템 시작 카운트다운 시작 (3초)');
    console.log('🚀 3초 후 시스템이 시작되고 로딩 페이지로 이동합니다!');

    setSystemStartCountdown(3);

    const timer = setInterval(() => {
      setSystemStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 3초 후 시스템 시작 및 로딩 페이지로 이동
          handleSystemStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);
  };

  // 🛑 카운트다운 중지 함수
  const stopSystemCountdown = () => {
    console.log('🛑 시스템 시작 카운트다운 취소');
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
    setSystemStartCountdown(0);
    setCountdownTimer(null);
    console.log('⏹️ 시스템 시작이 취소되었습니다.');
  };

  // 🚀 통합 시스템 시작 함수 (베르셀 시스템용)
  const handleSystemStart = async () => {
    try {
      console.log('🚀 베르셀 시스템 시작 실행');
      setIsLoading(true);
      // 베르셀 시스템 시작 (Redis 기반)
      await startSystem();
      console.log('✅ 시스템이 성공적으로 시작되었습니다.');
      router.push('/system-boot');
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 시스템 시작 토글 함수 (베르셀 시스템용)
  const handleSystemToggle = async () => {
    // 시스템 완전 중지 상태에서만 시작 가능
    if (systemStartCountdown === 0 && !isSystemStarted) {
      console.log('🚀 시스템 시작 카운트다운 시작!');
      startSystemCountdown();
    }
  };

  // 🛑 시스템 중지 함수 (베르셀 시스템용)
  const handleSystemStop = async () => {
    // 시스템이 실행 중이거나 시작 중일 때만 중지 가능
    if (systemInfo.state !== 'RUNNING' && systemInfo.state !== 'STARTING')
      return;

    try {
      console.log('🛑 베르셀 시스템 중지 요청');
      await stopSystem();
      console.log('✅ 시스템이 성공적으로 중지되었습니다.');
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
    }
  };

  // 📊 대시보드 이동 함수 (항상 접속 가능)
  const handleDashboardClick = () => {
    console.log('📊 로딩 페이지를 거쳐 대시보드로 이동');
    router.push('/system-boot');
  };

  // ✅ A 방식: 즉시 표시 - 조건부 렌더링 제거로 바로 메인 대시보드 표시

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
      {/* 웨이브 파티클 배경 효과 */}
      <div className='wave-particles'></div>

      {/* 헤더 */}
      <header className='relative z-10 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          {/* AI 컨셉 아이콘 - 통합 AI 카드 스타일 애니메이션 적용 */}
          <motion.div
            className='w-10 h-10 rounded-lg flex items-center justify-center relative shadow-lg'
            animate={
              isSystemStarted
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
                : isSystemStarting
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
              duration: isSystemStarted ? 2 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.15,
              transition: { duration: 0.3 },
            }}
          >
            {/* 시스템 활성화 시 회전 아이콘 */}
            {isSystemStarted ? (
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
              {isSystemStarted
                ? 'AI + 시스템 통합 모드 (베르셀 친화적)'
                : isSystemStarting
                  ? '시스템 초기화 중...'
                  : '시스템 완전 중지'}
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
          initial={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {systemStartCountdown === 0 && !isSystemStarted ? (
            /* 시스템 완전 중지 상태 - 첫 번째 사용자용 시스템 시작 버튼 */
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
                  className={`w-64 h-16 flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-200 border shadow-xl ${isLoading ? 'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50 hover:shadow-2xl'}`}
                  whileHover={!isLoading ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(34, 197, 94, 0.5)',
                      '0 0 0 10px rgba(34, 197, 94, 0)',
                      '0 0 0 0 rgba(34, 197, 94, 0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {isLoading ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : (
                    <>
                      <Play className='w-6 h-6' />
                      <span className='text-lg'>🚀 시스템 시작</span>
                    </>
                  )}
                </motion.button>

                {/* 상태 안내 */}
                <div className='mt-3 flex justify-center'>
                  <span className='text-2xl animate-wiggle text-yellow-400'>
                    👆
                  </span>
                </div>
                <div className='mt-2 flex justify-center'>
                  <span className='text-sm font-medium opacity-80 animate-point-bounce text-white'>
                    시스템을 시작하려면 버튼을 클릭하세요
                  </span>
                </div>
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
            /* 시스템 시작 중 또는 활성 상태 - 대시보드 접근 가능 */
            <motion.div
              className='max-w-4xl mx-auto text-center'
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* 시스템 상태 안내 */}
              <div
                className={`mb-6 p-4 rounded-xl border ${
                  systemStartCountdown > 0
                    ? 'bg-orange-500/20 border-orange-400/30'
                    : 'bg-green-500/20 border-green-400/30'
                }`}
              >
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      systemStartCountdown > 0
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                  ></div>
                  <span
                    className={`font-semibold ${
                      systemStartCountdown > 0
                        ? 'text-orange-200'
                        : 'text-green-200'
                    }`}
                  >
                    {systemStartCountdown > 0
                      ? `시스템 시작 중... (${systemStartCountdown}초 남음)`
                      : `시스템 활성 - 남은 시간: ${formatTime(systemTimeRemaining)}`}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    systemStartCountdown > 0
                      ? 'text-orange-100'
                      : 'text-green-100'
                  }`}
                >
                  {systemStartCountdown > 0
                    ? '시스템이 준비 중입니다. 대시보드에서 진행 상황을 확인하세요.'
                    : '모든 서비스가 정상 동작 중입니다. 대시보드에서 상세 정보를 확인하세요.'}
                </p>
              </div>

              {/* 제어 버튼들 - 2개를 가로로 배치 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 max-w-3xl mx-auto'>
                {/* AI 엔진 상태 표시 */}
                <div className='flex flex-col items-center'>
                  <motion.div
                    className={`w-60 h-16 flex items-center justify-center gap-3 text-white rounded-xl font-semibold border shadow-lg ${
                      systemStartCountdown > 0
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 shadow-orange-500/30'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400/50 shadow-green-500/30'
                    }`}
                    animate={{
                      scale: [1, 1.02, 1],
                      boxShadow:
                        systemStartCountdown > 0
                          ? [
                              '0 0 0 0 rgba(251, 146, 60, 0.6)',
                              '0 0 0 8px rgba(251, 146, 60, 0)',
                              '0 0 0 0 rgba(251, 146, 60, 0)',
                            ]
                          : [
                              '0 0 0 0 rgba(34, 197, 94, 0.6)',
                              '0 0 0 8px rgba(34, 197, 94, 0)',
                              '0 0 0 0 rgba(34, 197, 94, 0)',
                            ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: systemStartCountdown > 0 ? [0, 360] : 360,
                      }}
                      transition={{
                        duration: systemStartCountdown > 0 ? 1 : 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <Bot className='w-6 h-6' />
                    </motion.div>
                    <span className='text-white font-bold drop-shadow-lg text-lg'>
                      {systemStartCountdown > 0
                        ? '🔄 시스템 준비 중'
                        : '🧠 AI 엔진 활성'}
                    </span>
                  </motion.div>

                  {/* 상태 표시 */}
                  <div className='mt-3 flex justify-center'>
                    <span
                      className={`text-xl animate-pulse ${
                        systemStartCountdown > 0
                          ? 'text-orange-400'
                          : 'text-green-400'
                      }`}
                    >
                      {systemStartCountdown > 0 ? '⏳' : '✅'}
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span
                      className={`text-sm opacity-70 ${
                        systemStartCountdown > 0
                          ? 'text-orange-300'
                          : 'text-green-300'
                      }`}
                    >
                      {systemStartCountdown > 0
                        ? '시스템 초기화 중'
                        : '시스템 준비 완료'}
                    </span>
                  </div>
                </div>

                {/* 대시보드 버튼 (아이콘 제거, 텍스트만) */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleDashboardClick}
                    className='w-60 h-16 flex items-center justify-center rounded-xl font-bold text-lg transition-all duration-200 border bg-blue-600 hover:bg-blue-700 text-white border-blue-500/50 shadow-lg hover:shadow-xl'
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0.5)',
                        '0 0 0 8px rgba(59, 130, 246, 0)',
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <span className='text-white font-bold drop-shadow-lg'>
                      📊 대시보드 이동
                    </span>
                  </motion.button>

                  {/* 상태 표시 */}
                  <div className='mt-3 flex justify-center'>
                    <span className='text-blue-400 text-xl animate-pulse'>
                      🚀
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-blue-300 text-sm opacity-70'>
                      {systemStartCountdown > 0
                        ? '로딩 페이지로 이동'
                        : '바로 접속 가능'}
                    </span>
                  </div>
                </div>
              </div>
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
