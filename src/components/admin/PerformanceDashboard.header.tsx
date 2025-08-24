/**
 * 📊 PerformanceDashboard Header Component
 *
 * Extracted header section with controls:
 * - Title and description
 * - Time range selector
 * - Auto refresh toggle
 * - Alerts toggle
 * - Manual refresh button
 * - Export data button
 */

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  Bell,
  BellOff,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../ui/button';

interface PerformanceDashboardHeaderProps {
  selectedTimeRange: string;
  setSelectedTimeRange: (value: string) => void;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  alertsEnabled: boolean;
  setAlertsEnabled: (value: boolean) => void;
  handleManualRefresh: () => void;
  handleDataExport: () => void;
  loading: boolean;
}

export function PerformanceDashboardHeader({
  selectedTimeRange,
  setSelectedTimeRange,
  autoRefresh,
  setAutoRefresh,
  alertsEnabled,
  setAlertsEnabled,
  handleManualRefresh,
  handleDataExport,
  loading,
}: PerformanceDashboardHeaderProps) {
  return (
    <div
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Activity className="h-6 w-6 text-white" />
          </div>
          AI 성능 모니터링 대시보드
        </h1>
        <p className="mt-1 text-gray-600">실시간 AI 엔진 성능 추적 및 분석</p>
      </div>

      <div className="flex items-center gap-4">
        {/* 시간 범위 선택 */}
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="30">최근 30분</option>
          <option value="60">최근 1시간</option>
          <option value="360">최근 6시간</option>
          <option value="1440">최근 24시간</option>
        </select>

        {/* 자동 새로고침 토글 */}
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? (
            <Wifi className="mr-2 h-4 w-4" />
          ) : (
            <WifiOff className="mr-2 h-4 w-4" />
          )}
          자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
        </Button>

        {/* 알림 토글 */}
        <Button
          variant={alertsEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAlertsEnabled(!alertsEnabled)}
        >
          {alertsEnabled ? (
            <Bell className="mr-2 h-4 w-4" />
          ) : (
            <BellOff className="mr-2 h-4 w-4" />
          )}
          알림 {alertsEnabled ? 'ON' : 'OFF'}
        </Button>

        {/* 수동 새로고침 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>

        {/* 데이터 내보내기 */}
        <Button variant="outline" size="sm" onClick={handleDataExport}>
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
      </div>
    </div>
  );
}
