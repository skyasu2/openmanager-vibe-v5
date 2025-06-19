'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  CheckCircle,
  Server as ServerIcon,
  Database,
  Brain,
  Loader2,
  Zap,
} from 'lucide-react';

// 🚀 새로운 경량 로딩 애니메이션
const LightweightSpinner = ({ progress }: { progress: number }) => {
  return (
    <div className='relative w-32 h-32'>
      <motion.svg
        className='absolute inset-0'
        viewBox='0 0 100 100'
        initial={{ rotate: -90 }}
        animate={{ rotate: -90 }}
      >
        <circle
          cx='50'
          cy='50'
          r='45'
          fill='none'
          stroke='rgba(255, 255, 255, 0.1)'
          strokeWidth='5'
        />
        <motion.circle
          cx='50'
          cy='50'
          r='45'
          fill='none'
          stroke='url(#gradient)'
          strokeWidth='5'
          strokeLinecap='round'
          strokeDasharray={Math.PI * 90}
          initial={{ strokeDashoffset: Math.PI * 90 }}
          animate={{
            strokeDashoffset: (Math.PI * 90 * (100 - progress)) / 100,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id='gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='#3b82f6' />
            <stop offset='100%' stopColor='#8b5cf6' />
          </linearGradient>
        </defs>
      </motion.svg>
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='text-2xl font-bold text-white'>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// 🎯 새로운 단일 아이콘 전환 컴포넌트
const TransitionIcon = ({
  currentIcon: CurrentIcon,
}: {
  currentIcon: React.ComponentType<any>;
}) => {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={CurrentIcon.displayName || CurrentIcon.name}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='flex items-center justify-center w-12 h-12 text-white'
      >
        <CurrentIcon className='w-full h-full' />
      </motion.div>
    </AnimatePresence>
  );
};

export default function SystemBootPage() {
  const router = useRouter();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

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
      name: '완료!',
      delay: 4500,
      icon: CheckCircle,
      description: '모든 준비가 완료되었습니다. 대시보드로 이동합니다.',
    },
  ];

  const totalDuration = stages[stages.length - 1].delay;

  useEffect(() => {
    const stageTimers = stages.map((stage, index) => {
      return setTimeout(() => {
        setCurrentStageIndex(index);
      }, stage.delay);
    });

    const finalTimer = setTimeout(() => {
      router.push('/dashboard');
    }, totalDuration + 500); // 완료 후 0.5초 뒤 이동

    return () => {
      stageTimers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
  }, [router, stages, totalDuration]);

  const currentStage = stages[currentStageIndex];
  const progress = Math.min(100, (currentStage.delay / totalDuration) * 100);

  return (
    <div className='fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden'>
      {/* 배경 그라데이션 */}
      <div className='absolute inset-0 z-0'>
        <motion.div
          className='absolute top-0 left-0 w-96 h-96 bg-blue-900/50 rounded-full filter blur-3xl'
          animate={{
            x: ['-25%', '0%', '-25%'],
            y: ['0%', '-25%', '0%'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-0 right-0 w-96 h-96 bg-purple-900/50 rounded-full filter blur-3xl'
          animate={{
            x: ['25%', '0%', '25%'],
            y: ['0%', '25%', '0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />
      </div>

      <div className='relative z-10 flex flex-col items-center justify-center text-center'>
        {/* 경량 스피너 및 아이콘 */}
        <div className='relative w-40 h-40 flex items-center justify-center mb-8'>
          <LightweightSpinner progress={progress} />
          <div className='absolute'>
            <TransitionIcon currentIcon={currentStage.icon} />
          </div>
        </div>

        {/* 단계 텍스트 */}
        <div className='w-80'>
          <AnimatePresence mode='wait'>
            <motion.h2
              key={currentStage.name}
              className='text-2xl font-bold mb-2'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentStage.name}
            </motion.h2>
          </AnimatePresence>
          <AnimatePresence mode='wait'>
            <motion.p
              key={currentStage.description}
              className='text-gray-400'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {currentStage.description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 건너뛰기 버튼 */}
      <div className='absolute bottom-10 z-10'>
        <motion.button
          onClick={() => router.push('/dashboard')}
          className='px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors duration-300'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          건너뛰기
        </motion.button>
      </div>
    </div>
  );
}
