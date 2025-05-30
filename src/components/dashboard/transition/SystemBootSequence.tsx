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
      // 🚨 즉시 시작 - initializing에서 core-loading으로 빠르게 전환
      setTimeout(() => {
        setCurrentPhase('core-loading');
      }, 500);
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

  // 🚨 임시 디버깅 - 화면이 비어있는 문제 해결
  console.log('🔍 SystemBootSequence 렌더링:', { 
    currentPhase, 
    skipAnimation, 
    isActive,
    servers: servers.length 
  });

  // 임시 응급처치 - 기본 로딩 화면 먼저 표시
  if (currentPhase === 'initializing' && servers.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1e293b',
        zIndex: 99999, // 더 높은 z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'system-ui',
        overflow: 'hidden' // 스크롤 방지
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid #3b82f6', 
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div>🚀 OpenManager 시스템 초기화 중...</div>
          <div style={{ fontSize: '16px', marginTop: '10px', opacity: 0.8 }}>
            서버 데이터: {servers.length}개 | 단계: {currentPhase}
          </div>
          <div style={{ 
            fontSize: '14px', 
            marginTop: '20px', 
            padding: '10px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            ✅ 로직 정상 작동 - CSS 렌더링 테스트 중
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000000',
      zIndex: 999998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {currentPhase === 'initializing' && (
        <DashboardLoader
          onBootComplete={handleCoreBootComplete}
          onPhaseChange={handlePhaseChange}
        />
      )}
      
      {currentPhase === 'server-spawning' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          zIndex: 999997,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ServerCardSpawner
            servers={servers}
            onServerSpawned={handleServerSpawned}
            onAllServersSpawned={handleAllServersSpawned}
            isActive={true}
            spawnDelay={400}
          />
        </div>
      )}
      
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

      {/* 🚨 응급 표시 확인 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem',
        background: 'rgba(34, 197, 94, 0.9)',
        color: 'white',
        borderRadius: '8px',
        zIndex: 999999,
        fontSize: '0.875rem',
        border: '2px solid #10b981'
      }}>
        🚀 SystemBootSequence 강제 렌더링 활성화
      </div>
    </div>
  );
});

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence; 