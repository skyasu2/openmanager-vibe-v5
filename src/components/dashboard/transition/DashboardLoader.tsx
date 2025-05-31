/**
 * 🎯 DashboardLoader Component v1.0
 * 
 * 중앙 로딩 애니메이션 컴포넌트
 * - 시스템 부팅 시뮬레이션
 * - GPU 가속 애니메이션
 * - 실제 부팅 순서 반영
 */

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Cloud, Shield, BarChart3, Zap } from 'lucide-react';

interface DashboardLoaderProps {
  onBootComplete: () => void;
  onPhaseChange?: (phase: string, message: string) => void;
  externalProgress?: number;
  loadingPhase?: 'minimum-wait' | 'actual-loading' | 'completed' | 'system-starting' | 'data-loading' | 'python-warmup';
  estimatedTimeRemaining?: number;
  elapsedTime?: number;
}

interface BootPhase {
  key: string;
  icon: React.ReactNode;
  message: string;
  color: string;
  duration: number;
}

const BOOT_SEQUENCE: BootPhase[] = [
  { 
    key: 'core', 
    icon: <Zap />, 
    message: '🔧 시스템 코어 로딩...', 
    color: 'text-blue-400', 
    duration: 800 
  },
  { 
    key: 'metrics', 
    icon: <BarChart3 />, 
    message: '📊 메트릭 수집기 시작...', 
    color: 'text-green-400', 
    duration: 700 
  },
  { 
    key: 'network', 
    icon: <Cloud />, 
    message: '🔗 네트워크 연결 확인...', 
    color: 'text-cyan-400', 
    duration: 600 
  },
  { 
    key: 'security', 
    icon: <Shield />, 
    message: '🔒 보안 시스템 초기화...', 
    color: 'text-purple-400', 
    duration: 700 
  },
  { 
    key: 'database', 
    icon: <Database />, 
    message: '🗄️ 데이터베이스 연결...', 
    color: 'text-orange-400', 
    duration: 800 
  },
  { 
    key: 'servers', 
    icon: <Server />, 
    message: '🌐 서버 인프라 구동...', 
    color: 'text-pink-400', 
    duration: 900 
  }
];

const DashboardLoader: React.FC<DashboardLoaderProps> = memo(({
  onBootComplete,
  onPhaseChange,
  externalProgress = 0,
  loadingPhase = 'minimum-wait',
  estimatedTimeRemaining = 0,
  elapsedTime = 0
}) => {
  // 🚨 즉시 실행 로그 - 컴포넌트 렌더링 확인
  console.log('🚀 DashboardLoader 컴포넌트 시작!', {
    externalProgress,
    loadingPhase,
    estimatedTimeRemaining,
    elapsedTime
  });
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

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
        onBootComplete();
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

  // ✨ 다중 완료 조건 처리
  useEffect(() => {
    if (isCompleted) return;

    // 조건 1: 외부에서 완료 신호
    if (externalProgress >= 100 && loadingPhase === 'completed') {
      console.log('✅ 외부 완료 신호 감지 - 즉시 완료');
      handleComplete();
      return;
    }
    
    // 조건 2: 내부 애니메이션 6단계 완료
    if (currentPhaseIndex >= BOOT_SEQUENCE.length) {
      console.log('✅ 6단계 애니메이션 완료 - 정상 완료');
      handleComplete();
      return;
    }

    // 조건 3: 경과 시간 기반 (8초 후)
    if (elapsedTime >= 8000) {
      console.log('✅ 8초 경과 - 시간 기반 완료');
      handleComplete();
      return;
    }

    // 내부 애니메이션 로직 (기존)
    const currentPhase = BOOT_SEQUENCE[currentPhaseIndex];
    onPhaseChange?.(currentPhase.key, currentPhase.message);

    let progressValue = 0;
    const incrementValue = 100 / (currentPhase.duration / 50);
    
    const progressInterval = setInterval(() => {
      progressValue += incrementValue;
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(progressInterval);
        
        setTimeout(() => {
          setCurrentPhaseIndex(prev => prev + 1);
          setProgress(0);
        }, 200);
      }
      setProgress(progressValue);
    }, 50);

    return () => clearInterval(progressInterval);
  }, [currentPhaseIndex, handleComplete, externalProgress, loadingPhase, elapsedTime, onPhaseChange, isCompleted]);

  const currentPhase = BOOT_SEQUENCE[currentPhaseIndex] || BOOT_SEQUENCE[0];
  const totalProgress = ((currentPhaseIndex * 100) + displayProgress) / BOOT_SEQUENCE.length;

  // 시간 포맷팅 헬퍼
  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return seconds > 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${seconds}초`;
  };

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            filter: 'blur(10px)'
          }}
          transition={{ 
            exit: { duration: 0.8, ease: 'easeOut' }
          }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden"
          style={{
            // 🚨 Vercel 환경 및 SSR 대응 - 모든 스타일 인라인으로
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onAnimationStart={() => console.log('🎬 DashboardLoader 애니메이션 시작!')}
          onAnimationComplete={() => console.log('🎬 DashboardLoader 애니메이션 완료!')}
        >
          {/* 배경 효과 */}
          <div className="absolute inset-0 opacity-30">
            <motion.div
              className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </div>

          <div className="relative z-10 text-center px-8">
            {/* 메인 로고 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring", damping: 10 }}
              className="mb-8"
            >
              <motion.div 
                className="w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                animate={{ 
                  boxShadow: [
                    "0 0 40px rgba(59, 130, 246, 0.5)",
                    "0 0 80px rgba(139, 92, 246, 0.8)",
                    "0 0 40px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 3, repeat: Infinity }
                }}
              >
                <Server className="w-16 h-16 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-5xl font-bold mb-3 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                OpenManager
              </motion.h1>
              
              <motion.p 
                className="text-xl text-blue-200 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                AI 서버 모니터링 시스템
              </motion.p>
            </motion.div>

            {/* 현재 단계 표시 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhaseIndex}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl max-w-md mx-auto"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <motion.div
                    className={`text-4xl ${currentPhase.color}`}
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1.5, repeat: Infinity }
                    }}
                  >
                    {currentPhase.icon}
                  </motion.div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-xl">
                      단계 {currentPhaseIndex + 1}/{BOOT_SEQUENCE.length}
                    </div>
                    <div className="text-blue-200 text-sm">
                      시스템 초기화 중
                    </div>
                  </div>
                </div>
                
                <motion.div
                  className="text-white font-medium text-lg mb-4"
                  animate={{ 
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentPhase.message}
                </motion.div>

                {/* 단계별 진행률 */}
                <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>

                <div className="text-white/80 text-sm">
                  현재 단계: {Math.round(displayProgress)}% • 전체: {Math.round(totalProgress)}%
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 전체 진행률 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm">전체 진행률</span>
                <span className="text-white font-medium">{Math.round(totalProgress)}%</span>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              
              {/* ✨ 추가된 로딩 상태 정보 */}
              <div className="mt-4 text-center space-y-2">
                {estimatedTimeRemaining > 0 && (
                  <div className="text-blue-200 text-sm">
                    예상 남은 시간: {formatTime(estimatedTimeRemaining)}
                  </div>
                )}
                
                {elapsedTime > 0 && (
                  <div className="text-white/60 text-xs">
                    경과 시간: {formatTime(elapsedTime)}
                  </div>
                )}
                
                <div className="text-cyan-300 text-xs font-medium">
                  {loadingPhase === 'system-starting' && '�� 시스템 코어 초기화 중...'}
                  {loadingPhase === 'data-loading' && '📊 서버 데이터 수집 중...'}
                  {loadingPhase === 'python-warmup' && '🐍 파이썬 엔진 웜업 중...'}
                  {loadingPhase === 'completed' && '✅ 모든 시스템 준비 완료!'}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

DashboardLoader.displayName = 'DashboardLoader';

export default DashboardLoader; 