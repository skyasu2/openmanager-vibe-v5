'use client';

// 🚫 정적 생성 완전 비활성화 (동적 렌더링만 사용)
export const dynamic = 'force-dynamic';

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
import React, { useEffect, useState } from 'react';

// 부드러운 로딩 인디케이터 컴포넌트
const SmoothLoadingSpinner = () => {
  return (
    <div className='relative w-20 h-20 mx-auto mb-8'>
      {/* 외부 링 - 더 부드러운 애니메이션 */}
      <div className='absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin'
        style={{ animationDuration: '3s' }}
      />
      {/* 내부 링 - 더 부드러운 애니메이션 */}
      <div className='absolute inset-2 border-3 border-transparent border-b-purple-400 border-l-pink-400 rounded-full animate-reverse-spin'
        style={{ animationDuration: '2.5s' }}
      />
      {/* 중앙 아이콘 - 부드러운 펄스 */}
      <div className='absolute inset-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse'
        style={{ animationDuration: '2s' }}
      >
        <Monitor className='w-4 h-4 text-white' />
      </div>
    </div>
  );
};

// 진행률 바 컴포넌트
const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className='w-96 mx-auto mb-8 relative'>
      {/* 진행률 라벨 */}
      <div className='flex justify-between items-center mb-2'>
        <span className='text-white/60 text-sm font-medium'>
          시스템 로딩 진행률
        </span>
        <span className='text-white/80 text-sm font-semibold'>
          {Math.round(progress)}%
        </span>
      </div>

      {/* 진행률 바 컨테이너 */}
      <div className='bg-white/10 rounded-full h-4 border border-white/20 shadow-lg relative overflow-hidden'>
        {/* 배경 그라데이션 효과 */}
        <div className='absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full' />

        {/* 메인 진행률 바 */}
        <div
          className='h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out'
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
            boxShadow:
              '0 0 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* 진행률 바 내부 반짝임 효과 */}
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer' />

          {/* 진행률 바 상단 하이라이트 */}
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white/50 to-white/30 rounded-full' />
        </div>

        {/* 진행률 포인터 - 부드러운 트랜지션 */}
        <div
          className='absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-400 animate-pulse transition-all duration-700 ease-out'
          style={{ left: `${progress}%`, animationDuration: '1.5s' }}
        />
      </div>
    </div>
  );
};

export default function SystemBootPage() {
  const router = useRouter();
  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );
  const [currentStage, setCurrentStage] = useState<string>('시스템 초기화');
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] =
    useState<React.ComponentType<any>>(Loader2);
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

  // 🚀 실제 제품 로딩 애니메이션 (백그라운드 초기화와 동기화)
  useEffect(() => {
    if (!isClient) return;

    console.log('🚀 OpenManager 시스템 로딩 시작');

    // 실제 시스템 상태를 주기적으로 체크
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (response.ok) {
          const data = await response.json();
          if (data.isRunning) {
            console.log('✅ 시스템이 준비되었습니다 - 대시보드로 이동');
            handleBootComplete();
            return true;
          }
        }
      } catch (error) {
        console.log('🔄 시스템 상태 체크 중...');
      }
      return false;
    };

    // 로딩 애니메이션과 실제 시스템 체크를 병렬로 실행
    let systemReady = false;

    stages.forEach(({ name, delay, icon, description }, index) => {
      setTimeout(() => {
        if (systemReady) return; // 시스템이 이미 준비되면 스킵

        // 페이드 트랜지션 시작
        setIsTransitioning(true);

        setTimeout(() => {
          setCurrentStage(name);
          setCurrentIcon(icon);
          setProgress(((index + 1) / stages.length) * 100);

          // 페이드 트랜지션 종료
          setTimeout(() => {
            setIsTransitioning(false);
          }, 150);
        }, 150);

        // 각 단계에서 시스템 상태 체크
        setTimeout(async () => {
          if (!systemReady) {
            systemReady = await checkSystemStatus();
          }
        }, delay + 200);

        // 마지막 단계에서 완료 처리 (시스템이 아직 준비되지 않은 경우)
        if (index === stages.length - 1) {
          setTimeout(async () => {
            if (!systemReady) {
              // 마지막으로 한 번 더 체크
              systemReady = await checkSystemStatus();
              if (!systemReady) {
                // 시스템이 아직 준비되지 않았어도 대시보드로 이동
                console.log('⏰ 로딩 시간 완료 - 대시보드로 이동');
                handleBootComplete();
              }
            }
          }, 1500);
        }
      }, delay);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // 부팅 완료 - 즉시 대시보드로 이동
  const handleBootComplete = () => {
    console.log('🎉 시스템 로딩 완료 - 대시보드로 이동');
    setBootState('completed');
    router.push('/dashboard');
  };

  const currentStageData =
    stages.find(s => s.name === currentStage) || stages[0] || {
      name: '초기화 중',
      delay: 500,
      icon: Loader2,
      description: '시스템을 초기화하고 있습니다...',
    };
  const CurrentIconComponent = currentIcon;

  // 클라이언트 렌더링이 준비되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center'>
        <div className='text-white'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden'>
      {/* 첫페이지와 동일한 웨이브 파티클 배경 효과 */}
      <div className='wave-particles'></div>

      {/* 부드러운 배경 오버레이 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-pulse' />
      </div>

      {/* 메인 로딩 화면 */}
      <div className='relative z-10 flex items-center justify-center min-h-screen'>
        <div className='text-center max-w-2xl px-8'>
          {/* 부드러운 로딩 스피너 */}
          <SmoothLoadingSpinner />

          {/* 제품 브랜드 */}
          <h1 className='text-5xl font-bold mb-4'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              OpenManager
            </span>
          </h1>

          {/* 버전 정보 */}
          <p className='text-xl text-white/80 mb-8 font-light'>
            AI 기반 서버 모니터링
          </p>

          {/* 🎯 부드러운 아이콘 교체 시스템 - 현재 단계 아이콘 */}
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0'>
              <div className='w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-2xl'>
                {/* 아이콘 - 페이드 트랜지션 추가 */}
                <div
                  className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                  <CurrentIconComponent className='w-10 h-10' />
                </div>
              </div>
            </div>
          </div>

          {/* 현재 단계명 - 페이드 트랜지션 추가 */}
          <h2
            className={`text-2xl font-semibold text-white mb-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentStage}
          </h2>

          {/* 단계 설명 - 페이드 트랜지션 추가 */}
          <p
            className={`text-white/70 mb-8 font-light transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentStageData.description}
          </p>

          {/* 부드러운 진행률 바 */}
          <ProgressBar progress={progress} />

          {/* 시스템 상태 아이콘들 */}
          <div className='flex justify-center gap-6 mb-8'>
            {[ServerIcon, Database, Brain, Cpu, Zap, CheckCircle].map(
              (Icon, index) => {
                const isActive = index < Math.floor((progress / 100) * 6);
                const isCurrentStep =
                  index === Math.floor((progress / 100) * 6) - 1;

                return (
                  <div key={index} className='relative'>
                    {/* 메인 아이콘 컨테이너 */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${isActive
                        ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/40 border border-white/20'
                        }`}
                    >
                      {/* 아이콘 */}
                      <div
                        className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`}
                      >
                        <Icon className='w-6 h-6' />
                      </div>
                    </div>

                    {/* 글로우 효과 */}
                    {isActive && (
                      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-pink-500/20 rounded-xl blur-lg' />
                    )}

                    {/* 현재 단계 펄스 효과 */}
                    {isCurrentStep && (
                      <div className='absolute inset-0 border-2 border-white/50 rounded-xl animate-pulse' />
                    )}

                    {/* 완료 체크 마크 */}
                    {isActive &&
                      index < Math.floor((progress / 100) * 6) - 1 && (
                        <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                          <CheckCircle className='w-3 h-3 text-white' />
                        </div>
                      )}

                    {/* 연결선 */}
                    {index < 5 && (
                      <div
                        className='absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-white/30 to-transparent'
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* 하단 상태 메시지 */}
          <div className='text-white/50 text-sm font-light'>
            <p>
              잠시만 기다려주세요. 최고의 모니터링 경험을 준비하고 있습니다.
            </p>
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
