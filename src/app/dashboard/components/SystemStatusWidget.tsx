/**
 * 📊 시스템 상태 위젯 - Phase 1 + 2.1 통합 모니터링
 * 
 * ✅ 기능:
 * - 실시간 모듈 상태 표시
 * - 원클릭 시스템 제어
 * - 진단 및 테스트 버튼
 * - 상태 히스토리 및 통계
 * - 반응형 디자인
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  MessageSquare, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Wifi, 
  WifiOff,
  Zap,
  BarChart3,
  Shield,
  Bell,
  Download,
  TestTube
} from 'lucide-react';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';

interface SystemStatusWidgetProps {
  className?: string;
  showControls?: boolean;
  compactMode?: boolean;
}

/**
 * 📊 모듈 상태 카드 컴포넌트
 */
const ModuleStatusCard: React.FC<{
  title: string;
  isActive: boolean;
  icon: React.ElementType;
  stats: Record<string, any>;
  onTest?: () => void;
  compact?: boolean;
}> = ({ title, isActive, icon: Icon, stats, onTest, compact = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        ${compact ? 'p-3' : 'p-4'} shadow-sm hover:shadow-md transition-all duration-200
      `}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`
            ${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg flex items-center justify-center
            ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
          `}>
            <Icon className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </div>
          <span className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 상태 표시 */}
          <div className={`
            ${compact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full
            ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}
          `} />
          
          {/* 테스트 버튼 */}
          {onTest && (
            <button
              onClick={onTest}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="테스트"
            >
              <TestTube className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 통계 */}
      {!compact && (
        <div className="space-y-2">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{key}</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {typeof value === 'number' && value > 1000 
                  ? value.toLocaleString() 
                  : String(value)
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * 📊 시스템 상태 위젯 메인 컴포넌트
 */
export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({
  className = '',
  showControls = true,
  compactMode = false
}) => {
  const systemIntegration = useSystemIntegration();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  /**
   * 🚀 시스템 초기화 핸들러
   */
  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      await systemIntegration.initializeSystem();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔄 시스템 재시작 핸들러
   */
  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await systemIntegration.restartSystem();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔍 시스템 진단 핸들러
   */
  const handleDiagnostics = async () => {
    setIsLoading(true);
    try {
      await systemIntegration.runSystemDiagnostics();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 📋 리포트 내보내기 핸들러
   */
  const handleExportReport = async () => {
    try {
      const report = await systemIntegration.exportSystemReport();
      
      // JSON 파일로 다운로드
      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('리포트 내보내기 실패:', error);
    }
  };

  /**
   * 🎨 전체 헬스 상태 색상
   */
  const getHealthColor = () => {
    switch (systemIntegration.overallHealth) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getHealthColor()}`}>
              {systemIntegration.isHealthy ? (
                <CheckCircle className="w-5 h-5" />
              ) : systemIntegration.isCritical ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                시스템 상태
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phase 1 + 2.1 모듈 통합 모니터링
              </p>
            </div>
          </div>

          {/* 전체 상태 배지 */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor()}`}>
            {systemIntegration.overallHealth.toUpperCase()}
          </div>
        </div>

        {/* 시스템 통계 */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemIntegration.moduleCount.active}/{systemIntegration.moduleCount.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">활성 모듈</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemIntegration.eventStats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">총 이벤트</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {systemIntegration.eventStats.critical}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">심각한 이벤트</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemIntegration.lastUpdate 
                ? Math.floor((Date.now() - systemIntegration.lastUpdate.getTime()) / 1000)
                : '-'
              }s
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">마지막 업데이트</div>
          </div>
        </div>
      </div>

      {/* 모듈 상태 그리드 */}
      <div className="p-6">
        <div className={`grid ${compactMode ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {/* RealTimeHub */}
          <ModuleStatusCard
            title="RealTime Hub"
            isActive={systemIntegration.realTimeHub.isConnected}
            icon={systemIntegration.realTimeHub.isConnected ? Wifi : WifiOff}
            stats={{
              '연결 수': systemIntegration.realTimeHub.connectionCount,
              '활성 그룹': systemIntegration.realTimeHub.activeGroups.length,
              '메시지 히스토리': systemIntegration.realTimeHub.messageHistory
            }}
            onTest={systemIntegration.testRealTimeHub}
            compact={compactMode}
          />

          {/* PatternMatcher */}
          <ModuleStatusCard
            title="Pattern Matcher"
            isActive={systemIntegration.patternMatcher.isActive}
            icon={Activity}
            stats={{
              '활성 룰': systemIntegration.patternMatcher.activeRules,
              '감지된 이상': systemIntegration.patternMatcher.detectedAnomalies,
              '평균 처리시간': `${systemIntegration.patternMatcher.averageProcessingTime}ms`
            }}
            onTest={systemIntegration.triggerPatternAnalysis}
            compact={compactMode}
          />

          {/* DataRetention */}
          <ModuleStatusCard
            title="Data Retention"
            isActive={systemIntegration.dataRetention.isRunning}
            icon={Database}
            stats={{
              '활성 정책': systemIntegration.dataRetention.activePolicies,
              '정리된 데이터': systemIntegration.dataRetention.cleanedDataPoints,
              '정리 간격': `${Math.floor(systemIntegration.dataRetention.cleanupInterval / 1000)}s`
            }}
            onTest={systemIntegration.forceDataCleanup}
            compact={compactMode}
          />

          {/* Notifications */}
          <ModuleStatusCard
            title="Notifications"
            isActive={systemIntegration.notifications.isEnabled}
            icon={systemIntegration.notifications.isEnabled ? Bell : MessageSquare}
            stats={{
              'Slack': systemIntegration.notifications.channels.slack ? '✅' : '❌',
              'Discord': systemIntegration.notifications.channels.discord ? '✅' : '❌',
              '대기 중': systemIntegration.notifications.pendingNotifications
            }}
            onTest={() => systemIntegration.sendTestNotification()}
            compact={compactMode}
          />
        </div>
      </div>

      {/* 제어 패널 */}
      {showControls && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex flex-wrap gap-3">
            {/* 시스템 제어 버튼들 */}
            {!systemIntegration.isInitialized ? (
              <button
                onClick={handleInitialize}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isLoading ? '초기화 중...' : '시스템 시작'}</span>
              </button>
            ) : (
              <button
                onClick={handleRestart}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isLoading ? '재시작 중...' : '시스템 재시작'}</span>
              </button>
            )}

            <button
              onClick={handleDiagnostics}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>진단 실행</span>
            </button>

            <button
              onClick={handleExportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>리포트 내보내기</span>
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showDetails ? '세부정보 숨기기' : '세부정보 보기'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 세부 정보 패널 */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6 bg-gray-50 dark:bg-gray-700/30">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                최근 이벤트
              </h4>
              
              {systemIntegration.recentEvents.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {systemIntegration.recentEvents.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${event.severity === 'critical' ? 'bg-red-500' :
                            event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }
                        `} />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {event.message}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {event.timestamp.toLocaleTimeString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <Activity className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    아직 이벤트가 없습니다
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemStatusWidget; 