'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import {
  Bot,
  Power,
  BarChart3,
  StopCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// �� Dynamic Import로 성능 최적화
const ToastContainer = dynamic(
  () =>
    import('@/components/ui/ToastNotification').then(mod => ({
      default: mod.ToastContainer,
    })),
  {
    ssr: false,
  }
);

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='h-32 bg-white/10 backdrop-blur-sm rounded-lg animate-pulse'
          />
        ))}
      </div>
    ),
  }
);

const UnifiedProfileComponent = dynamic(
  () => import('@/components/UnifiedProfileComponent'),
  {
    ssr: false,
    loading: () => (
      <div className='w-10 h-10 bg-white/20 rounded-full animate-pulse' />
    ),
  }
);

// 🎨 Toast Hook은 조건부 import
const useToast = () => {
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    import('@/components/ui/ToastNotification').then(({ useToast }) => {
      setToast(useToast);
    });
  }, []);

  return (
    toast || {
      success: (msg: string) => console.log('Success:', msg),
      error: (msg: string) => console.log('Error:', msg),
      info: (msg: string) => console.log('Info:', msg),
      warning: (msg: string) => console.log('Warning:', msg),
    }
  );
};

// 동적 렌더링 강제
export const dynamicConfig = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const {
    isSystemStarted,
    aiAgent,
    startSystem,
    stopSystem,
    getSystemRemainingTime,
  } = useUnifiedAdminStore();
  const { success, error, info, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🔧 상태 변화 디버깅
  useEffect(() => {
    console.log('🔍 Home - 시스템 상태 변화:', {
      isSystemStarted,
      aiAgentEnabled: aiAgent.isEnabled,
      aiAgentState: aiAgent.state,
      timeRemaining: systemTimeRemaining,
    });
  }, [isSystemStarted, aiAgent.isEnabled, aiAgent.state, systemTimeRemaining]);

  // 🛡️ 상태 불일치 방지 - AI 에이전트가 시스템 중지 시 비활성화되는지 확인
  useEffect(() => {
    if (!isSystemStarted && aiAgent.isEnabled) {
      console.warn(
        '⚠️ 상태 불일치 감지: 시스템이 중지되었지만 AI 에이전트가 여전히 활성 상태'
      );
    }
  }, [isSystemStarted, aiAgent.isEnabled]);

  // 시스템 타이머 업데이트
  useEffect(() => {
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
  }, [isSystemStarted, getSystemRemainingTime]);

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

  const handleSystemToggle = async () => {
    setIsLoading(true);
    try {
      if (isSystemStarted) {
        stopSystem();
        success('시스템이 정지되었습니다. 모든 서비스가 비활성화됩니다.');
      } else {
        startSystem();
        success(
          '시스템이 시작되었습니다. 30분간 운영되며 모든 서비스가 활성화됩니다.'
        );
      }
    } catch (err) {
      console.error('시스템 제어 오류:', err);
      error('시스템 제어 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleDashboardClick = async () => {
    if (!isSystemStarted) {
      warning('시스템을 먼저 시작해주세요.');
      return;
    }

    // 🔍 실제 시스템 상태 점검
    console.log('🔍 [Dashboard] 대시보드 이동 전 시스템 상태 점검 시작...');

    try {
      // 1. 시스템 헬스체크
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();

      // 2. 서버 생성기 상태 확인
      const serverGenResponse = await fetch('/api/system/status');
      const serverGenData = await serverGenResponse.json();

      // 3. MCP 상태 확인 (선택적)
      let mcpStatus = { success: false, ready: false };
      try {
        const mcpResponse = await fetch('/api/mcp/status');
        mcpStatus = await mcpResponse.json();
      } catch (mcpError) {
        console.warn('⚠️ MCP 상태 확인 실패 (선택적 기능):', mcpError);
      }

      // 📊 점검 결과 로깅
      const systemReadiness = {
        health: healthData.success,
        serverGeneration:
          serverGenData.success && serverGenData.data?.isGenerating,
        mcp: mcpStatus.success,
        timestamp: new Date().toISOString(),
      };

      console.log('📊 [Dashboard] 시스템 준비 상태:', systemReadiness);

      // 🚨 문제 발견 시 디버그 모드 활성화
      const isSystemReady =
        systemReadiness.health && systemReadiness.serverGeneration;

      if (!isSystemReady) {
        console.warn(
          '🚨 [Dashboard] 시스템이 완전히 준비되지 않음 - 디버그 모드 활성화'
        );

        // F12 디버그 안내 표시
        const userWantsDebug = confirm(
          `⚠️ 시스템 준비가 완료되지 않았습니다.\n\n` +
            `📊 시스템 상태:\n` +
            `• 헬스체크: ${systemReadiness.health ? '✅' : '❌'}\n` +
            `• 서버 생성기: ${systemReadiness.serverGeneration ? '✅' : '❌'}\n` +
            `• MCP 서버: ${systemReadiness.mcp ? '✅' : '⚠️'}\n\n` +
            `🔧 F12를 눌러 개발자 도구에서 상세 로그를 확인하세요.\n\n` +
            `그래도 대시보드로 이동하시겠습니까?`
        );

        if (!userWantsDebug) {
          console.log('📊 [Dashboard] 사용자가 대시보드 이동을 취소함');
          return;
        }

        console.log(
          '📊 [Dashboard] 사용자가 준비 미완료 상태에서도 대시보드 이동 선택'
        );
      }

      // ✅ 대시보드로 이동
      console.log('✅ [Dashboard] 시스템 상태 점검 완료 - 대시보드로 이동');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ [Dashboard] 시스템 상태 점검 중 오류:', error);

      // 오류 발생 시에도 디버그 모드 제공
      const userWantsForceEntry = confirm(
        `❌ 시스템 상태 점검 중 오류가 발생했습니다.\n\n` +
          `🔧 F12를 눌러 개발자 도구에서 오류 내용을 확인하세요.\n\n` +
          `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n` +
          `그래도 대시보드로 이동하시겠습니까?`
      );

      if (userWantsForceEntry) {
        console.log(
          '📊 [Dashboard] 사용자가 오류 상태에서도 대시보드 이동 선택'
        );
        router.push('/dashboard');
      }
    }
  };

  const handleAIAgentInfo = () => {
    if (aiAgent.isEnabled) {
      info(
        'AI 엔진이 활성화되어 있습니다. 프로필에서 설정을 변경할 수 있습니다.'
      );
    } else {
      info(
        'AI 엔진을 활성화하려면 화면 우상단 프로필 → 통합 설정에서 활성화하세요.',
        {
          duration: 5000,
          action: {
            label: '설정 확인',
            onClick: () => info('화면 우상단의 프로필 버튼을 확인해주세요.'),
          },
        }
      );
    }
  };

  // 배경 클래스 결정
  const getBackgroundClass = () => {
    if (!isSystemStarted) {
      return 'enhanced-dark-background';
    } else if (aiAgent.isEnabled) {
      return 'dark-gradient-ai';
    } else {
      return 'dark-gradient-active';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* 웨이브 파티클 배경 효과 */}
      <div className='wave-particles'></div>

      {/* 헤더 */}
      <header className='relative z-10 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          {/* AI 컨셉 아이콘 */}
          <motion.div
            className='w-10 h-10 rounded-lg flex items-center justify-center relative'
            animate={
              aiAgent.isEnabled
                ? {
                    background: [
                      'linear-gradient(135deg, #a855f7, #ec4899)',
                      'linear-gradient(135deg, #ec4899, #06b6d4)',
                      'linear-gradient(135deg, #06b6d4, #a855f7)',
                    ],
                  }
                : isSystemStarted
                  ? {
                      background: [
                        'linear-gradient(135deg, #10b981, #059669)',
                        'linear-gradient(135deg, #059669, #047857)',
                        'linear-gradient(135deg, #047857, #10b981)',
                      ],
                    }
                  : {
                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    }
            }
            transition={{
              duration: aiAgent.isEnabled ? 2 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <i
              className='fas fa-server text-white text-lg'
              aria-hidden='true'
            ></i>
          </motion.div>

          {/* 브랜드 텍스트 */}
          <div>
            <h1 className='text-xl font-bold text-white'>OpenManager</h1>
            <p className='text-xs text-white/70'>
              {aiAgent.isEnabled
                ? 'AI 엔진 모드'
                : isSystemStarted
                  ? '기본 모니터링'
                  : '시스템 정지'}
            </p>
          </div>
        </div>

        {/* 오른쪽 헤더 컨트롤 */}
        <div className='flex items-center gap-3'>
          {/* AI 관리자 페이지 버튼 - AI 모드 활성화 시에만 표시 */}
          {aiAgent.isEnabled && aiAgent.isAuthenticated && (
            <Link href='/admin/ai-agent'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all duration-200'
              >
                <Shield className='w-4 h-4' />
                <span className='text-sm font-medium'>🧠 AI 엔진 관리</span>
              </motion.button>
            </Link>
          )}

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
            <span className='text-white font-semibold'>기반</span>{' '}
            <span className='text-white'>서버 모니터링</span>
          </h1>
          <p className='text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed'>
            차세대 {renderTextWithAIGradient('AI 엔진')}과 함께하는 지능형 서버
            관리 솔루션
            <br />
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
            /* 시스템 중지 상태 */
            <div className='max-w-md mx-auto text-center'>
              {/* 시스템 종료 상태 안내 */}
              <div className='mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                  <span className='text-red-200 font-semibold'>
                    시스템 종료됨
                  </span>
                </div>
                <p className='text-red-100 text-sm'>
                  모든 서비스가 중지되었습니다.
                  <br />
                  <strong>아래 버튼을 눌러 시스템을 다시 시작하세요.</strong>
                </p>
              </div>

              {/* 손가락 표시 애니메이션 */}
              <div className='flex flex-col items-center'>
                <motion.button
                  onClick={handleSystemToggle}
                  disabled={isLoading}
                  className='inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-75'
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : (
                    <Power className='w-6 h-6' />
                  )}
                  <span>
                    {isLoading ? '시작 중...' : '🚀 시스템 시작 (30분)'}
                  </span>
                </motion.button>

                {/* 손가락 아이콘 - 버튼 아래에서 위로 가리키도록 수정 */}
                <div className='mt-2 flex justify-center'>
                  <span className='animate-wiggle text-yellow-400 text-2xl'>
                    👆
                  </span>
                </div>
                <div className='mt-1 flex justify-center'>
                  <span className='text-white text-xs opacity-70 animate-point-bounce'>
                    클릭하세요
                  </span>
                </div>
              </div>

              <p className='text-white/80 text-sm'>
                <strong>통합 시스템 시작:</strong> 서버 시딩 → 시뮬레이션 →
                데이터 생성
                <br />
                30분간 모든 서비스가 자동으로 순차 시작됩니다
              </p>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <div className='max-w-2xl mx-auto'>
              {/* 시스템 활성 상태 안내 */}
              <div className='mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-green-200 font-semibold'>
                    시스템 실행 중
                  </span>
                  <div className='w-1 h-4 bg-green-300/30'></div>
                  <span className='text-green-300 text-sm'>
                    {formatTime(systemTimeRemaining)} 남음
                  </span>
                </div>
                <p className='text-green-100 text-sm text-center'>
                  {aiAgent.isEnabled
                    ? 'AI 엔진이 활성화되어 지능형 분석이 가능합니다. (독립 동작 엔진, 향후 개발에서 고급 기능 확장 예정)'
                    : '기본 서버 모니터링이 실행되고 있습니다.'}
                </p>
              </div>

              {/* 제어 버튼들 */}
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                {/* AI 에이전트 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleAIAgentInfo}
                    className={`w-52 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border ${
                      aiAgent.isEnabled
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border-purple-500/50'
                        : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={
                        aiAgent.isEnabled
                          ? {
                              rotate: [0, 360],
                              scale: [1, 1.1, 1],
                            }
                          : {}
                      }
                      transition={{
                        rotate: {
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                    >
                      <Bot className='w-5 h-5' />
                    </motion.div>
                    {aiAgent.isEnabled ? (
                      <span className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold'>
                        🧠 AI 엔진 활성
                      </span>
                    ) : (
                      '🧠 AI 엔진 설정'
                    )}
                  </motion.button>

                  {/* AI 에이전트 버튼에는 손가락 표시 제거 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='text-transparent text-xl'>👆</span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-transparent text-xs opacity-0'>
                      클릭하세요
                    </span>
                  </div>
                </div>

                {/* 대시보드 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleDashboardClick}
                    className='w-52 h-14 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/50 rounded-xl font-semibold transition-all duration-200'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className='w-5 h-5' />
                    📊 대시보드 들어가기
                  </motion.button>

                  {/* 손가락 아이콘 + 클릭 문구 - 대시보드에만 표시, 위를 향하는 이모지로 변경 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='animate-wiggle text-yellow-400 text-xl'>
                      👆
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-white text-xs opacity-70 animate-point-bounce'>
                      클릭하세요
                    </span>
                  </div>
                </div>

                {/* 시스템 중지 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleSystemToggle}
                    disabled={isLoading}
                    className='w-52 h-14 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white border border-red-500/50 rounded-xl font-semibold transition-all duration-200 disabled:opacity-75'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <StopCircle className='w-5 h-5' />
                    )}
                    <span>{isLoading ? '중지 중...' : '⏹️ 시스템 중지'}</span>
                  </motion.button>

                  {/* 시스템 중지 버튼에는 손가락 표시 제거 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='text-transparent text-xl'>👆</span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-transparent text-xs opacity-0'>
                      클릭하세요
                    </span>
                  </div>
                </div>
              </div>

              <p className='text-white/60 text-xs mt-4 text-center'>
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을
                확인하세요.
              </p>
            </div>
          )}
        </motion.div>

        {/* 기능 카드 그리드 */}
        <div className='mb-12'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl md:text-3xl font-bold mb-3'>
              <span className='text-fuchsia-400'>핵심</span>{' '}
              <span className='text-white'>기능</span>
            </h2>
            <p className='text-white/70 text-base max-w-2xl mx-auto'>
              {renderTextWithAIGradient(
                'AI 엔진 기반 서버 모니터링의 모든 것을 경험해보세요'
              )}
            </p>
          </div>

          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className='mt-8 pt-6 border-t border-white/20 text-center'>
          <p className='text-white/70'>
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 토스트 알림 컨테이너 */}
      <ToastContainer />
    </div>
  );
}
