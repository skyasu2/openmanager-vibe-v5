'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  CheckCircle,
  Server as ServerIcon,
  Database,
} from 'lucide-react';

export default function SystemBootPage() {
  const router = useRouter();
  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );
  const [currentStage, setCurrentStage] = useState<string>('초기화');
  const [progress, setProgress] = useState(0);

  // 🚀 가벼운 애니메이션만 실행 (실제 데이터 로딩 없음)
  useEffect(() => {
    console.log('🚀 시스템 부팅 애니메이션 시작 (경량화 버전)');

    const stages = [
      { name: '시스템 초기화', delay: 800 },
      { name: '인터페이스 로딩', delay: 1600 },
      { name: '대시보드 준비', delay: 2400 },
      { name: '완료', delay: 3200 },
    ];

    stages.forEach(({ name, delay }, index) => {
      setTimeout(() => {
        setCurrentStage(name);
        setProgress(((index + 1) / stages.length) * 100);

        // 마지막 단계에서 완료 처리
        if (index === stages.length - 1) {
          setTimeout(() => {
            handleBootComplete();
          }, 500);
        }
      }, delay);
    });
  }, []);

  // 부팅 완료 - 즉시 대시보드로 이동
  const handleBootComplete = () => {
    console.log('🎉 부팅 애니메이션 완료 - 대시보드로 이동');
    setBootState('completed');
    router.push('/dashboard');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden'>
      {/* 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse' />
      </div>

      {/* 메인 부팅 화면 */}
      <div className='relative z-10 flex items-center justify-center min-h-screen'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className='text-center'
        >
          {/* 로고 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className='w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'
          >
            <Monitor className='w-12 h-12 text-white' />
          </motion.div>

          {/* 제목 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className='text-4xl font-bold text-white mb-4'
          >
            OpenManager Vibe v5
          </motion.h1>

          {/* 현재 단계 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className='text-xl text-blue-200 mb-8'
          >
            {currentStage}
          </motion.p>

          {/* 진행률 바 */}
          <div className='w-80 mx-auto bg-slate-700 rounded-full h-2 mb-6'>
            <motion.div
              className='bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full'
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* 진행률 텍스트 */}
          <motion.p
            className='text-slate-400 text-sm'
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {Math.round(progress)}% 완료
          </motion.p>

          {/* 애니메이션 아이콘들 */}
          <div className='flex justify-center gap-4 mt-8'>
            {[ServerIcon, Database, CheckCircle].map((Icon, index) => (
              <motion.div
                key={index}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className='w-8 h-8 text-blue-400'
              >
                <Icon />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
