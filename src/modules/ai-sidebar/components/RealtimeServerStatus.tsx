/**
 * 🔄 실시간 서버 상황 표시 컴포넌트
 * 
 * AI 사이드바 상단에 서버 상황을 실시간으로 보여주는 컴포넌트
 * - 15초마다 서버 상태 업데이트
 * - 간단한 한 줄 요약 형태
 * - 상태별 색상 구분
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../../utils/TimerManager';

interface ServerStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  errorServers: number;
  criticalAlerts: number;
  lastUpdate: number;
}

interface RealtimeServerStatusProps {
  isProcessing?: boolean;
}

const RealtimeServerStatusComponent: React.FC<RealtimeServerStatusProps> = ({ 
  isProcessing = false 
}) => {
  const [status, setStatus] = useState<ServerStatus>({
    totalServers: 20,
    healthyServers: 15,
    warningServers: 3,
    errorServers: 2,
    criticalAlerts: 1,
    lastUpdate: Date.now()
  });

  const [isLoading, setIsLoading] = useState(false);

  // 서버 상태 업데이트 함수
  const updateServerStatus = async () => {
    setIsLoading(true);
    try {
      // 시뮬레이션 엔진에서 실시간 데이터 가져오기
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        // API 응답 구조에 맞춰 서버 데이터 접근
        const servers = data.data?.servers || data.servers || [];
        
        console.log('📊 서버 데이터 수신:', servers.length + '개');
        
        const newStatus: ServerStatus = {
          totalServers: servers.length,
          healthyServers: servers.filter((s: any) => s.status === 'healthy').length,
          warningServers: servers.filter((s: any) => s.status === 'warning').length,
          errorServers: servers.filter((s: any) => s.status === 'error').length,
          criticalAlerts: servers.reduce((count: number, s: any) => {
            const criticalCount = (s.alerts || []).filter((a: any) => Number(a.severity) >= 3).length;
            return count + criticalCount;
          }, 0),
          lastUpdate: Date.now()
        };
        
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('서버 상태 업데이트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 단순화된 업데이트 주기 - 성능 최적화
  const getUpdateInterval = () => {
    // 모든 상황에서 60초로 통일 (성능 최적화)
    return 60000; // 60초
  };

  // 60초 간격으로 단순화된 업데이트 - TimerManager 사용
  useEffect(() => {
    // AI 처리 중이면 타이머 정지
    if (isProcessing) {
      console.log('🚫 AI 처리 중 - 서버 상태 업데이트 정지');
      timerManager.unregister('realtime-server-status');
      return;
    }

    console.log('📊 서버 상태 업데이트 타이머 시작 (60초 간격)');
    
    // 즉시 첫 업데이트 실행
    updateServerStatus();

    // 단순화된 타이머 등록 - 복잡한 로직 제거
    timerManager.register({
      id: 'realtime-server-status',
      callback: updateServerStatus,
      interval: 60000, // 60초 고정
      priority: 'low',
        enabled: true // 우선순위 낮춤
    });

    return () => {
      console.log('🧹 서버 상태 업데이트 타이머 정리');
      timerManager.unregister('realtime-server-status');
    };
  }, [isProcessing]); // getUpdateInterval 의존성 제거

  // 상태에 따른 색상 결정
  const getStatusColor = () => {
    if (status.errorServers > 0) return 'bg-red-500';
    if (status.warningServers > 2) return 'bg-yellow-500';
    if (status.criticalAlerts > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (status.errorServers > 0) {
      return `⚠️ ${status.errorServers}개 서버 장애`;
    }
    if (status.criticalAlerts > 0) {
      return `🔥 ${status.criticalAlerts}개 심각 알림`;
    }
    if (status.warningServers > 2) {
      return `⚡ ${status.warningServers}개 서버 경고`;
    }
    return `✅ ${status.healthyServers}/${status.totalServers} 서버 정상`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${getStatusColor()}`}
            animate={{
              scale: isLoading ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isLoading ? Infinity : 0,
            }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={status.lastUpdate}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {getStatusText()}
            </motion.span>
          </AnimatePresence>
        </div>
        
        <motion.div
          className="text-xs text-gray-500 dark:text-gray-400"
          animate={{
            opacity: isLoading ? [1, 0.5, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: isLoading ? Infinity : 0,
          }}
        >
          {isLoading ? '업데이트 중...' : '실시간'}
        </motion.div>
      </div>

      {/* 간단한 통계 바 */}
      <div className="mt-1 flex space-x-1 h-1">
        <motion.div
          className="bg-green-400 rounded-full"
          style={{ 
            width: `${(status.healthyServers / status.totalServers) * 100}%` 
          }}
          initial={{ width: 0 }}
          animate={{ 
            width: `${(status.healthyServers / status.totalServers) * 100}%` 
          }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="bg-yellow-400 rounded-full"
          style={{ 
            width: `${(status.warningServers / status.totalServers) * 100}%` 
          }}
          initial={{ width: 0 }}
          animate={{ 
            width: `${(status.warningServers / status.totalServers) * 100}%` 
          }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.div
          className="bg-red-400 rounded-full"
          style={{ 
            width: `${(status.errorServers / status.totalServers) * 100}%` 
          }}
          initial={{ width: 0 }}
          animate={{ 
            width: `${(status.errorServers / status.totalServers) * 100}%` 
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
const MemoizedRealtimeServerStatus = React.memo(RealtimeServerStatusComponent);
export { MemoizedRealtimeServerStatus as RealtimeServerStatus }; 