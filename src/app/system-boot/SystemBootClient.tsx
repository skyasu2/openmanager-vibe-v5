'use client';

import {
  Brain,
  CheckCircle,
  Cpu,
  Database,
  Loader2,
  Monitor,
  Server as ServerIcon,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType, type FC } from 'react';
import debug from '@/utils/debug';

// 부드러운 로딩 인디케이터 컴포넌트
const SmoothLoadingSpinner = () => {
  return (
    <div className="relative mx-auto mb-8 h-20 w-20">
      {/* 외부 링 - 더 부드러운 애니메이션 */}
      <div
        className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-purple-500 border-t-blue-500"
        style={{ animationDuration: '3s' }}
      />
      {/* 내부 링 - 더 부드러운 애니메이션 */}
      <div
        className="border-3 _animate-reverse-spin absolute inset-2 rounded-full border-transparent border-b-purple-400 border-l-pink-400"
        style={{ animationDuration: '2.5s' }}
      />
      {/* 중앙 아이콘 - 부드러운 펄스 */}
      <div
        className="_animate-pulse absolute inset-6 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
        style={{ animationDuration: '2s' }}
      >
        <Monitor className="h-4 w-4 text-white" />
      </div>
    </div>
  );
};

// 진행률 바 컴포넌트
const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="relative mx-auto mb-8 w-96">
      {/* 진행률 라벨 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">
          시스템 로딩 진행률
        </span>
        <span className="text-sm font-semibold text-white/80">
          {Math.round(progress)}%
        </span>
      </div>

      {/* 진행률 바 컨테이너 */}
      <div className="relative h-4 overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-lg">
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />

        {/* 메인 진행률 바 */}
        <div
          className="relative h-full overflow-hidden rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
            boxShadow:
              '0 0 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* 진행률 바 내부 반짝임 효과 */}
          <div className="_animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* 진행률 바 상단 하이라이트 */}
          <div className="absolute left-0 right-0 top-0 h-1 rounded-full bg-gradient-to-r from-white/30 via-white/50 to-white/30" />
        </div>

        {/* 진행률 포인터 - 부드러운 트랜지션 */}
        <div
          className="_animate-pulse absolute top-1/2 h-3 w-3 -translate-y-1/2 transform rounded-full border-2 border-blue-400 bg-white shadow-lg transition-all duration-700 ease-out"
          style={{ left: `${progress}%`, animationDuration: '1.5s' }}
        />
      </div>
    </div>
  );
};

export default function SystemBootClient() {
  const router = useRouter();
  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );
  const [currentStage, setCurrentStage] = useState<string>('시스템 초기화');
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] =
    useState<ComponentType<unknown>>(Loader2);
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 실제 제품 로딩 과정
  const stages = [
    {
      name: '시스템 초기화',
      delay: 500,
      icon: Loader2,
      description: '시스템 환경 설정을 확인하고 있습니다...',
    },
    {
      name: '서버 연결 확인',
      delay: 1200,
      icon: ServerIcon,
      description: 'MCP 서버와 연결을 설정하고 있습니다...',
    },
    {
      name: '데이터베이스 연결',
      delay: 1900,
      icon: Database,
      description: 'Supabase 데이터베이스에 연결하고 있습니다...',
    },
    {
      name: 'AI 엔진 로딩',
      delay: 2600,
      icon: Brain,
      description: 'AI 분석 엔진을 초기화하고 있습니다...',
    },
    {
      name: '서버 데이터 동기화',
      delay: 3300,
      icon: Cpu,
      description: '실시간 서버 메트릭을 동기화하고 있습니다...',
    },
    {
      name: '대시보드 준비',
      delay: 4000,
      icon: Monitor,
      description: '모니터링 대시보드를 준비하고 있습니다...',
    },
    {
      name: '시스템 시작 완료',
      delay: 4700,
      icon: CheckCircle,
      description: 'OpenManager가 준비되었습니다!',
    },
  ];

  // 🚀 개선된 시스템 로딩 로직 (실제 시스템 상태와 동기화)
  useEffect(() => {
    if (!isClient) return;

    debug.log('🚀 OpenManager 시스템 로딩 시작');

    let systemReady = false;
    let animationCompleted = false;
    let statusCheckInterval: NodeJS.Timeout;

    // 실제 시스템 상태를 주기적으로 체크
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/system/status?source=boot-check');
        if (response.ok) {
          const data = await response.json();
          debug.log('🔍 시스템 상태 체크:', {
            isRunning: data.isRunning,
            activeUsers: data.activeUsers,
            success: data.success,
          });

          if (data.success && data.isRunning && !systemReady) {
            debug.log('✅ 시스템이 준비되었습니다!');
            systemReady = true;

            // 애니메이션이 완료되었거나 최소 50% 진행되었으면 즉시 이동
            if (animationCompleted || progress >= 50) {
              handleBootComplete();
            }
            return true;
          }
        } else {
          debug.log('⚠️ 시스템 상태 API 응답 오류:', response.status);
        }
      } catch {
        debug.log('🔄 시스템 상태 체크 중... (네트워크 오류)');
      }
      return false;
    };

    // 시스템 상태를 1초마다 체크 (API 호출 최적화)
    statusCheckInterval = setInterval(() => { void checkSystemStatus(), 1000; });

    // 초기 즉시 체크
    void checkSystemStatus();

    // 로딩 애니메이션 실행
    stages.forEach(({ name, delay, icon }, index) => {
      setTimeout(() => {
        if (systemReady && animationCompleted) return; // 이미 완료되면 스킵

        // 페이드 트랜지션 시작
        setIsTransitioning(true);

        setTimeout(() => {
          setCurrentStage(name);
          setCurrentIcon(icon);
          const newProgress = ((index + 1) / stages.length) * 100;
          setProgress(newProgress);

          // 페이드 트랜지션 종료
          setTimeout(() => {
            setIsTransitioning(false);
          }, 150);

          // 마지막 단계 완료
          if (index === stages.length - 1) {
            animationCompleted = true;
            debug.log('🎬 로딩 애니메이션 완료');

            // 시스템이 준비되었으면 즉시 이동, 아니면 추가 대기
            if (systemReady) {
              setTimeout(() => handleBootComplete(), 500);
            } else {
              // 최대 5초 추가 대기 후 강제 이동 (시스템 시작에 더 많은 시간 제공)
              setTimeout(() => {
                void checkSystemStatus()
                  .then((finalCheck) => {
                    if (!finalCheck) {
                      debug.log('⏰ 최대 대기 시간 초과 - 대시보드로 이동');
                    }
                    handleBootComplete();
                  })
                  .catch(() => {
                    handleBootComplete();
                  });
                return; // Explicit void return for setTimeout callback
              }, 5000);
            }
          }
        }, 150);
      }, delay);
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // 부팅 완료 - 부드러운 전환 후 대시보드로 이동
  const handleBootComplete = () => {
    debug.log('🎉 시스템 로딩 완료 - 대시보드로 이동');
    setBootState('completed');

    // 완료 상태 표시
    setCurrentStage('시스템 준비 완료');
    setCurrentIcon(CheckCircle);
    setProgress(100);
    setIsTransitioning(false);

    // 부드러운 전환을 위해 잠시 대기 후 이동
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const currentStageData = stages.find((s) => s.name === currentStage) ||
    stages[0] || {
      name: '초기화 중',
      delay: 500,
      icon: Loader2,
      description: '시스템을 초기화하고 있습니다...',
    };
  const CurrentIconComponent = currentIcon as FC<{ className?: string }>;

  // 클라이언트 렌더링이 준비되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* 첫페이지와 동일한 웨이브 파티클 배경 효과 */}
      <div className="wave-particles"></div>

      {/* 부드러운 배경 오버레이 */}
      <div className="absolute inset-0">
        <div className="_animate-pulse absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="_animate-pulse absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="_animate-pulse absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      {/* 메인 로딩 화면 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="max-w-2xl px-8 text-center">
          {/* 부드러운 로딩 스피너 */}
          <SmoothLoadingSpinner />

          {/* 제품 브랜드 */}
          <h1 className="mb-4 text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              OpenManager
            </span>
          </h1>

          {/* 버전 정보 */}
          <p className="mb-8 text-xl font-light text-white/80">
            AI 기반 서버 모니터링
          </p>

          {/* 🎯 부드러운 아이콘 교체 시스템 - 현재 단계 아이콘 */}
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-2xl">
                {/* 아이콘 - 페이드 트랜지션 추가 */}
                <div
                  className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                  <CurrentIconComponent className="h-10 w-10" />
                </div>
              </div>
            </div>
          </div>

          {/* 현재 단계명 - 페이드 트랜지션 추가 */}
          <h2
            className={`mb-4 text-2xl font-semibold text-white transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentStage}
          </h2>

          {/* 단계 설명 - 페이드 트랜지션 추가 */}
          <p
            className={`mb-8 font-light text-white/70 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentStageData.description}
          </p>

          {/* 부드러운 진행률 바 */}
          <ProgressBar progress={progress} />

          {/* 시스템 상태 아이콘들 */}
          <div className="mb-8 flex justify-center gap-6">
            {[ServerIcon, Database, Brain, Cpu, Zap, CheckCircle].map(
              (Icon, index) => {
                const isActive = index < Math.floor((progress / 100) * 6);
                const isCurrentStep =
                  index === Math.floor((progress / 100) * 6) - 1;

                return (
                  <div key={index} className="relative">
                    {/* 메인 아이콘 컨테이너 */}
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-lg'
                          : 'border border-white/20 bg-white/10 text-white/40'
                      }`}
                    >
                      {/* 아이콘 */}
                      <div
                        className={`h-6 w-6 ${isActive ? 'text-white' : 'text-white/40'}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {/* 글로우 효과 */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-pink-500/20 blur-lg" />
                    )}

                    {/* 현재 단계 펄스 효과 */}
                    {isCurrentStep && (
                      <div className="_animate-pulse absolute inset-0 rounded-xl border-2 border-white/50" />
                    )}

                    {/* 완료 체크 마크 */}
                    {isActive &&
                      index < Math.floor((progress / 100) * 6) - 1 && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}

                    {/* 연결선 */}
                    {index < 5 && (
                      <div
                        className="absolute -right-3 top-1/2 h-0.5 w-6 bg-gradient-to-r from-white/30 to-transparent"
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* 하단 상태 메시지 */}
          <div className="text-sm font-light text-white/50">
            <p>
              잠시만 기다려주세요. 최고의 모니터링 경험을 준비하고 있습니다.
            </p>
            {bootState === 'completed' && (
              <p className="_animate-pulse mt-2 text-green-400">
                🎉 시스템 준비 완료! 대시보드로 이동 중...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 첫페이지와 동일한 스타일 적용을 위한 CSS */}
      <style jsx>{`
        .wave-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }

        .wave-particles::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(
              circle at 20% 80%,
              rgba(59, 130, 246, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 20%,
              rgba(139, 92, 246, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 40% 40%,
              rgba(236, 72, 153, 0.1) 0%,
              transparent 50%
            );
          animation: wave-float 20s ease-in-out infinite;
        }

        @keyframes wave-float {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }
      `}</style>
    </div>
  );
}
