/**
 * 🚀 SystemBootSequence Component v2.1 - 호환성 개선
 *
 * 간단하고 안정적인 부팅 시퀀스 관리
 * - 프론트엔드 구성 90% 유지
 * - 복잡한 의존성 제거로 호환성 문제 해결
 * - 자연스러운 로딩 플로우 제공
 */

'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Server } from '../../../types/server';

interface SystemBootSequenceProps {
  servers: Server[];
  onBootComplete: () => void;
  onServerSpawned?: (server: Server, index: number) => void;
  skipAnimation?: boolean;
  autoStart?: boolean;
  loadingProgress?: number;
  loadingPhase?:
    | 'system-starting'
    | 'data-loading'
    | 'python-warmup'
    | 'completed';
  estimatedTimeRemaining?: number;
  elapsedTime?: number;
}

// 간단한 로딩 단계 정의
const LOADING_STAGES = [
  { name: '시스템 초기화', icon: '⚙️', duration: 1500 },
  { name: '데이터 로딩', icon: '📊', duration: 1200 },
  { name: 'AI 엔진 준비', icon: '🧠', duration: 800 },
  { name: '서버 연결', icon: '🌐', duration: 600 },
  { name: '완료', icon: '✅', duration: 300 },
];

const SystemBootSequence: React.FC<SystemBootSequenceProps> = memo(
  ({
    servers,
    onBootComplete,
    onServerSpawned,
    skipAnimation = false,
    autoStart = true,
    loadingProgress = 0,
    loadingPhase = 'system-starting',
    estimatedTimeRemaining = 0,
    elapsedTime = 0,
  }) => {
    const [currentStage, setCurrentStage] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [showEmergencyButton, setShowEmergencyButton] = useState(false);
    const [progress, setProgress] = useState(0);

    const router = useRouter();

    // 최종 완료 처리 함수
    const handleFinalComplete = useCallback(() => {
      if (!isComplete) {
        console.log('🎉 SystemBootSequence 완료 처리');
        setIsComplete(true);
        onBootComplete();
      }
    }, [isComplete, onBootComplete]);

    // 스킵 조건 체크
    useEffect(() => {
      if (skipAnimation) {
        console.log('⚡ 애니메이션 스킵 - 즉시 완료');
        handleFinalComplete();
      }
    }, [skipAnimation, handleFinalComplete]);

    // 자동 진행 로직
    useEffect(() => {
      if (!autoStart || skipAnimation || isComplete) return;

      console.log('🎬 간단한 부팅 시퀀스 시작');

      let stageTimer: NodeJS.Timeout;
      let progressTimer: NodeJS.Timeout;

      const runStage = (stageIndex: number) => {
        if (stageIndex >= LOADING_STAGES.length) {
          handleFinalComplete();
          return;
        }

        const stage = LOADING_STAGES[stageIndex];
        console.log(`📊 ${stage.name} 시작`);
        setCurrentStage(stageIndex);

        // 진행률 업데이트
        const startProgress = (stageIndex / LOADING_STAGES.length) * 100;
        const endProgress = ((stageIndex + 1) / LOADING_STAGES.length) * 100;

        let currentProgress = startProgress;
        progressTimer = setInterval(() => {
          currentProgress +=
            (endProgress - startProgress) / (stage.duration / 50);
          if (currentProgress >= endProgress) {
            currentProgress = endProgress;
            clearInterval(progressTimer);
          }
          setProgress(Math.min(currentProgress, 100));
        }, 50);

        // 다음 단계로 진행
        stageTimer = setTimeout(() => {
          clearInterval(progressTimer);
          runStage(stageIndex + 1);
        }, stage.duration);
      };

      runStage(0);

      // 안전장치: 10초 후 강제 완료
      const safetyTimer = setTimeout(() => {
        console.log('⏰ 안전장치 발동 - 강제 완료');
        handleFinalComplete();
      }, 10000);

      // 15초 후 비상 버튼 표시
      const emergencyTimer = setTimeout(() => {
        setShowEmergencyButton(true);
      }, 15000);

      return () => {
        clearTimeout(stageTimer);
        clearInterval(progressTimer);
        clearTimeout(safetyTimer);
        clearTimeout(emergencyTimer);
      };
    }, [autoStart, skipAnimation, isComplete, handleFinalComplete]);

    // 키보드 단축키
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['Enter', ' ', 'Escape'].includes(e.key) && !isComplete) {
          console.log(`🚀 ${e.key} 키로 즉시 완료`);
          handleFinalComplete();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleFinalComplete, isComplete]);

    // 개발자 도구
    useEffect(() => {
      (window as any).debugSystemBootSequence = {
        forceComplete: handleFinalComplete,
        getState: () => ({
          currentStage,
          isComplete,
          progress,
          serversCount: servers.length,
        }),
      };

      (window as any).emergencyCompleteBootSequence = handleFinalComplete;
    }, [
      handleFinalComplete,
      currentStage,
      isComplete,
      progress,
      servers.length,
    ]);

    if (skipAnimation || isComplete) {
      return null;
    }

    const currentStageData = LOADING_STAGES[currentStage] || LOADING_STAGES[0];

    return (
      <div
        className='fixed inset-0 z-50 bg-black cursor-pointer'
        onClick={() => {
          console.log('🖱️ 화면 클릭 - 즉시 완료 처리');
          handleFinalComplete();
        }}
      >
        {/* 배경 효과 */}
        <div className='absolute inset-0'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        </div>

        {/* 메인 로딩 화면 */}
        <div className='relative z-10 flex items-center justify-center min-h-screen'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='text-center space-y-8'
          >
            {/* 모든 단계 아이콘들을 세로로 배치 - 원형 배경과 함께 */}
            <div className='flex flex-col items-center justify-center space-y-6'>
              {LOADING_STAGES.map((stage, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{
                    scale: index === currentStage ? 1 : 0.85,
                    opacity: index <= currentStage ? 1 : 0.4,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className='relative'
                >
                  {/* 원형 배경 */}
                  <motion.div
                    animate={{
                      backgroundColor:
                        index === currentStage
                          ? 'rgba(59, 130, 246, 0.8)'
                          : index < currentStage
                            ? 'rgba(34, 197, 94, 0.6)'
                            : 'rgba(75, 85, 99, 0.4)',
                      boxShadow:
                        index === currentStage
                          ? '0 0 20px rgba(59, 130, 246, 0.5)'
                          : '0 0 0px transparent',
                    }}
                    transition={{ duration: 0.3 }}
                    className='w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20'
                  >
                    <span className='text-2xl'>{stage.icon}</span>
                  </motion.div>

                  {/* 연결선 (마지막 아이콘 제외) */}
                  {index < LOADING_STAGES.length - 1 && (
                    <div className='absolute top-full left-1/2 w-0.5 h-6 -translate-x-1/2'>
                      <motion.div
                        className='w-full bg-gradient-to-b from-blue-400 to-purple-400 rounded-full'
                        initial={{ scaleY: 0 }}
                        animate={{
                          scaleY: index < currentStage ? 1 : 0,
                          opacity: index < currentStage ? 1 : 0.3,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: index < currentStage ? 0.2 : 0,
                        }}
                        style={{ transformOrigin: 'top' }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* 현재 단계 이름 */}
            <motion.h2
              key={`title-${currentStage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-2xl font-bold text-white'
            >
              {currentStageData.name}
            </motion.h2>

            {/* 진행률 바 */}
            <div className='w-80 mx-auto'>
              <div className='flex justify-between text-sm text-gray-400 mb-2'>
                <span>{Math.round(progress)}%</span>
                <span>
                  {currentStage + 1} / {LOADING_STAGES.length}
                </span>
              </div>
              <div className='w-full bg-gray-700 rounded-full h-2'>
                <motion.div
                  className='bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full'
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* 로딩 점들 */}
            <div className='flex space-x-2 justify-center'>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className='w-2 h-2 bg-white rounded-full'
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* 비상 완료 버튼 */}
        <AnimatePresence>
          {showEmergencyButton && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[10000]'
            >
              <div className='bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-red-500/30 shadow-2xl max-w-sm'>
                <div className='text-center space-y-3'>
                  <div className='text-red-400 text-sm font-medium'>
                    🚨 로딩에 문제가 있나요?
                  </div>
                  <div className='text-gray-300 text-xs leading-relaxed'>
                    로딩이 오래 걸리고 있습니다. 아래 버튼으로 바로 이동하세요.
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      console.log('🚀 비상 완료 버튼 클릭');
                      handleFinalComplete();
                    }}
                    className='w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95'
                  >
                    🚀 대시보드로 이동
                  </button>
                  <div className='text-gray-400 text-xs'>
                    또는 화면 아무 곳이나 클릭하세요
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 사용자 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className='fixed bottom-4 left-4 text-white text-sm bg-black/50 backdrop-blur-lg p-4 rounded-lg border border-white/30 max-w-xs'
        >
          <div className='space-y-2'>
            <div className='text-cyan-300 font-medium'>💡 빠른 완료 방법</div>
            <div>🖱️ 화면 아무 곳이나 클릭</div>
            <div>⌨️ Enter, Space, ESC 키</div>
            <div>⏱️ 자동 완료: 약 5초</div>
          </div>
        </motion.div>
      </div>
    );
  }
);

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence;
