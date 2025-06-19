'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  CheckCircle,
  Server as ServerIcon,
  Database,
  Cpu,
  Zap,
  Brain,
} from 'lucide-react';

// 매트릭스 스타일 코드 레인 컴포넌트
const MatrixRain = () => {
  const chars =
    '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

  return (
    <div className='fixed inset-0 overflow-hidden pointer-events-none'>
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className='absolute text-green-400 text-sm font-mono opacity-20'
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
          }}
          animate={{
            y: ['0vh', '120vh'],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        >
          {Array.from({ length: 20 }).map((_, j) => (
            <div key={j} className='leading-4'>
              {chars[Math.floor(Math.random() * chars.length)]}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

// 파티클 시스템 컴포넌트
const ParticleSystem = () => {
  return (
    <div className='fixed inset-0 overflow-hidden pointer-events-none'>
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className='absolute w-1 h-1 bg-cyan-400 rounded-full'
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
          }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// AI 뇌파 시각화 컴포넌트
const AIBrainWave = () => {
  return (
    <div className='relative w-32 h-16 mx-auto mb-8'>
      <svg width='128' height='64' className='absolute inset-0'>
        <motion.path
          d='M0,32 Q16,16 32,32 T64,32 T96,32 T128,32'
          stroke='url(#brainGradient)'
          strokeWidth='2'
          fill='none'
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d='M0,32 Q20,48 40,32 T80,32 T120,32'
          stroke='url(#brainGradient2)'
          strokeWidth='2'
          fill='none'
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
        <defs>
          <linearGradient id='brainGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#00ff88' />
            <stop offset='50%' stopColor='#00ccff' />
            <stop offset='100%' stopColor='#8844ff' />
          </linearGradient>
          <linearGradient id='brainGradient2' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#ff0088' />
            <stop offset='50%' stopColor='#ffaa00' />
            <stop offset='100%' stopColor='#00ff88' />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// 홀로그램 텍스트 컴포넌트
const HologramText = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        textShadow: [
          '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88',
          '0 0 10px #00ccff, 0 0 20px #00ccff, 0 0 30px #00ccff',
          '0 0 5px #8844ff, 0 0 10px #8844ff, 0 0 15px #8844ff',
          '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88',
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
      {/* 글리치 효과 */}
      <motion.div
        className='absolute inset-0 opacity-30'
        animate={{
          x: [0, 2, -2, 0],
          opacity: [0, 0.3, 0, 0],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: Math.random() * 5 + 2,
        }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #ff0088 50%, transparent 100%)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  );
};

// 3D 로딩 스피너 컴포넌트
const CyberSpinner = () => {
  return (
    <div className='relative w-32 h-32 mx-auto mb-8'>
      {/* 외부 링 */}
      <motion.div
        className='absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-purple-500 rounded-full'
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      {/* 중간 링 */}
      <motion.div
        className='absolute inset-4 border-4 border-transparent border-b-green-400 border-l-blue-500 rounded-full'
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      {/* 내부 링 */}
      <motion.div
        className='absolute inset-8 border-4 border-transparent border-t-pink-400 border-r-yellow-500 rounded-full'
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {/* 중앙 코어 */}
      <motion.div
        className='absolute inset-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full'
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className='w-full h-full rounded-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse' />
      </motion.div>
    </div>
  );
};

export default function SystemBootPage() {
  const router = useRouter();
  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );
  const [currentStage, setCurrentStage] = useState<string>('AI 시스템 초기화');
  const [progress, setProgress] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');

  const stages = [
    {
      name: 'AI 시스템 초기화',
      delay: 800,
      text: 'Neural networks activating...',
    },
    {
      name: '양자 프로세서 동기화',
      delay: 1600,
      text: 'Quantum processors syncing...',
    },
    {
      name: '홀로그래픽 인터페이스 로딩',
      delay: 2400,
      text: 'Holographic interface loading...',
    },
    {
      name: '사이버 보안 프로토콜 활성화',
      delay: 3200,
      text: 'Cyber security protocols active...',
    },
    {
      name: '시스템 완전 가동',
      delay: 4000,
      text: 'System fully operational...',
    },
  ];

  // 타이핑 애니메이션 효과
  useEffect(() => {
    const currentStageData = stages.find(s => s.name === currentStage);
    if (currentStageData) {
      const text = currentStageData.text;
      let i = 0;
      setTypewriterText('');

      const typeInterval = setInterval(() => {
        if (i < text.length) {
          setTypewriterText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [currentStage]);

  // 🚀 가벼운 애니메이션만 실행 (실제 데이터 로딩 없음)
  useEffect(() => {
    console.log('🚀 AWESOME 사이버펑크 부팅 애니메이션 시작');

    stages.forEach(({ name, delay }, index) => {
      setTimeout(() => {
        setCurrentStage(name);
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
    console.log('🎉 AWESOME 부팅 애니메이션 완료 - 대시보드로 이동');
    setBootState('completed');
    router.push('/dashboard');
  };

  return (
    <div className='min-h-screen bg-black relative overflow-hidden'>
      {/* 매트릭스 코드 레인 배경 */}
      <MatrixRain />

      {/* 파티클 시스템 */}
      <ParticleSystem />

      {/* 네온 그라데이션 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20' />
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl animate-pulse' />
      </div>

      {/* 메인 부팅 화면 */}
      <div className='relative z-10 flex items-center justify-center min-h-screen'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className='text-center max-w-2xl px-8'
        >
          {/* 3D 로딩 스피너 */}
          <CyberSpinner />

          {/* AI 뇌파 시각화 */}
          <AIBrainWave />

          {/* 홀로그램 제목 */}
          <HologramText className='text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent'>
            OpenManager Vibe v5
          </HologramText>

          {/* 부제목 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className='text-xl text-cyan-300 mb-8 font-mono'
          >
            CYBERPUNK AI SYSTEM
          </motion.p>

          {/* 현재 단계 */}
          <HologramText className='text-2xl text-green-400 mb-4 font-mono'>
            {currentStage}
          </HologramText>

          {/* 타이핑 애니메이션 텍스트 */}
          <motion.div className='text-cyan-200 mb-8 font-mono h-6'>
            {typewriterText}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className='text-green-400'
            >
              |
            </motion.span>
          </motion.div>

          {/* 네온 진행률 바 */}
          <div className='w-96 mx-auto mb-6 relative'>
            <div className='bg-gray-800 rounded-full h-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'>
              <motion.div
                className='h-full rounded-full relative overflow-hidden'
                style={{
                  background:
                    'linear-gradient(90deg, #00ff88, #00ccff, #8844ff)',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* 진행률 바 내부 애니메이션 */}
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* 홀로그램 진행률 텍스트 */}
          <HologramText className='text-cyan-400 text-lg font-mono mb-8'>
            {Math.round(progress)}% COMPLETE
          </HologramText>

          {/* 사이버 아이콘들 */}
          <div className='flex justify-center gap-6 mb-8'>
            {[Brain, Cpu, ServerIcon, Database, Zap, CheckCircle].map(
              (Icon, index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.2, 1],
                    rotateY: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: 'easeInOut',
                  }}
                  className='relative'
                >
                  <Icon
                    className='w-8 h-8 text-cyan-400'
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))',
                    }}
                  />
                  {/* 아이콘 글로우 효과 */}
                  <motion.div
                    className='absolute inset-0 bg-cyan-400/20 rounded-full blur-lg'
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  />
                </motion.div>
              )
            )}
          </div>

          {/* 하단 사이버 메시지 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className='text-green-400/70 text-sm font-mono'
          >
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              [ NEURAL NETWORK SYNCHRONIZATION IN PROGRESS ]
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

      {/* 화면 테두리 네온 효과 */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute inset-0 border-2 border-cyan-500/20 shadow-lg shadow-cyan-500/10' />
        <motion.div
          className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className='absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent'
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
