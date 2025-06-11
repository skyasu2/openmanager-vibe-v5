/**
 * 🎯 DashboardLoader Component v1.0
 *
 * 중앙 로딩 애니메이션 컴포넌트
 * - 시스템 부팅 시뮬레이션
 * - GPU 가속 애니메이션
 * - 실제 부팅 순서 반영
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Activity, CheckCircle } from 'lucide-react';
import { safeConsoleError } from '../../../lib/utils-functions';

interface DashboardLoaderProps {
  onBootComplete: () => void;
  onPhaseChange?: (phase: string, message: string) => void;
  externalProgress?: number;
  loadingPhase?:
    | 'system-starting'
    | 'data-loading'
    | 'python-warmup'
    | 'completed';
  estimatedTimeRemaining?: number;
  elapsedTime?: number;
}

// 시간 포맷 함수
const formatTime = (ms: number): string => {
  return `${Math.ceil(ms / 1000)}초`;
};

interface BootPhase {
  key: string;
  icon: React.ReactNode;
  message: string;
  color: string;
  duration: number;
}

const bootPhases: BootPhase[] = [
  {
    key: 'system-starting',
    icon: <Cpu className='w-8 h-8' />,
    message: '시스템 초기화 중...',
    color: 'text-blue-400',
    duration: 2000,
  },
  {
    key: 'data-loading',
    icon: <Database className='w-8 h-8' />,
    message: '데이터 로딩 중...',
    color: 'text-cyan-400',
    duration: 1500,
  },
  {
    key: 'python-warmup',
    icon: <Activity className='w-8 h-8' />,
    message: 'AI 엔진 최적화 중...',
    color: 'text-green-400',
    duration: 1000,
  },
  {
    key: 'completed',
    icon: <CheckCircle className='w-8 h-8' />,
    message: '준비 완료!',
    color: 'text-emerald-400',
    duration: 500,
  },
];

const DashboardLoader: React.FC<DashboardLoaderProps> = memo(
  ({
    onBootComplete,
    onPhaseChange,
    externalProgress = 0,
    loadingPhase = 'system-starting',
    estimatedTimeRemaining = 0,
    elapsedTime = 0,
  }) => {
    // 🚨 즉시 실행 로그 - 컴포넌트 렌더링 확인
    console.log('🚀 DashboardLoader 컴포넌트 시작!', {
      externalProgress,
      loadingPhase,
      estimatedTimeRemaining,
      elapsedTime,
    });

    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    // 완료되었으나 사용자 확인을 기다리는 상태
    const [allowClose, setAllowClose] = useState(false);

    // 외부 진행률과 내부 애니메이션 진행률 조합
    const displayProgress = useMemo(() => {
      // 외부 진행률이 있으면 우선 사용, 없으면 내부 진행률 사용
      return Math.max(progress, externalProgress);
    }, [progress, externalProgress]);

    // ✨ 완료 처리 통합 함수
    const handleComplete = useCallback(() => {
      if (!isCompleted) {
        console.log('🎉 DashboardLoader 완료 처리 실행');
        setIsCompleted(true);
        setIsAnimating(false);
        setTimeout(() => {
          try {
            onBootComplete();
          } catch (error) {
            safeConsoleError('❌ onBootComplete 콜백 에러', error);
            // 에러가 발생해도 계속 진행
          }
        }, 300);
      }
    }, [isCompleted, onBootComplete]);

    // 🚨 강제 완료 안전장치 (10초)
    useEffect(() => {
      const forceCompleteTimer = setTimeout(() => {
        console.log('🚨 10초 후 DashboardLoader 강제 완료');
        handleComplete();
      }, 10000);

      return () => clearTimeout(forceCompleteTimer);
    }, [handleComplete]);

    // 외부에서 전달받은 단계에 따른 인덱스 업데이트
    useEffect(() => {
      const phaseIndex = bootPhases.findIndex(
        phase => phase.key === loadingPhase
      );
      if (phaseIndex !== -1 && phaseIndex !== currentPhaseIndex) {
        console.log('🔄 단계 변경:', loadingPhase, '→ 인덱스:', phaseIndex);
        setCurrentPhaseIndex(phaseIndex);

        // 단계 변경 콜백 호출
        if (onPhaseChange) {
          try {
            onPhaseChange(loadingPhase, bootPhases[phaseIndex].message);
          } catch (error) {
            safeConsoleError('❌ onPhaseChange 콜백 에러', error);
          }
        }
      }
    }, [loadingPhase, currentPhaseIndex, onPhaseChange]);

    // 내부 진행률 애니메이션 (외부 진행률이 없을 때만)
    useEffect(() => {
      if (externalProgress > 0 || isCompleted) return;

      const interval = setInterval(() => {
        const elapsed = Date.now() % 5000; // 5초 주기
        const newProgress = Math.min((elapsed / 5000) * 100, 95);
        setProgress(newProgress);
      }, 100);

      return () => clearInterval(interval);
    }, [externalProgress, isCompleted]);

    // 진행률이 100%에 도달하면 완료 처리
    useEffect(() => {
      if (
        displayProgress >= 100 &&
        loadingPhase === 'completed' &&
        !allowClose
      ) {
        console.log('📊 진행률 100% 도달 - 사용자 확인 대기');
        setAllowClose(true);
      }
    }, [displayProgress, loadingPhase, allowClose]);

    const currentPhase = bootPhases[currentPhaseIndex];

    return (
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: 'blur(10px)',
            }}
            transition={{
              exit: { duration: 0.8, ease: 'easeOut' },
            }}
            className='fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden cursor-pointer'
            style={{
              // 🚨 Vercel 환경 및 SSR 대응 - 모든 스타일 인라인으로
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background:
                'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => {
              // 백그라운드 클릭으로도 닫고 싶다면 allowClose 검사
              if (allowClose && !isCompleted) {
                console.log('🖱️ DashboardLoader 클릭으로 완료');
                handleComplete();
              }
            }}
            onAnimationStart={() =>
              console.log('🎬 DashboardLoader 애니메이션 시작!')
            }
            onAnimationComplete={() =>
              console.log('🎬 DashboardLoader 애니메이션 완료!')
            }
          >
            {/* 배경 효과 */}
            <div className='absolute inset-0 overflow-hidden'>
              <div className='absolute -inset-10 opacity-30'>
                <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse' />
                <div
                  className='absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse'
                  style={{ animationDelay: '2s' }}
                />
                <div
                  className='absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse'
                  style={{ animationDelay: '4s' }}
                />
              </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className='relative z-10 text-center max-w-md mx-auto p-8'>
              {/* 브랜드 로고 영역 */}
              <motion.div
                className='mb-8'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg'>
                  <motion.div
                    className='text-white text-2xl font-bold'
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    OM
                  </motion.div>
                </div>
                <h1 className='text-3xl font-bold text-white mb-2'>
                  OpenManager
                </h1>
                <p className='text-blue-200 text-lg'>시스템 부팅 중...</p>
              </motion.div>

              {/* 진행률 바 */}
              <div className='mb-8'>
                <div className='w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner'>
                  <motion.div
                    className='h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg'
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className='flex justify-between mt-2 text-sm'>
                  <span className='text-blue-200'>
                    {Math.round(displayProgress)}%
                  </span>
                  <span className='text-blue-200'>
                    {displayProgress >= 100 ? '완료!' : '진행 중...'}
                  </span>
                </div>
              </div>

              {/* 현재 단계 표시 */}
              <motion.div
                className='mb-6'
                key={currentPhaseIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div
                  className={`flex items-center justify-center mb-3 ${currentPhase.color}`}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate:
                        currentPhase.key === 'python-warmup' ? [0, 360] : 0,
                    }}
                    transition={{
                      scale: { duration: 2, repeat: Infinity },
                      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                    }}
                  >
                    {currentPhase.icon}
                  </motion.div>
                </div>
                <p className='text-xl font-medium text-white'>
                  {currentPhase.message}
                </p>
              </motion.div>

              {/* 단계 표시기 */}
              <div className='flex justify-center space-x-3 mb-6'>
                {bootPhases.slice(0, -1).map((phase, index) => (
                  <motion.div
                    key={phase.key}
                    className={`w-3 h-3 rounded-full ${
                      index <= currentPhaseIndex
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                        : 'bg-gray-600'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>

              {/* 시간 정보 */}
              <div className='mt-4 text-center space-y-2'>
                {estimatedTimeRemaining > 0 && (
                  <div className='text-blue-200 text-sm'>
                    예상 남은 시간: {formatTime(estimatedTimeRemaining)}
                  </div>
                )}

                {elapsedTime > 0 && (
                  <div className='text-white/60 text-xs'>
                    경과 시간: {formatTime(elapsedTime)}
                  </div>
                )}

                <div className='text-cyan-300 text-xs font-medium'>
                  {loadingPhase === 'system-starting' &&
                    '🔧 시스템 코어 초기화 중...'}
                  {loadingPhase === 'data-loading' &&
                    '📊 실시간 서버 메트릭 수집 중...'}
                  {loadingPhase === 'python-warmup' &&
                    '🚀 AI 분석 엔진 최적화 중...'}
                  {loadingPhase === 'completed' && '✅ 모든 시스템 준비 완료!'}
                </div>
              </div>

              {/* 완료 후 안내 및 버튼 */}
              {allowClose && (
                <div className='flex flex-col items-center mt-8'>
                  <div className='flex items-center text-emerald-400 mb-4'>
                    <CheckCircle className='w-8 h-8 mr-2' />
                    <span className='text-2xl font-bold text-white'>
                      시스템 준비 완료!
                    </span>
                  </div>
                  <p className='text-blue-200 mb-6'>
                    OpenManager를 시작합니다...
                  </p>
                  <button
                    onClick={handleComplete}
                    className='absolute bottom-8 right-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg transition-colors duration-300'
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

DashboardLoader.displayName = 'DashboardLoader';

export default DashboardLoader;
