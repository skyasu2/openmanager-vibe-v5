/**
 * 🚀 SystemBootSequence Component v1.0
 * 
 * 전체 시스템 부팅 시퀀스 관리
 * - DashboardLoader와 ServerCardSpawner 조합
 * - 실제 데이터와 연동
 * - 완전한 전환 제어
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from './DashboardLoader';
import ServerCardSpawner from './ServerCardSpawner';
import SmoothTransition from './SmoothTransition';
import { Server } from '../../../types/server';

interface SystemBootSequenceProps {
  servers: Server[];
  onBootComplete: () => void;
  onServerSpawned?: (server: Server, index: number) => void;
  skipAnimation?: boolean;
  autoStart?: boolean;
  loadingProgress?: number;
  loadingPhase?: 'system-starting' | 'data-loading' | 'python-warmup' | 'completed';
  estimatedTimeRemaining?: number;
  elapsedTime?: number;
}

type BootPhase = 'initializing' | 'core-loading' | 'server-spawning' | 'finalizing' | 'complete';

const SystemBootSequence: React.FC<SystemBootSequenceProps> = memo(({
  servers,
  onBootComplete,
  onServerSpawned,
  skipAnimation = false,
  autoStart = true,
  loadingProgress = 0,
  loadingPhase = 'system-starting',
  estimatedTimeRemaining = 0,
  elapsedTime = 0
}) => {
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [showSpawning, setShowSpawning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // ✨ 완료 처리 통합 함수
  const handleFinalComplete = useCallback(() => {
    if (!isComplete) {
      console.log('🎉 SystemBootSequence 최종 완료 처리');
      setIsComplete(true);
      setShowBootSequence(false);
      setShowSpawning(false);
      onBootComplete();
    }
  }, [isComplete, onBootComplete]);

  // 애니메이션 스킵 시 즉시 완료
  useEffect(() => {
    if (skipAnimation) {
      handleFinalComplete();
      return;
    }
  }, [skipAnimation, handleFinalComplete]);

  // 🚨 강제 완료 안전장치 (15초)
  useEffect(() => {
    const forceCompleteTimer = setTimeout(() => {
      console.log('🚨 15초 후 SystemBootSequence 강제 완료');
      handleFinalComplete();
    }, 15000);

    return () => clearTimeout(forceCompleteTimer);
  }, [handleFinalComplete]);

  // 🎮 ESC 키 강제 완료
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('🚀 ESC 키로 강제 완료');
        handleFinalComplete();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFinalComplete]);

  // ✨ 로딩 완료 조건 개선 - 외부 진행률 기반
  useEffect(() => {
    if (loadingProgress >= 100 && loadingPhase === 'completed') {
      console.log('✅ External loading completed, starting server spawning');
      setShowBootSequence(false);
      setShowSpawning(true);
    }
  }, [loadingProgress, loadingPhase]);

  // DashboardLoader 완료 핸들러
  const handleBootComplete = useCallback(() => {
    console.log('✅ Core boot completed, starting server spawning');
    setShowBootSequence(false);
    setShowSpawning(true);
  }, []);

  // 최종 완료 핸들러
  const handleSpawnerComplete = useCallback(() => {
    console.log('🎉 All spawning completed');
    handleFinalComplete();
  }, [handleFinalComplete]);

  // 🛠️ 개발자 도구 등록
  useEffect(() => {
    (window as any).debugOpenManager = {
      forceComplete: () => {
        console.log('🚨 강제 완료 실행');
        handleFinalComplete();
      },
      skipAnimation: () => {
        console.log('🚀 애니메이션 스킵');
        handleFinalComplete();
      },
      getState: () => ({
        showBootSequence,
        showSpawning,
        isComplete,
        loadingProgress,
        loadingPhase
      })
    };
  }, [handleFinalComplete, showBootSequence, showSpawning, isComplete, loadingProgress, loadingPhase]);

  if (skipAnimation || isComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* 🚨 긴급 수정: SmoothTransition 우회 - 직접 렌더링 */}
      <AnimatePresence mode="wait">
        {showBootSequence && (
          <motion.div
            key="boot-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <DashboardLoader
              onBootComplete={handleBootComplete}
              onPhaseChange={(phase, message) => {
                console.log(`Phase: ${phase}, Message: ${message}`);
              }}
              externalProgress={loadingProgress}
              loadingPhase={loadingPhase}
              estimatedTimeRemaining={estimatedTimeRemaining}
              elapsedTime={elapsedTime}
            />
          </motion.div>
        )}
        
        {showSpawning && (
          <motion.div
            key="server-spawner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <ServerCardSpawner
              servers={servers}
              onServerSpawned={onServerSpawned}
              onAllServersSpawned={handleSpawnerComplete}
              isActive={true}
              spawnDelay={400}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛠️ 디버깅 정보 패널 */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-lg text-white text-xs p-3 rounded-lg border border-white/20 max-w-xs"
      >
        <div className="space-y-1">
          <div className="font-semibold text-cyan-400 mb-2">🛠️ 개발자 도구</div>
          <div>진행률: {loadingProgress}%</div>
          <div>단계: {loadingPhase}</div>
          <div>부팅: {showBootSequence ? '✅' : '❌'}</div>
          <div>생성: {showSpawning ? '✅' : '❌'}</div>
          <div>완료: {isComplete ? '✅' : '❌'}</div>
          <div className="border-t border-white/20 pt-2 mt-2">
            <div className="text-yellow-300">🚀 강제 완료:</div>
            <div>• ESC 키</div>
            <div>• F12 → debugOpenManager.forceComplete()</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence; 