/**
 * 📊 컴팩트 모니터링 헤더 - UI 리팩토링 v1.0
 *
 * ✨ 기능:
 * - 모니터링 관련 정보만 상단 1/3 영역에 표시
 * - RealTime Hub, Pattern Matcher, Data Retention 통합
 * - 서버 대수 표시와 통합된 컴팩트 레이아웃
 * - 핵심 지표만 표시하는 정보 밀도 최적화
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  BarChart3,
  Database,
  Monitor,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { type ElementType, type FC, useEffect, useState } from 'react';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';

interface CompactMonitoringHeaderProps {
  serverStats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  };
  onSettingsClick?: () => void;
  className?: string;
}

const StatusIndicator: FC<{
  isActive: boolean;
  label: string;
  value: string | number;
  icon: ElementType;
}> = ({ isActive, label, value, icon: Icon }) => (
  <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 shadow-xs backdrop-blur-sm">
    <Icon
      className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-red-500'}`}
    />
    <div className="text-left">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  </div>
);
const ServerCountCard: FC<{
  count: number;
  label: string;
  color: string;
}> = ({ count, label, color }) => (
  <div className="text-center">
    <div className={`text-lg font-bold ${color}`}>{count}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export const CompactMonitoringHeader: FC<CompactMonitoringHeaderProps> = ({
  serverStats,
  onSettingsClick,
  className = '',
}) => {
  const systemIntegration = useSystemIntegration();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // 5초마다 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-[33vh] border-b border-gray-200 bg-linear-to-br from-blue-50 to-cyan-50 ${className}`}
    >
      <div className="mx-auto h-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* 헤더 타이틀 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                실시간 모니터링
              </h2>
              <p className="text-xs text-gray-500">
                마지막 업데이트: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLastRefresh(new Date())}
              className="rounded-lg p-2 text-gray-500 transition-all hover:bg-white/50 hover:text-gray-700"
              title="새로고침"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onSettingsClick}
              className="rounded-lg p-2 text-gray-500 transition-all hover:bg-white/50 hover:text-gray-700"
              title="설정"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="grid h-[calc(100%-60px)] grid-cols-1 gap-4 lg:grid-cols-12">
          {/* 서버 통계 (왼쪽) */}
          <div className="rounded-lg bg-white/80 p-4 shadow-xs backdrop-blur-sm lg:col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">서버 현황</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ServerCountCard
                count={serverStats.total}
                label="전체"
                color="text-gray-700"
              />
              <ServerCountCard
                count={serverStats.online}
                label="온라인"
                color="text-green-600"
              />
              <ServerCountCard
                count={serverStats.warning}
                label="경고"
                color="text-orange-600"
              />
              <ServerCountCard
                count={serverStats.offline}
                label="오프라인"
                color="text-red-600"
              />
            </div>
          </div>

          {/* 모니터링 모듈 상태 (중앙) */}
          <div className="space-y-3 lg:col-span-6">
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-3">
              {/* RealTime Hub */}
              <StatusIndicator
                isActive={systemIntegration.realTimeHub.status === 'connected'}
                label="RealTime Hub"
                value={`${systemIntegration.realTimeHub.messages} 메시지`}
                icon={
                  systemIntegration.realTimeHub.status === 'connected'
                    ? Wifi
                    : WifiOff
                }
              />

              {/* Pattern Matcher */}
              <StatusIndicator
                isActive={systemIntegration.patternMatcher.status === 'running'}
                label="Pattern Matcher"
                value={`${systemIntegration.patternMatcher.patternsDetected} 패턴`}
                icon={Activity}
              />

              {/* Data Retention */}
              <StatusIndicator
                isActive={systemIntegration.dataRetention.status === 'active'}
                label="Data Retention"
                value={`${systemIntegration.dataRetention.usage}% 사용`}
                icon={Database}
              />
            </div>
          </div>

          {/* 시스템 요약 (오른쪽) */}
          <div className="rounded-lg bg-white/80 p-4 shadow-xs backdrop-blur-sm lg:col-span-3">
            <h3 className="mb-3 font-semibold text-gray-900">시스템 요약</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">활성 모듈</span>
                <span className="font-medium">
                  {systemIntegration.moduleCount}개
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">총 이벤트</span>
                <span className="font-medium">
                  {systemIntegration.eventStats.total}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">실패 이벤트</span>
                <span className="font-medium text-red-600">
                  {systemIntegration.eventStats.failed}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">응답 시간</span>
                <span className="font-medium">
                  {systemIntegration.realTimeHub.latency}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
