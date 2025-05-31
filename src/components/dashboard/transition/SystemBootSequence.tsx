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
}

type BootPhase = 'initializing' | 'core-loading' | 'server-spawning' | 'finalizing' | 'complete';

const SystemBootSequence: React.FC<SystemBootSequenceProps> = memo(({
  servers,
  onBootComplete,
  onServerSpawned,
  skipAnimation = false,
  autoStart = true
}) => {
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [showSpawning, setShowSpawning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // 애니메이션 스킵 시 즉시 완료
  useEffect(() => {
    if (skipAnimation) {
      setIsComplete(true);
      onBootComplete();
      return;
    }
  }, [skipAnimation, onBootComplete]);

  // DashboardLoader 완료 핸들러
  const handleBootComplete = useCallback(() => {
    console.log('✅ Core boot completed, starting server spawning');
    setShowBootSequence(false);
    setShowSpawning(true);
  }, []);

  // 최종 완료 핸들러
  const handleSpawnerComplete = useCallback(() => {
    console.log('🎉 All spawning completed');
    setShowSpawning(false);
    setIsComplete(true);
    onBootComplete();
  }, [onBootComplete]);

  if (skipAnimation || isComplete) {
    return null;
  }

  return (
    <SmoothTransition
      isLoading={!isComplete}
      className="fixed inset-0 z-50"
    >
      {showBootSequence && (
        <DashboardLoader
          onBootComplete={handleBootComplete}
          onPhaseChange={(phase, message) => {
            console.log(`Phase: ${phase}, Message: ${message}`);
          }}
        />
      )}
      
      {showSpawning && (
        <ServerCardSpawner
          servers={servers}
          onServerSpawned={onServerSpawned}
          onAllServersSpawned={handleSpawnerComplete}
          isActive={true}
          spawnDelay={400}
        />
      )}
    </SmoothTransition>
  );
});

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence; 