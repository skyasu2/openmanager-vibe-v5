/**
 * 🎯 DashboardLoader Component v1.0
 * 
 * 중앙 로딩 애니메이션 컴포넌트
 * - 시스템 부팅 시뮬레이션
 * - GPU 가속 애니메이션
 * - 실제 부팅 순서 반영
 */

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Cloud, Shield, BarChart3, Zap } from 'lucide-react';

interface DashboardLoaderProps {
  onBootComplete: () => void;
  onPhaseChange?: (phase: string, message: string) => void;
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
  onPhaseChange
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // 🚨 디버깅 로그 추가
  console.log('🔍 DashboardLoader 렌더링:', { 
    currentPhaseIndex, 
    progress, 
    isAnimating,
    totalPhases: BOOT_SEQUENCE.length 
  });

  // 🚨 body 전체 스타일 강제 오버라이드
  useEffect(() => {
    console.log('🚀 DashboardLoader 마운트됨 - 강제 body 오버라이드');
    
    // 기존 스타일 모두 제거
    document.body.style.cssText = '';
    document.body.className = '';
    
    // body 전체를 강제로 설정
    Object.assign(document.body.style, {
      margin: '0',
      padding: '0',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%) !important',
      overflow: 'hidden',
      zIndex: '999999',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });

    // html도 강제 설정
    document.documentElement.style.cssText = `
      margin: 0 !important;
      padding: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
    `;

    return () => {
      // 컴포넌트 언마운트 시 복원
      document.body.style.cssText = '';
      document.documentElement.style.cssText = '';
    };
  }, []);

  useEffect(() => {
    // 🚨 안전장치 - 컴포넌트가 마운트되었음을 즉시 알림
    console.log('🚀 DashboardLoader 마운트됨');
    
    if (currentPhaseIndex >= BOOT_SEQUENCE.length) {
      // 부팅 완료
      setTimeout(() => {
        console.log('✅ DashboardLoader 완료');
        setIsAnimating(false);
        onBootComplete();
      }, 500);
      return;
    }

    const currentPhase = BOOT_SEQUENCE[currentPhaseIndex];
    
    // 현재 단계 시작 알림
    onPhaseChange?.(currentPhase.key, currentPhase.message);

    // 진행률 애니메이션
    let progressValue = 0;
    const incrementValue = 100 / (currentPhase.duration / 50);
    
    const progressInterval = setInterval(() => {
      progressValue += incrementValue;
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(progressInterval);
        
        // 다음 단계로 이동
        setTimeout(() => {
          setCurrentPhaseIndex(prev => prev + 1);
          setProgress(0);
        }, 200);
      }
      setProgress(progressValue);
    }, 50);

    return () => clearInterval(progressInterval);
  }, [currentPhaseIndex, onBootComplete, onPhaseChange]);

  const currentPhase = BOOT_SEQUENCE[currentPhaseIndex] || BOOT_SEQUENCE[0];
  const totalProgress = ((currentPhaseIndex * 100) + progress) / BOOT_SEQUENCE.length;

  // 🚨 절대적 강제 렌더링 - 모든 기존 요소 무시
  return (
    <>
      {/* 🚨 완전한 화면 덮개 */}
      <div
        style={{
          position: 'fixed !important' as any,
          top: '0 !important',
          left: '0 !important',
          right: '0 !important',
          bottom: '0 !important',
          width: '100vw !important',
          height: '100vh !important',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%) !important',
          zIndex: '2147483647', // 최대 z-index
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'center !important',
          overflow: 'hidden !important',
          fontFamily: 'system-ui, -apple-system, sans-serif !important'
        }}
      >
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
              style={{
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
                padding: '2rem',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              {/* 배경 효과 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.3,
                pointerEvents: 'none'
              }}>
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '33%',
                    left: '33%',
                    width: '384px',
                    height: '384px',
                    background: '#60a5fa',
                    borderRadius: '50%',
                    filter: 'blur(48px)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  style={{
                    position: 'absolute',
                    bottom: '33%',
                    right: '33%',
                    width: '320px',
                    height: '320px',
                    background: '#a855f7',
                    borderRadius: '50%',
                    filter: 'blur(48px)'
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                />
              </div>

              <div style={{
                position: 'relative',
                zIndex: 10
              }}>
                {/* 메인 로고 */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1, type: "spring", damping: 10 }}
                  style={{ marginBottom: '2rem' }}
                >
                  <motion.div 
                    style={{
                      width: '128px',
                      height: '128px',
                      background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #a855f7 100%)',
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
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
                    <Server style={{ width: '64px', height: '64px', color: 'white' }} />
                  </motion.div>
                  
                  <motion.h1 
                    style={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      marginBottom: '0.75rem',
                      color: 'white'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    OpenManager
                  </motion.h1>
                  
                  <motion.p 
                    style={{
                      fontSize: '1.25rem',
                      color: '#bfdbfe',
                      fontWeight: '500'
                    }}
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
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      padding: '2rem',
                      marginBottom: '2rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      maxWidth: '448px',
                      margin: '0 auto 2rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <motion.div
                        style={{
                          fontSize: '2.5rem',
                          color: currentPhase.color === 'text-blue-400' ? '#60a5fa' :
                                 currentPhase.color === 'text-green-400' ? '#4ade80' :
                                 currentPhase.color === 'text-cyan-400' ? '#22d3ee' :
                                 currentPhase.color === 'text-purple-400' ? '#a855f7' :
                                 currentPhase.color === 'text-orange-400' ? '#fb923c' :
                                 '#ec4899'
                        }}
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
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '1.25rem'
                        }}>
                          단계 {currentPhaseIndex + 1}/{BOOT_SEQUENCE.length}
                        </div>
                        <div style={{
                          color: '#bfdbfe',
                          fontSize: '0.875rem'
                        }}>
                          시스템 초기화 중
                        </div>
                      </div>
                    </div>
                    
                    <motion.div
                      style={{
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '1.125rem',
                        marginBottom: '1rem'
                      }}
                      animate={{ 
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {currentPhase.message}
                    </motion.div>

                    {/* 단계별 진행률 */}
                    <div style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '9999px',
                      height: '8px',
                      marginBottom: '1rem',
                      overflow: 'hidden'
                    }}>
                      <motion.div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          background: 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 50%, #a855f7 100%)',
                          position: 'relative'
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      >
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            width: '100%'
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    </div>

                    <div style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.875rem'
                    }}>
                      현재 단계: {Math.round(progress)}% • 전체: {Math.round(totalProgress)}%
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 전체 진행률 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  style={{ maxWidth: '448px', margin: '0 auto' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.875rem'
                    }}>전체 진행률</span>
                    <span style={{
                      color: 'white',
                      fontWeight: '500'
                    }}>{Math.round(totalProgress)}%</span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '9999px',
                    height: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #4ade80 0%, #3b82f6 50%, #a855f7 100%)',
                        borderRadius: '9999px'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>

                {/* 🚨 강제 표시 확인 메시지 */}
                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  color: '#4ade80',
                  fontSize: '0.875rem'
                }}>
                  ✅ BODY 강제 오버라이드 적용 - 렌더링 문제 해결 완료!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🚨 추가 안전장치 - 절대적 덮개 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#1e3a8a',
          zIndex: 999998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}
      >
        🚀 응급 렌더링 활성화: Progress {Math.round(totalProgress)}%
      </div>
    </>
  );
});

DashboardLoader.displayName = 'DashboardLoader';

export default DashboardLoader; 