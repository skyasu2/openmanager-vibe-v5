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
  const [currentPhase, setCurrentPhase] = useState<BootPhase>('initializing');
  const [bootProgress, setBootProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('시스템 초기화 중...');
  const [isActive, setIsActive] = useState(false);

  // 애니메이션 스킵 시 즉시 완료
  useEffect(() => {
    if (skipAnimation) {
      setCurrentPhase('complete');
      onBootComplete();
      return;
    }
    
    if (autoStart) {
      setIsActive(true);
    }
  }, [skipAnimation, autoStart, onBootComplete]);

  // 부팅 단계별 메시지
  const getPhaseMessage = (phase: BootPhase): string => {
    switch (phase) {
      case 'initializing':
        return '🔧 시스템 초기화 중...';
      case 'core-loading':
        return '⚙️ 핵심 시스템 로딩...';
      case 'server-spawning':
        return '🌐 서버 인프라 구동 중...';
      case 'finalizing':
        return '✅ 시스템 준비 완료...';
      case 'complete':
        return '🎉 대시보드 활성화!';
      default:
        return '시스템 부팅 중...';
    }
  };

  // DashboardLoader 완료 핸들러
  const handleCoreBootComplete = useCallback(() => {
    console.log('✅ Core boot completed, starting server spawning');
    setCurrentPhase('server-spawning');
    setBootProgress(60);
  }, []);

  // DashboardLoader 단계 변경 핸들러
  const handlePhaseChange = useCallback((phase: string, message: string) => {
    setCurrentMessage(message);
    
    // 진행률 업데이트 (코어 로딩 단계: 0-60%)
    switch (phase) {
      case 'core':
        setBootProgress(10);
        break;
      case 'metrics':
        setBootProgress(20);
        break;
      case 'network':
        setBootProgress(30);
        break;
      case 'security':
        setBootProgress(40);
        break;
      case 'database':
        setBootProgress(50);
        break;
      case 'servers':
        setBootProgress(55);
        break;
    }
  }, []);

  // 서버 스폰 핸들러
  const handleServerSpawned = useCallback((server: Server, index: number) => {
    console.log(`🌐 Server spawned: ${server.name} (${index + 1}/${servers.length})`);
    
    // 서버 스폰 진행률 업데이트 (60-90%)
    const serverProgress = (index + 1) / servers.length;
    const adjustedProgress = 60 + (serverProgress * 30);
    setBootProgress(adjustedProgress);
    
    onServerSpawned?.(server, index);
  }, [servers.length, onServerSpawned]);

  // 모든 서버 스폰 완료 핸들러
  const handleAllServersSpawned = useCallback(() => {
    console.log('🎉 All servers spawned, finalizing boot sequence');
    setCurrentPhase('finalizing');
    setBootProgress(90);
    setCurrentMessage('✅ 실시간 모니터링 활성화...');
    
    // 최종 단계
    setTimeout(() => {
      setBootProgress(100);
      setCurrentMessage('🎉 대시보드 준비 완료!');
      
      setTimeout(() => {
        setCurrentPhase('complete');
        onBootComplete();
      }, 800);
    }, 1200);
  }, [onBootComplete]);

  // 진행률 기반 색상 결정
  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'from-blue-400 to-cyan-400';
    if (progress < 60) return 'from-cyan-400 to-green-400';
    if (progress < 90) return 'from-green-400 to-yellow-400';
    return 'from-yellow-400 to-green-500';
  };

  // 렌더링 단계별 분기
  if (skipAnimation || currentPhase === 'complete') {
    return null;
  }

  return (
    <SmoothTransition
      isLoading={true}
      className="fixed inset-0 z-50"
      loadingComponent={
        <div className="relative w-full h-full">
          {/* 메인 로더 (코어 시스템 로딩) */}
          <AnimatePresence mode="wait">
            {(currentPhase === 'initializing' || currentPhase === 'core-loading') && (
              <DashboardLoader
                onBootComplete={handleCoreBootComplete}
                onPhaseChange={handlePhaseChange}
              />
            )}
          </AnimatePresence>

          {/* 서버 스포너 (서버 인프라 구동) */}
          {currentPhase === 'server-spawning' && (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
              {/* 배경 효과 */}
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400 rounded-full filter blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.6, 0.2]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                />
              </div>

              {/* 중앙 상태 표시 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center max-w-md mx-auto px-8"
                >
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    animate={{ 
                      boxShadow: [
                        "0 0 40px rgba(34, 197, 94, 0.5)",
                        "0 0 80px rgba(34, 197, 94, 0.8)",
                        "0 0 40px rgba(34, 197, 94, 0.5)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: { duration: 3, repeat: Infinity }
                    }}
                  >
                    <motion.span
                      className="text-4xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      🌐
                    </motion.span>
                  </motion.div>
                  
                  <motion.h2 
                    className="text-3xl font-bold text-white mb-4"
                    animate={{ 
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    서버 인프라 구동 중
                  </motion.h2>
                  
                  <motion.p 
                    className="text-lg text-green-200 mb-6"
                    key={currentMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentMessage}
                  </motion.p>

                  {/* 전체 진행률 */}
                  <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white/80 text-sm">전체 진행률</span>
                      <span className="text-white font-bold text-lg">{Math.round(bootProgress)}%</span>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(bootProgress)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${bootProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 서버 카드 스포너 */}
              <ServerCardSpawner
                servers={servers}
                onServerSpawned={handleServerSpawned}
                onAllServersSpawned={handleAllServersSpawned}
                isActive={true}
                spawnDelay={400}
              />
            </div>
          )}

          {/* 최종 단계 */}
          {currentPhase === 'finalizing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                >
                  <motion.span
                    className="text-6xl"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, ease: "linear" }}
                  >
                    ✅
                  </motion.span>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  시스템 준비 완료!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-green-200"
                >
                  OpenManager 대시보드를 시작합니다
                </motion.p>
              </div>
            </motion.div>
          )}
        </div>
      }
    >
      {/* 빈 children - 로딩 중에는 표시하지 않음 */}
      <div></div>
    </SmoothTransition>
  );
});

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence; 