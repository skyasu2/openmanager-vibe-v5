/**
 * 🎯 대시보드 헤더 섹션
 *
 * 제목, 상태 표시, 새로고침 버튼 등
 */

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { SystemStatus } from '../../UnifiedAdminDashboard.types';
import { STATUS_COLORS } from '../../UnifiedAdminDashboard.types';

interface HeaderSectionProps {
  status: SystemStatus['overall'];
  lastUpdate: Date | null;
  autoRefresh: boolean;
  unreadAlerts: number;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
  onOpenSettings?: () => void;
}

export function HeaderSection({
  status,
  lastUpdate,
  autoRefresh,
  unreadAlerts,
  onRefresh,
  onToggleAutoRefresh,
  onOpenSettings,
}: HeaderSectionProps) {
  const statusIcon = getStatusIcon(status);
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.inactive;

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
        >
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            {statusIcon}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            관리자 대시보드
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            시스템 상태: {getStatusText(status)}
            {lastUpdate && (
              <span className="ml-2 text-sm">
                (업데이트: {formatTime(lastUpdate)})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 읽지 않은 알림 표시 */}
        {unreadAlerts > 0 && (
          <div
            className="relative"
          >
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadAlerts}
            </span>
          </div>
        )}

        {/* 자동 새로고침 토글 */}
        <button
          onClick={onToggleAutoRefresh}
          className={`rounded-lg p-2 transition-colors ${
            autoRefresh
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={autoRefresh ? '자동 새로고침 ON' : '자동 새로고침 OFF'}
        >
          {autoRefresh ? (
            <Wifi className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </button>

        {/* 수동 새로고침 */}
        <button
          onClick={onRefresh}
          className="rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
          title="새로고침"
        >
          <RefreshCw className="h-5 w-5" />
        </button>

        {/* 설정 버튼 */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
            title="설정"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

function getStatusIcon(status: SystemStatus['overall']) {
  switch (status) {
    case 'healthy':
      return (
        <CheckCircle
          className="h-6 w-6"
          style={{ color: STATUS_COLORS.healthy }}
        />
      );
    case 'warning':
      return (
        <AlertTriangle
          className="h-6 w-6"
          style={{ color: STATUS_COLORS.warning }}
        />
      );
    case 'critical':
      return (
        <AlertTriangle
          className="h-6 w-6"
          style={{ color: STATUS_COLORS.critical }}
        />
      );
    default:
      return (
        <Activity
          className="h-6 w-6"
          style={{ color: STATUS_COLORS.inactive }}
        />
      );
  }
}

function getStatusText(status: SystemStatus['overall']) {
  switch (status) {
    case 'healthy':
      return '정상';
    case 'warning':
      return '주의';
    case 'critical':
      return '위험';
    case 'inactive':
      return '비활성';
    default:
      return '알 수 없음';
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return date.toLocaleString('ko-KR');
}
