'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Power,
  Play,
  StopCircle,
  ChevronUp,
  ChevronDown,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { timerManager } from '../../utils/TimerManager';

interface SystemHealth {
  hasError: boolean;
  errorType: 'critical' | 'warning' | null;
  errorMessage: string;
  lastCheck: number;
}

interface FloatingSystemControlProps {
  systemState: any;
  aiAgentState: any;
  isSystemActive: boolean;
  isSystemPaused: boolean;
  onStartSystem: () => Promise<void>;
  onStopSystem: () => Promise<void>;
  onResumeSystem: () => Promise<void>;
}

export default function FloatingSystemControl({
  systemState,
  aiAgentState,
  isSystemActive,
  isSystemPaused,
  onStartSystem,
  onStopSystem,
  onResumeSystem
}: FloatingSystemControlProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    hasError: false,
    errorType: null,
    errorMessage: '',
    lastCheck: Date.now()
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // 시스템 건강성 체크
  const checkSystemHealth = useCallback(() => {
    try {
      const hasAIError = systemState?.state === 'error' || aiAgentState?.state === 'error';
      const isSystemDown = !isSystemActive && !isSystemPaused;
      
      let errorType: 'critical' | 'warning' | null = null;
      let errorMessage = '';
      
      if (hasAIError) {
        errorType = 'critical';
        errorMessage = 'AI 에이전트 엔진에 문제가 발생했습니다';
      } else if (isSystemDown) {
        errorType = 'warning';
        errorMessage = '시스템이 비활성 상태입니다';
      }
      
      const hasError = errorType !== null;
      
      setSystemHealth({
        hasError,
        errorType,
        errorMessage,
        lastCheck: Date.now()
      });

      // 에러 발생 시 자동으로 상단으로 이동
      if (hasError && isMinimized) {
        setIsMinimized(false);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('시스템 건강성 체크 실패:', error);
    }
  }, [systemState, aiAgentState, isSystemActive, isSystemPaused, isMinimized]);

  useEffect(() => {
    checkSystemHealth();
    
    // TimerManager를 사용한 헬스체크
    timerManager.register({
      id: 'floating-system-health-check',
      callback: checkSystemHealth,
      interval: 5000,
      priority: 'high',
        enabled: true
    });
    
    return () => {
      timerManager.unregister('floating-system-health-check');
    };
  }, [checkSystemHealth]);

  const getStatusColor = () => {
    if (systemHealth.hasError) {
      return systemHealth.errorType === 'critical' ? 'bg-red-500' : 'bg-yellow-500';
    }
    return isSystemActive ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = () => {
    if (systemHealth.hasError) {
      return systemHealth.errorMessage;
    }
    if (isSystemActive) return '시스템 정상 운영 중';
    if (isSystemPaused) return '시스템 일시 정지됨';
    return '시스템 비활성 상태';
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) setIsExpanded(false);
  };

  return (
    <>
      {/* 하단 고정 제어판 */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleMinimize}
              className={`
                ${getStatusColor()} text-white p-3 rounded-full shadow-lg
                cursor-pointer transition-all duration-200 hover:shadow-xl
                flex items-center gap-2
              `}
            >
              <Activity className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">
                {isSystemActive ? '운영중' : '정지됨'}
              </span>
              {systemHealth.hasError && (
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상단 플로팅 제어판 */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <motion.div
              layout
              className={`
                ${getStatusColor()} text-white rounded-lg shadow-xl border
                ${systemHealth.hasError ? 'border-red-300' : 'border-white/20'}
              `}
            >
              {/* 헤더 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {systemHealth.hasError ? (
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    ) : (
                      <CheckCircle className="w-6 h-6" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">시스템 제어판</h3>
                      <p className="text-xs opacity-90">{getStatusText()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleToggleMinimize}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 확장 콘텐츠 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/20 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {/* 상태 정보 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            {isSystemActive ? (
                              <Wifi className="w-4 h-4 text-green-300" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-red-300" />
                            )}
                            <span className="text-xs font-medium">시스템</span>
                          </div>
                          <p className="text-xs opacity-90">
                            {isSystemActive ? '활성화' : '비활성화'}
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-medium">AI 엔진</span>
                          </div>
                          <p className="text-xs opacity-90">
                            {aiAgentState?.state === 'active' ? '정상' : '대기'}
                          </p>
                        </div>
                      </div>

                      {/* 제어 버튼 */}
                      <div className="flex gap-2">
                        {!isSystemActive ? (
                          <button
                            onClick={onStartSystem}
                            className="flex-1 bg-white/20 hover:bg-white/30 text-white p-2 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Play className="w-4 h-4" />
                            시작
                          </button>
                        ) : (
                          <>
                            {isSystemPaused ? (
                              <button
                                onClick={onResumeSystem}
                                className="flex-1 bg-white/20 hover:bg-white/30 text-white p-2 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <Play className="w-4 h-4" />
                                재개
                              </button>
                            ) : (
                              <button
                                onClick={onStopSystem}
                                className="flex-1 bg-white/20 hover:bg-white/30 text-white p-2 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <StopCircle className="w-4 h-4" />
                                정지
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* 에러 메시지 */}
                      {systemHealth.hasError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white/20 rounded p-3 border border-white/30"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium">
                                {systemHealth.errorType === 'critical' ? '심각한 오류' : '경고'}
                              </p>
                              <p className="text-xs opacity-90 mt-1">
                                {systemHealth.errorMessage}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 