/**
 * 🔄 실시간 서버 상황 표시 컴포넌트
 * 
 * AI 사이드바 상단에 서버 상황을 실시간으로 보여주는 컴포넌트
 * - 15초마다 서버 상태 업데이트
 * - 간단한 한 줄 요약 형태
 * - 상태별 색상 구분
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { ServerStatus } from '../types/ai-sidebar.types';

// 통합 실시간 스토어 사용
import { useServerList } from '@/stores/globalRealtimeStore';

interface RealtimeServerStatusProps {
  isProcessing?: boolean;
}

const RealtimeServerStatusComponent: React.FC<RealtimeServerStatusProps> = ({
  isProcessing = false
}) => {
  const [status, setStatus] = useState<ServerStatus>({
    totalServers: 0,
    healthyServers: 0,
    warningServers: 0,
    errorServers: 0,
    criticalAlerts: 0,
    lastUpdate: Date.now()
  });

  // 🔄 통합 실시간 데이터 사용
  const { servers } = useServerList();

  // 서버 데이터를 상태로 변환
  useEffect(() => {
    if (servers && servers.length > 0) {
      const newStatus: ServerStatus = {
        totalServers: servers.length,
        healthyServers: servers.filter(s => s.status === 'healthy').length,
        warningServers: servers.filter(s => s.status === 'warning').length,
        errorServers: servers.filter(s => s.status === 'error').length,
        criticalAlerts: servers.reduce((count, s) => {
          // 심각한 알림은 CPU/메모리 90% 이상으로 추정
          const criticalCount = (s.cpu >= 90 || s.memory >= 90) ? 1 : 0;
          return count + criticalCount;
        }, 0),
        lastUpdate: Date.now()
      };

      setStatus(newStatus);
      console.log('📊 AI 사이드바 서버 상태 업데이트:', newStatus);
    }
  }, [servers]);

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

