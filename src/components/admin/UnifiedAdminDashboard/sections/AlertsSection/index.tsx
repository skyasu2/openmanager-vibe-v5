/**
 * 🎯 알림 섹션
 *
 * 시스템 알림 표시 및 관리
 */

// framer-motion 제거 - CSS 애니메이션 사용
import React, { Fragment, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import type { SystemAlert } from '../../UnifiedAdminDashboard.types';
import { ALERT_PRIORITIES } from '../../UnifiedAdminDashboard.types';

interface AlertsSectionProps {
  alerts: SystemAlert[];
  onAcknowledge: (alertId: string) => void;
  compact?: boolean;
}

export default function AlertsSection({
  alerts,
  onAcknowledge,
  compact = false,
}: AlertsSectionProps) {
  // 우선순위에 따라 정렬
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityDiff = (ALERT_PRIORITIES[b.type] ?? 0) - (ALERT_PRIORITIES[a.type] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;

    // 같은 우선순위면 시간순
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const displayAlerts = compact ? sortedAlerts.slice(0, 5) : sortedAlerts;

  if (displayAlerts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        <CheckCircle className="mx-auto mb-3 h-12 w-12" />
        <p>현재 활성 알림이 없습니다</p>
      </div>
    );
  }

  return (
    <Fragment>
      <div
        className={`space-y-3 ${compact ? '' : 'max-h-[600px] overflow-y-auto'}`}
      >
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-4 ${getAlertStyles(alert.type)} ${
              alert.acknowledged ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="mt-1 text-sm">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatTimestamp(alert.timestamp)}</span>
                    <span>출처: {getSourceLabel(alert.source)}</span>
                  </div>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="알림 확인"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Fragment>
  );
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

function getAlertStyles(type: SystemAlert['type']): string {
  switch (type) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
    default:
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
}

function getAlertIcon(type: SystemAlert['type']): ReactNode {
  const iconClass = 'w-5 h-5 flex-shrink-0 mt-0.5';

  switch (type) {
    case 'critical':
    case 'error':
      return <AlertTriangle className={`${iconClass} text-red-600`} />;
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
    case 'info':
      return <Info className={`${iconClass} text-blue-600`} />;
    default:
      return <Info className={`${iconClass} text-gray-600`} />;
  }
}

function getSourceLabel(source: SystemAlert['source']): string {
  const labels: Record<SystemAlert['source'], string> = {
    performance: '성능',
    logging: '로깅',
    engine: 'AI 엔진',
    system: '시스템',
  };

  return labels[source] || source;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString('ko-KR');
}
