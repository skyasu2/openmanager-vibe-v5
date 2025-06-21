'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
      {/* 외부 링 */}
      <motion.div
        className='absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full'
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      {/* 내부 링 */}
      <motion.div
        className='absolute inset-2 border-3 border-transparent border-b-purple-400 border-l-pink-400 rounded-full'
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      {/* 중앙 아이콘 */}
      <motion.div
        className='absolute inset-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Monitor className='w-4 h-4 text-white' />
      </motion.div>
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
        <motion.div
          className='h-full rounded-full relative overflow-hidden'
          style={{
            background:
              'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
            boxShadow:
              '0 0 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* 진행률 바 내부 반짝임 효과 */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent'
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />

          {/* 진행률 바 상단 하이라이트 */}
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white/50 to-white/30 rounded-full' />
        </motion.div>

        {/* 진행률 포인터 */}
        <motion.div
          className='absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-400'
          style={{ left: `${progress}%` }}
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              '0 0 5px rgba(59, 130, 246, 0.5)',
              '0 0 15px rgba(59, 130, 246, 0.8)',
              '0 0 5px rgba(59, 130, 246, 0.5)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
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

  // 실제 제품 로딩 과정
  const stages = [
    {
      name: '시스템 초기화',
      delay: 800,
      icon: Loader2,
      description: '시스템 환경 설정을 확인하고 있습니다...',
    },
    {
      name: '서버 연결 확인',
      delay: 1600,
      icon: ServerIcon,
      description: 'MCP 서버와 연결을 설정하고 있습니다...',
    },
    {
      name: '데이터베이스 연결',
      delay: 2400,
      icon: Database,
      description: 'Supabase 데이터베이스에 연결하고 있습니다...',
    },
    {
      name: 'AI 엔진 로딩',
      delay: 3200,
      icon: Brain,
      description: 'AI 분석 엔진을 초기화하고 있습니다...',
    },
    {
      name: '대시보드 준비',
      delay: 4000,
      icon: Loader2,
      description: '모니터링 대시보드를 준비하고 있습니다...',
    },
    {
      name: '시스템 완료',
      delay: 4800,
      icon: CheckCircle,
      description: 'OpenManager Vibe v5가 준비되었습니다!',
    },
  ];

  // 🚀 실제 제품 로딩 애니메이션
  useEffect(() => {
    console.log('🚀 OpenManager Vibe v5 시스템 로딩 시작');

    stages.forEach(({ name, delay, icon, description }, index) => {
      setTimeout(() => {
        setCurrentStage(name);
        setCurrentIcon(icon);
        setProgress(((index + 1) / stages.length) * 100);

        // 마지막 단계에서 완료 처리
        if (index === stages.length - 1) {
          setTimeout(() => {
            handleBootComplete();
          }, 1000);
        }
      }, delay);
    });
  }, []);

  // 부팅 완료 - 즉시 대시보드로 이동
  const handleBootComplete = () => {
    console.log('🎉 시스템 로딩 완료 - 대시보드로 이동');
    setBootState('completed');
    router.push('/dashboard');
  };

  const currentStageData =
    stages.find(s => s.name === currentStage) || stages[0];
  const CurrentIconComponent = currentIcon;

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='text-center max-w-2xl px-8'
        >
          {/* 부드러운 로딩 스피너 */}
          <SmoothLoadingSpinner />

          {/* 제품 브랜드 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className='text-5xl font-bold mb-4'
          >
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              OpenManager
            </span>
          </motion.h1>

          {/* 버전 정보 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className='text-xl text-white/80 mb-8 font-light'
          >
            AI 기반 서버 모니터링
          </motion.p>

          {/* 🎯 부드러운 아이콘 교체 시스템 - 현재 단계 아이콘 */}
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentStage}
                initial={{
                  scale: 0,
                  opacity: 0,
                  rotateY: 90,
                  y: 20,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotateY: 0,
                  y: 0,
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  rotateY: -90,
                  y: -20,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className='absolute inset-0'
              >
                {/* 메인 아이콘 컨테이너 */}
                <motion.div
                  className='w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-2xl'
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 10px 25px rgba(59, 130, 246, 0.3)',
                      '0 15px 35px rgba(168, 85, 247, 0.4)',
                      '0 10px 25px rgba(59, 130, 246, 0.3)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* 아이콘 */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <CurrentIconComponent className='w-10 h-10' />
                  </motion.div>

                  {/* 반짝임 효과 */}
                  <motion.div
                    className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  {/* 글로우 링 */}
                  <motion.div
                    className='absolute inset-0 border-2 border-white/30 rounded-2xl'
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 현재 단계명 */}
          <motion.h2
            key={currentStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-2xl font-semibold text-white mb-4'
          >
            {currentStage}
          </motion.h2>

          {/* 단계 설명 */}
          <motion.p
            key={currentStageData.description}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-white/70 mb-8 font-light'
          >
            {currentStageData.description}
          </motion.p>

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
                  <motion.div
                    key={index}
                    initial={{
                      x: -50,
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      x: 0,
                      opacity: isActive ? 1 : 0.3,
                      scale: isActive ? 1 : 0.8,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: 'easeOut',
                    }}
                    className='relative'
                  >
                    {/* 메인 아이콘 컨테이너 */}
                    <motion.div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/40 border border-white/20'
                      }`}
                      animate={
                        isCurrentStep
                          ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isCurrentStep ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      {/* 아이콘 */}
                      <motion.div
                        animate={
                          isActive
                            ? {
                                rotate: [0, 360],
                              }
                            : {}
                        }
                        transition={{
                          duration: 3,
                          repeat: isActive ? Infinity : 0,
                          ease: 'linear',
                        }}
                      >
                        <Icon className='w-6 h-6' />
                      </motion.div>

                      {/* 활성화 시 반짝임 효과 */}
                      {isActive && (
                        <motion.div
                          className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      )}
                    </motion.div>

                    {/* 글로우 효과 */}
                    {isActive && (
                      <motion.div
                        className='absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-pink-500/20 rounded-xl blur-lg'
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* 현재 단계 펄스 효과 */}
                    {isCurrentStep && (
                      <motion.div
                        className='absolute inset-0 border-2 border-white/50 rounded-xl'
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* 완료 체크 마크 */}
                    {isActive &&
                      index < Math.floor((progress / 100) * 6) - 1 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'
                        >
                          <CheckCircle className='w-3 h-3 text-white' />
                        </motion.div>
                      )}

                    {/* 연결선 */}
                    {index < 5 && (
                      <motion.div
                        className='absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-white/30 to-transparent'
                        initial={{ scaleX: 0 }}
                        animate={{
                          scaleX: isActive ? 1 : 0,
                          opacity: isActive ? 1 : 0.3,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1 + 0.3,
                          ease: 'easeOut',
                        }}
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                  </motion.div>
                );
              }
            )}
          </div>

          {/* 하단 상태 메시지 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className='text-white/50 text-sm font-light'
          >
            <motion.p
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              잠시만 기다려주세요. 최고의 모니터링 경험을 준비하고 있습니다.
            </motion.p>
          </motion.div>
        </motion.div>
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
