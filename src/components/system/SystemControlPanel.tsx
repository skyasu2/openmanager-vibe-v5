/**
 * 🎛️ 통합 시스템 제어 패널
 * 
 * ProcessManager를 통한 시스템 제어 UI:
 * - 시작/중지/재시작 버튼
 * - 실시간 상태 표시
 * - 프로세스별 모니터링
 * - 30분 안정성 표시
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw, Activity, AlertCircle, CheckCircle, Clock, Cpu, HardDrive, Zap, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemStatus {
  isRunning: boolean;
  health: 'healthy' | 'degraded' | 'critical';
  processes: Array<{
    id: string;
    status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error' | 'restarting';
    healthScore: number;
    restartCount: number;
    uptime: number;
    lastHealthCheck?: Date;
    errorCount: number;
  }>;
  metrics: {
    totalProcesses: number;
    runningProcesses: number;
    healthyProcesses: number;
    systemUptime: number;
    memoryUsage: number;
    averageHealthScore: number;
    totalRestarts: number;
  };
  startTime?: Date;
  watchdogMetrics?: any;
}

interface SystemOperation {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export function SystemControlPanel() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [stabilityTimer, setStabilityTimer] = useState<number>(0);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);
  const [isCollapsed, setIsCollapsed] = useState(true); // 기본적으로 접힌 상태

  // 시스템 상태 조회
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/system/unified?action=status');
      if (response.ok) {
        const result = await response.json();
        setSystemStatus(result.data);
        
        // 30분 타이머 계산
        if (result.data.isRunning && result.data.startTime) {
          const startTime = new Date(result.data.startTime);
          const elapsed = (Date.now() - startTime.getTime()) / 1000; // 초
          const remaining = Math.max(0, (30 * 60) - elapsed); // 30분 - 경과시간
          setStabilityTimer(remaining);
        } else {
          setStabilityTimer(0);
        }
      }
    } catch (error) {
      console.error('시스템 상태 조회 실패:', error);
    }
  }, []);

  // 시스템 제어 함수
  const executeSystemAction = async (action: string, options?: any): Promise<SystemOperation> => {
    setIsLoading(true);
    setOperation(action);
    
    try {
      const response = await fetch('/api/system/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, options })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 성공 알림 추가
        setAlerts(prev => [...prev, {
          type: 'success',
          message: result.message,
          timestamp: new Date()
        }]);
      } else {
        // 오류 알림 추가
        setAlerts(prev => [...prev, {
          type: 'error',
          message: result.message,
          timestamp: new Date()
        }]);
      }
      
      return result;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      setAlerts(prev => [...prev, {
        type: 'error',
        message: errorMsg,
        timestamp: new Date()
      }]);
      
      return {
        success: false,
        message: errorMsg
      };
    } finally {
      setIsLoading(false);
      setOperation(null);
      
      // 상태 업데이트
      setTimeout(fetchSystemStatus, 1000);
    }
  };

  // 시스템 시작
  const handleStart = () => {
    if (!confirm('통합 프로세스 관리 시스템을 시작하시겠습니까?\n30분간 안정성 모니터링이 진행됩니다.')) {
      return;
    }
    
    executeSystemAction('start', { mode: 'full' });
  };

  // 시스템 중지
  const handleStop = () => {
    if (!confirm('시스템을 중지하시겠습니까?\n모든 프로세스가 안전하게 종료됩니다.')) {
      return;
    }
    
    executeSystemAction('stop');
  };

  // 시스템 재시작
  const handleRestart = () => {
    if (!confirm('시스템을 재시작하시겠습니까?\n모든 프로세스가 중지 후 다시 시작됩니다.')) {
      return;
    }
    
    executeSystemAction('restart', { mode: 'full' });
  };

  // 상태 색상 결정
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'starting': case 'restarting': return 'text-blue-600 bg-blue-100';
      case 'stopping': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'stopped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 헬스 색상 결정
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 30분 타이머 표시
  const formatStabilityTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 2000); // 2초마다
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  // 안정성 타이머 업데이트
  useEffect(() => {
    if (stabilityTimer > 0) {
      const interval = setInterval(() => {
        setStabilityTimer(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stabilityTimer]);

  // 알림 자동 제거
  useEffect(() => {
    const timer = setInterval(() => {
      setAlerts(prev => prev.filter(alert => 
        Date.now() - alert.timestamp.getTime() < 10000 // 10초 후 제거
      ));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden"
      initial={false}
      animate={{ 
        height: isCollapsed ? 'auto' : 'auto',
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
    >
      {/* 접힌 상태에서 보이는 헤더 */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">통합 시스템 제어판</h3>
          </div>
          
          {/* 상태 요약 (접힌 상태에서도 표시) */}
          {systemStatus && (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(systemStatus.health)}`}>
                {systemStatus.health === 'healthy' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span className="capitalize">{systemStatus.health}</span>
              </div>
              
              <div className="text-xs text-gray-600">
                {systemStatus.metrics.runningProcesses}/{systemStatus.metrics.totalProcesses} 실행 중
              </div>
            </div>
          )}
        </div>
        
        {/* 접기/펴기 버튼 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 
                   bg-white border border-gray-200 rounded-lg hover:bg-gray-50 
                   transition-colors duration-200 text-sm font-medium text-gray-700"
        >
          {isCollapsed ? (
            <>
              <span>시스템 제어 펼치기</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>시스템 제어 접기</span>
              <ChevronUp className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 펼쳐진 상태에서만 보이는 컨텐츠 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* 알림 */}
              <AnimatePresence>
                {alerts.length > 0 && (
                  <div className="space-y-2">
                    {alerts.slice(-3).map((alert, index) => (
                      <motion.div
                        key={`${alert.timestamp.getTime()}-${index}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-3 rounded-lg text-sm ${
                          alert.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {alert.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{alert.message}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* 시스템 상태 요약 */}
              {systemStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">프로세스</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-800">
                      {systemStatus.metrics.runningProcesses}/{systemStatus.metrics.totalProcesses}
                    </div>
                    <div className="text-xs text-blue-600">실행 중</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">건강도</span>
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {systemStatus.metrics.averageHealthScore.toFixed(0)}%
                    </div>
                    <div className="text-xs text-green-600">평균 점수</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">메모리</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-800">
                      {systemStatus.metrics.memoryUsage.toFixed(0)}MB
                    </div>
                    <div className="text-xs text-purple-600">사용량</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">재시작</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-800">
                      {systemStatus.metrics.totalRestarts}
                    </div>
                    <div className="text-xs text-orange-600">총 횟수</div>
                  </div>
                </div>
              )}

              {/* 30분 안정성 모니터링 */}
              {systemStatus?.isRunning && stabilityTimer > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <h3 className="font-medium text-purple-800">30분 안정성 모니터링 진행 중</h3>
                      <p className="text-sm text-purple-600">
                        남은 시간: {formatStabilityTimer(stabilityTimer)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-800">
                        {Math.round(((30 * 60 - stabilityTimer) / (30 * 60)) * 100)}%
                      </div>
                      <div className="text-xs text-purple-600">완료</div>
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="mt-3 bg-white rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(((30 * 60 - stabilityTimer) / (30 * 60)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 제어 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleStart}
                  disabled={isLoading || systemStatus?.isRunning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                           bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg 
                           hover:from-green-600 hover:to-green-700 disabled:opacity-50 
                           disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {operation === 'start' ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  시작 (30분 모니터링)
                </button>

                <button
                  onClick={handleStop}
                  disabled={isLoading || !systemStatus?.isRunning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                           bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg 
                           hover:from-red-600 hover:to-red-700 disabled:opacity-50 
                           disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {operation === 'stop' ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  안전 정지
                </button>

                <button
                  onClick={handleRestart}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 
                           bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg 
                           hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 
                           disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {operation === 'restart' ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  재시작
                </button>
              </div>

              {/* 프로세스 목록 */}
              {systemStatus && systemStatus.processes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-gray-800">프로세스 상태</h3>
                  <div className="space-y-2">
                    {systemStatus.processes.map((process) => (
                      <motion.div
                        key={process.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(process.status)}`}>
                            {process.status.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{process.id}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="text-center">
                            <div className="font-medium text-green-600">{process.healthScore}%</div>
                            <div className="text-xs">건강도</div>
                          </div>
                          
                          {process.restartCount > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-orange-600">{process.restartCount}</div>
                              <div className="text-xs">재시작</div>
                            </div>
                          )}
                          
                          {process.errorCount > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-red-600">{process.errorCount}</div>
                              <div className="text-xs">오류</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 시스템 정보 */}
              {systemStatus && (
                <div className="text-xs text-gray-500 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">가동시간:</span>{' '}
                      {systemStatus.metrics.systemUptime > 0 
                        ? `${Math.floor(systemStatus.metrics.systemUptime / 1000 / 60)}분`
                        : '중지됨'
                      }
                    </div>
                    <div>
                      <span className="font-medium">마지막 업데이트:</span>{' '}
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 