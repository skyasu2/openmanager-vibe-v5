'use client';

import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Server } from '../../types/server';

interface MobileSummaryCardProps {
  servers: Server[];
  onServerSelect: (server: Server) => void;
  onViewAll: () => void;
  lastUpdate?: Date;
}

interface ServerStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
  criticalAlerts: number;
}

export default function MobileSummaryCard({
  servers,
  onServerSelect,
  onViewAll,
  lastUpdate,
}: MobileSummaryCardProps) {
  // 🚀 안전한 배열 처리: servers가 배열인지 확인
  const safeServers = Array.isArray(servers) ? servers : [];

  if (!Array.isArray(servers)) {
    console.warn(
      '⚠️ MobileSummaryCard: servers가 배열이 아닙니다:',
      typeof servers
    );
  }

  // 서버 통계 계산
  const stats: ServerStats = {
    total: safeServers.length,
    online: safeServers.filter((s: Server) => s.status === 'online').length,
    warning: safeServers.filter((s: Server) => s.status === 'warning').length,
    offline: safeServers.filter((s: Server) => s.status === 'offline').length,
    criticalAlerts: safeServers.reduce((sum: number, s: Server) => {
      const alertCount =
        typeof s.alerts === 'number'
          ? s.alerts
          : Array.isArray(s.alerts)
            ? s.alerts.length
            : 0;
      return sum + alertCount;
    }, 0),
  };

  // 상태별 우선순위 서버 (가장 중요한 것부터)
  const priorityServers = [
    ...safeServers.filter((s: Server) => s.status === 'offline').slice(0, 2),
    ...safeServers.filter((s: Server) => s.status === 'warning').slice(0, 2),
    ...safeServers.filter((s: Server) => s.status === 'online').slice(0, 1),
  ].slice(0, 3);

  // 전체 상태 결정
  const getOverallStatus = () => {
    if (stats.offline > 0)
      return { status: 'critical', color: 'red', icon: XCircleIcon };
    if (stats.warning > 0)
      return {
        status: 'warning',
        color: 'yellow',
        icon: ExclamationTriangleIcon,
      };
    return { status: 'healthy', color: 'green', icon: CheckCircleIcon };
  };

  const overall = getOverallStatus();
  const StatusIcon = overall.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
    >
      {/* 상단 헤더 - 전체 상태 */}
      <div
        className={`bg-gradient-to-r p-4 ${
          overall.color === 'red'
            ? 'from-red-500 to-red-600'
            : overall.color === 'yellow'
              ? 'from-yellow-500 to-yellow-600'
              : 'from-green-500 to-green-600'
        }`}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">시스템 상태</h2>
              <p className="text-sm opacity-90">
                {overall.status === 'critical'
                  ? '긴급 조치 필요'
                  : overall.status === 'warning'
                    ? '주의 모니터링'
                    : '모든 시스템 정상'}
              </p>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <div className="flex items-center space-x-1 text-xs opacity-75">
                <ClockIcon className="h-3 w-3" />
                <span>{lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="p-4">
        <div className="mb-4 grid grid-cols-4 gap-3">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-gray-50 p-3 text-center"
          >
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="mt-1 text-xs text-gray-500">전체</div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-green-50 p-3 text-center"
          >
            <div className="text-2xl font-bold text-green-600">
              {stats.online}
            </div>
            <div className="mt-1 text-xs text-green-500">정상</div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-yellow-50 p-3 text-center"
          >
            <div className="text-2xl font-bold text-yellow-600">
              {stats.warning}
            </div>
            <div className="mt-1 text-xs text-yellow-500">주의</div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-red-50 p-3 text-center"
          >
            <div className="text-2xl font-bold text-red-600">
              {stats.offline}
            </div>
            <div className="mt-1 text-xs text-red-500">오프라인</div>
          </motion.div>
        </div>

        {/* 중요 알림 */}
        {stats.criticalAlerts > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {stats.criticalAlerts}개의 중요 알림
              </span>
            </div>
          </motion.div>
        )}

        {/* 우선순위 서버 목록 */}
        <div className="mb-4 space-y-2">
          <h3 className="mb-2 text-sm font-medium text-gray-700">주요 서버</h3>
          {priorityServers.map((server, index) => (
            <motion.button
              key={server.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onServerSelect(server)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    server.status === 'online'
                      ? 'bg-green-500'
                      : server.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {server.name}
                  </div>
                  <div className="text-xs text-gray-500">{server.location}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500">CPU {server.cpu}%</div>
                  <div className="text-xs text-gray-500">
                    MEM {server.memory}%
                  </div>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* 전체 보기 버튼 */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onViewAll}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          <span>모든 서버 보기</span>
          <ChevronRightIcon className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
