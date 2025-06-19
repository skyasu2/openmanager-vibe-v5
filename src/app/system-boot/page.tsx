'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  CheckCircle,
  Server as ServerIcon,
  Database,
  Cpu,
  Zap,
  Brain,
  Loader2,
} from 'lucide-react';

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
    <div className='w-96 mx-auto mb-6 relative'>
      <div className='bg-white/10 rounded-full h-3 border border-white/20 shadow-lg'>
        <motion.div
          className='h-full rounded-full relative overflow-hidden'
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* 진행률 바 내부 반짝임 효과 */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
};

// 🎯 새로운 단일 아이콘 전환 컴포넌트
const TransitionIcon = ({
  currentIcon: CurrentIcon,
  currentStage,
  progress,
}: {
  currentIcon: React.ComponentType<any>;
  currentStage: string;
  progress: number;
}) => {
  return (
    <div className='relative mb-8'>
      {/* 외부 회전 링 */}
      <motion.div
        className='absolute inset-0 w-32 h-32 mx-auto'
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <div className='w-full h-full rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400' />
      </motion.div>

      {/* 중간 회전 링 (반대 방향) */}
      <motion.div
        className='absolute inset-2 w-28 h-28 mx-auto'
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        <div className='w-full h-full rounded-full border-2 border-transparent border-b-purple-400 border-l-pink-400' />
      </motion.div>

      {/* 진행률 링 */}
      <motion.div
        className='absolute inset-4 w-24 h-24 mx-auto'
        style={{
          background: `conic-gradient(from 0deg, #3b82f6 0deg, #8b5cf6 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        <div className='w-full h-full rounded-full' />
      </motion.div>

      {/* 메인 아이콘 컨테이너 */}
      <motion.div
        className='relative z-10 w-32 h-32 mx-auto rounded-full flex items-center justify-center'
        style={{
          background: 'linear-gradient(135deg, #1e293b, #334155)',
          boxShadow:
            '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
            '0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 25px rgba(255, 255, 255, 0.15)',
            '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 아이콘 전환 애니메이션 */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStage}
            initial={{
              scale: 0,
              rotate: -180,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
            exit={{
              scale: 0,
              rotate: 180,
              opacity: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.6,
            }}
            className='flex items-center justify-center'
          >
            <CurrentIcon className='w-12 h-12 text-white drop-shadow-lg' />
          </motion.div>
        </AnimatePresence>

        {/* 내부 글로우 효과 */}
        <motion.div
          className='absolute inset-8 rounded-full'
          animate={{
            background: [
              'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* 외부 파티클 효과 */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className='absolute w-2 h-2 bg-blue-400 rounded-full'
          style={{
            top: '50%',
            left: '50%',
            marginTop: '-4px',
            marginLeft: '-4px',
          }}
          animate={{
            x: [0, Math.cos((i * 60 * Math.PI) / 180) * 80],
            y: [0, Math.sin((i * 60 * Math.PI) / 180) * 80],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
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
      icon: Monitor,
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
          {/* 제품 브랜드 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className='text-5xl font-bold mb-8'
          >
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              OpenManager
            </span>
          </motion.h1>

          {/* 🎯 새로운 단일 전환 아이콘 */}
          <TransitionIcon
            currentIcon={currentIcon}
            currentStage={currentStage}
            progress={progress}
          />

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

          {/* 진행률 텍스트 */}
          <motion.p
            className='text-white/60 text-lg font-medium mb-8'
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(progress)}% 완료
          </motion.p>

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
