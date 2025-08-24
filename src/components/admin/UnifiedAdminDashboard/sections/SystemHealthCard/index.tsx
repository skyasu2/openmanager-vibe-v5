/**
 * 🎯 시스템 헬스 카드 컴포넌트
 *
 * 시스템 전반적인 상태를 한눈에 보여주는 카드
 */

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  Brain,
  Cloud,
  Database,
  FileText,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  DashboardData,
  GCPQuotaStatus,
} from '../../UnifiedAdminDashboard.types';
import { STATUS_COLORS } from '../../UnifiedAdminDashboard.types';

interface SystemHealthCardProps {
  data: DashboardData;
  gcpQuota?: GCPQuotaStatus | null;
}

export function SystemHealthCard({ data, gcpQuota }: SystemHealthCardProps) {
  const { status, quickStats } = data;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* 전체 시스템 상태 */}
      <MetricCard
        icon={<Activity className="h-6 w-6" />}
        title="시스템 상태"
        value={getStatusDisplay(status.overall)}
        subtitle={`성능 점수: ${status.performance.score}%`}
        color={STATUS_COLORS[status.overall]}
        trend={status.performance.score >= 90 ? 'up' : 'down'}
      />

      {/* 활성 사용자 */}
      <MetricCard
        icon={<Users className="h-6 w-6" />}
        title="활성 사용자"
        value={quickStats.activeUsers.toLocaleString()}
        subtitle="현재 접속 중"
        color="#3B82F6"
      />

      {/* AI 엔진 상태 */}
      <MetricCard
        icon={<Brain className="h-6 w-6" />}
        title="AI 엔진"
        value={`${status.engines.active}/${status.engines.total}`}
        subtitle="활성/전체"
        color={
          status.engines.active > 0
            ? STATUS_COLORS.active
            : STATUS_COLORS.inactive
        }
        trend={status.engines.active === status.engines.total ? 'up' : 'down'}
      />

      {/* 서버 가동 시간 */}
      <MetricCard
        icon={<Server className="h-6 w-6" />}
        title="가동 시간"
        value={formatUptime(status.infrastructure.uptime)}
        subtitle={`메모리: ${status.infrastructure.memoryUsage}%`}
        color="#8B5CF6"
      />

      {/* 총 요청 수 */}
      <MetricCard
        icon={<TrendingUp className="h-6 w-6" />}
        title="총 요청"
        value={formatNumber(quickStats.totalRequests)}
        subtitle={`성공률: ${status.performance.metrics.successRate}%`}
        color="#10B981"
      />

      {/* 로깅 상태 */}
      <MetricCard
        icon={<FileText className="h-6 w-6" />}
        title="로깅"
        value={status.logging.status === 'active' ? '활성' : '비활성'}
        subtitle={`에러율: ${status.logging.errorRate}%`}
        color={
          status.logging.status === 'active'
            ? STATUS_COLORS.active
            : STATUS_COLORS.inactive
        }
      />

      {/* 응답 시간 */}
      <MetricCard
        icon={<Activity className="h-6 w-6" />}
        title="평균 응답 시간"
        value={`${status.performance.metrics.avgResponseTime}ms`}
        subtitle={`폴백율: ${status.performance.metrics.fallbackRate}%`}
        color="#F59E0B"
      />

      {/* 데이터베이스 연결 */}
      <MetricCard
        icon={<Database className="h-6 w-6" />}
        title="DB 연결"
        value={`${status.infrastructure.connections}`}
        subtitle="활성 연결"
        color="#6366F1"
      />

      {/* GCP 무료 티어 사용량 (옵션) */}
      {gcpQuota && (
        <>
          <MetricCard
            icon={<Cloud className="h-6 w-6" />}
            title="GCP Compute"
            value={`${gcpQuota.computeEngine.percentage}%`}
            subtitle={`${gcpQuota.computeEngine.used}/${gcpQuota.computeEngine.limit}`}
            color={getQuotaColor(gcpQuota.computeEngine.percentage)}
            trend={gcpQuota.computeEngine.percentage < 80 ? 'up' : 'down'}
          />

          <MetricCard
            icon={<Cloud className="h-6 w-6" />}
            title="Cloud Functions"
            value={`${gcpQuota.cloudFunctions.percentage}%`}
            subtitle={`${formatNumber(gcpQuota.cloudFunctions.invocations)}/${formatNumber(gcpQuota.cloudFunctions.limit)}`}
            color={getQuotaColor(gcpQuota.cloudFunctions.percentage)}
            trend={gcpQuota.cloudFunctions.percentage < 80 ? 'up' : 'down'}
          />

          <MetricCard
            icon={<Cloud className="h-6 w-6" />}
            title="Storage"
            value={`${gcpQuota.cloudStorage.percentage}%`}
            subtitle={`${gcpQuota.cloudStorage.usedGB}GB/${gcpQuota.cloudStorage.limitGB}GB`}
            color={getQuotaColor(gcpQuota.cloudStorage.percentage)}
          />

          <MetricCard
            icon={<Brain className="h-6 w-6" />}
            title="AI 요청"
            value={`${gcpQuota.ai.percentage}%`}
            subtitle={`${formatNumber(gcpQuota.ai.requests)}/${formatNumber(gcpQuota.ai.limit)}`}
            color={getQuotaColor(gcpQuota.ai.percentage)}
            trend={gcpQuota.ai.percentage < 80 ? 'up' : 'down'}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// 메트릭 카드 컴포넌트
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  color,
  trend,
}: MetricCardProps) {
  return (
    <div
      className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        {trend && (
          <div className={`text-sm ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {title}
      </h3>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

function getStatusDisplay(status: DashboardData['status']['overall']): string {
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getQuotaColor(percentage: number): string {
  if (percentage < 50) return STATUS_COLORS.healthy;
  if (percentage < 80) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}

function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}
