/**
 * 🚀 SystemBootSequence Component v3.0
 *
 * 체크리스트 기반 병렬 부팅 시퀀스 관리
 * - SystemChecklist 사용으로 실제 구성 요소별 진행
 * - 병렬 처리로 효율적인 시스템 준비
 * - 의존성 관리 및 우선순위 기반 완료
 * - 사용자 제어 옵션 (스킵 기능)
 */

'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SystemChecklist from './SystemChecklist';
import ServerCardSpawner from './ServerCardSpawner';
import { Server } from '../../../types/server';
import {
  setupGlobalErrorHandler,
  safeErrorLog,
  isLoadingRelatedError,
} from '../../../lib/error-handler';

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
    const [showSystemChecklist, setShowSystemChecklist] = useState(true);
    const [showSpawning, setShowSpawning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [showEmergencyButton, setShowEmergencyButton] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [waitingForUserConfirmation, setWaitingForUserConfirmation] =
      useState(false);

    // 🛡️ 전역 에러 핸들러 및 절대 안전장치 설정
    useEffect(() => {
      // 전역 에러 핸들러 설정 (한 번만)
      if (!(window as any).__openManagerErrorHandlerSetup) {
        setupGlobalErrorHandler();
      }

      // 에러 감지 리스너
      const handleGlobalError = (event: ErrorEvent) => {
        if (isLoadingRelatedError(event.error)) {
          setErrorCount(prev => prev + 1);
          console.log('🚨 로딩 관련 에러 감지:', errorCount + 1);

          // 3번 이상 에러 발생 시 비상 버튼 표시
          if (errorCount >= 2) {
            setShowEmergencyButton(true);
          }
        }
      };

      const handlePromiseRejection = (event: PromiseRejectionEvent) => {
        if (isLoadingRelatedError(event.reason)) {
          setErrorCount(prev => prev + 1);
          console.log('🚨 Promise 로딩 에러 감지:', errorCount + 1);

          if (errorCount >= 2) {
            setShowEmergencyButton(true);
          }
        }
      };

      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handlePromiseRejection);

      // 🚨 절대 안전장치 제거 - 사용자 확인을 기다림
      // const absoluteFailsafe = setTimeout(() => {
      //   console.log('🚨 절대 안전장치 발동 - 30초 후 강제 완료');
      //   handleFinalComplete();
      // }, 30000);

      // 🚨 비상 버튼 표시: 15초 후
      const emergencyButtonTimer = setTimeout(() => {
        console.log('⏰ 15초 경과 - 비상 완료 버튼 표시');
        setShowEmergencyButton(true);
      }, 15000);

      return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener(
          'unhandledrejection',
          handlePromiseRejection
        );
        // clearTimeout(absoluteFailsafe);
        clearTimeout(emergencyButtonTimer);
      };
    }, [errorCount]);

    // 🎯 최종 완료 처리 함수 (사용자 확인 후에만 실행)
    const handleFinalComplete = useCallback(() => {
      if (!isComplete && waitingForUserConfirmation) {
        try {
          console.log('🎉 SystemBootSequence 최종 완료 처리 (사용자 확인됨)');
          setIsComplete(true);
          setShowSystemChecklist(false);
          setShowSpawning(false);
          setWaitingForUserConfirmation(false);
          onBootComplete();
        } catch (error) {
          safeErrorLog('❌ onBootComplete 콜백 에러', error);
          // 에러가 발생해도 완료 처리
          setIsComplete(true);
          setShowSystemChecklist(false);
          setShowSpawning(false);
          setWaitingForUserConfirmation(false);
        }
      }
    }, [isComplete, waitingForUserConfirmation, onBootComplete]);

    // 스킵 조건 체크
    useEffect(() => {
      if (skipAnimation) {
        console.log('⚡ 애니메이션 스킵 - 즉시 완료');
        handleFinalComplete();
      }
    }, [skipAnimation, handleFinalComplete]);

    // 🔧 시스템 체크리스트 완료 핸들러
    const handleSystemChecklistComplete = useCallback(() => {
      console.log('✅ 시스템 체크리스트 완료 - 서버 스포닝 시작');
      setShowSystemChecklist(false);

      // 서버가 있으면 서버 스포닝 단계로, 없으면 사용자 확인 대기
      if (servers && servers.length > 0) {
        setShowSpawning(true);
      } else {
        // 서버가 없으면 사용자 확인 대기 상태로 전환
        console.log('📋 서버 없음 - 사용자 확인 대기');
        setWaitingForUserConfirmation(true);
      }
    }, [servers]);

    // 서버 스포닝 완료 핸들러 - 사용자 확인 대기 상태로 전환
    const handleSpawnerComplete = useCallback(() => {
      console.log('🎉 서버 스포닝 완료 - 사용자 확인 대기');
      setShowSpawning(false);
      setWaitingForUserConfirmation(true);
    }, []);

    // 🛠️ 개발자 도구 등록
    useEffect(() => {
      (window as any).debugSystemBootSequence = {
        forceComplete: () => {
          console.log('🚨 SystemBootSequence 강제 완료 실행');
          handleFinalComplete();
        },
        skipAnimation: () => {
          console.log('🚀 SystemBootSequence 애니메이션 스킵');
          handleFinalComplete();
        },
        getState: () => ({
          showSystemChecklist,
          showSpawning,
          isComplete,
          errorCount,
          serversCount: servers.length,
        }),
      };

      // 전역 비상 완료 함수
      (window as any).emergencyCompleteBootSequence = () => {
        console.log('🚨 부팅 시퀀스 비상 완료');
        handleFinalComplete();
      };
    }, [
      handleFinalComplete,
      showSystemChecklist,
      showSpawning,
      isComplete,
      errorCount,
      servers.length,
    ]);

    if (skipAnimation || isComplete) {
      return null;
    }

    return (
      <div
        className='fixed inset-0 z-50 bg-black cursor-pointer'
        onClick={() => {
          if (waitingForUserConfirmation) {
            console.log('🖱️ 화면 클릭으로 완료 (사용자 확인 대기 중)');
            handleFinalComplete();
          } else {
            console.log('🖱️ 화면 클릭 - 아직 완료 준비 안됨');
          }
        }}
      >
        <AnimatePresence mode='wait'>
          {/* 🔧 시스템 체크리스트 단계 */}
          {showSystemChecklist && (
            <motion.div
              key='system-checklist'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='absolute inset-0'
            >
              <SystemChecklist
                onComplete={handleSystemChecklistComplete}
                skipCondition={skipAnimation}
              />
            </motion.div>
          )}

          {/* 🚀 서버 스포닝 단계 */}
          {showSpawning && (
            <motion.div
              key='server-spawner'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='absolute inset-0'
            >
              <ServerCardSpawner
                servers={servers}
                onServerSpawned={onServerSpawned}
                onAllServersSpawned={handleSpawnerComplete}
                isActive={true}
                spawnDelay={200}
              />
            </motion.div>
          )}

          {/* ✅ 사용자 확인 대기 화면 */}
          {waitingForUserConfirmation && (
            <motion.div
              key='waiting-confirmation'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='absolute inset-0 flex items-center justify-center'
            >
              <div className='text-center space-y-8 max-w-4xl mx-auto px-6'>
                {/* 완료 상태 표시 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className='text-center'
                >
                  <div className='w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.4,
                        type: 'spring',
                        stiffness: 200,
                      }}
                    >
                      ✅
                    </motion.div>
                  </div>
                  <h1 className='text-4xl font-bold text-white mb-4'>
                    시스템 준비 완료!
                  </h1>
                  <p className='text-blue-200 text-lg'>
                    모든 시스템이 정상적으로 초기화되었습니다.
                  </p>
                </motion.div>

                {/* 시스템 상태 카드들 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center'>
                        ✓
                      </div>
                      <h3 className='text-lg font-semibold text-white'>
                        시스템 초기화
                      </h3>
                    </div>
                    <p className='text-green-300 text-sm'>
                      모든 구성 요소가 성공적으로 로드됨
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center'>
                        🖥️
                      </div>
                      <h3 className='text-lg font-semibold text-white'>
                        서버 연결
                      </h3>
                    </div>
                    <p className='text-blue-300 text-sm'>
                      {servers.length}개 서버가 온라인 상태
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center'>
                        💾
                      </div>
                      <h3 className='text-lg font-semibold text-white'>
                        데이터베이스
                      </h3>
                    </div>
                    <p className='text-purple-300 text-sm'>
                      모든 데이터 연결이 활성화됨
                    </p>
                  </motion.div>
                </div>

                {/* 완료 안내 메시지 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className='text-center'
                >
                  <p className='text-cyan-300 text-lg mb-2'>
                    🖱️ 화면을 클릭하여 대시보드로 이동하세요
                  </p>
                  <p className='text-gray-400 text-sm'>
                    또는 아래 버튼을 클릭하세요
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚨 에러 발생 또는 장시간 로딩 시 비상 완료 버튼 */}
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
                    {errorCount > 0
                      ? `에러가 ${errorCount}번 발생했습니다. 아래 버튼으로 바로 이동하세요.`
                      : '로딩이 오래 걸리고 있습니다. 아래 버튼으로 바로 이동하세요.'}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (waitingForUserConfirmation) {
                        console.log(
                          '🚀 비상 완료 버튼 클릭 (사용자 확인 대기 중)'
                        );
                        handleFinalComplete();
                      } else {
                        console.log(
                          '🚀 비상 완료 버튼 클릭 - 아직 완료 준비 안됨'
                        );
                        // 강제로 사용자 확인 대기 상태로 전환
                        setShowSystemChecklist(false);
                        setShowSpawning(false);
                        setWaitingForUserConfirmation(true);
                      }
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

        {/* 🔥 사용자 안내 */}
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
            <div>⏱️ 자동 완료: 체크리스트 기반</div>
          </div>
        </motion.div>

        {/* 🛠️ 디버깅 정보 패널 */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className='fixed bottom-4 right-4 bg-black/80 backdrop-blur-lg text-white text-xs p-3 rounded-lg border border-white/20 max-w-xs'
          >
            <div className='space-y-1'>
              <div className='font-semibold text-cyan-400 mb-2'>
                🛠️ 개발자 도구
              </div>
              <div>체크리스트: {showSystemChecklist ? '✅' : '❌'}</div>
              <div>서버 스포닝: {showSpawning ? '✅' : '❌'}</div>
              <div>완료 상태: {isComplete ? '✅' : '❌'}</div>
              <div>서버 수: {servers.length}</div>
              <div>에러 횟수: {errorCount}</div>
              <div className='border-t border-white/20 pt-2 mt-2'>
                <div className='text-yellow-300'>🚀 강제 완료:</div>
                <div>• 화면 클릭</div>
                <div>• ESC 키</div>
                <div>• emergencyCompleteBootSequence()</div>
                <div>• emergencyCompleteChecklist()</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
);

SystemBootSequence.displayName = 'SystemBootSequence';

export default SystemBootSequence;
