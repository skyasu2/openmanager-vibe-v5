/**
 * 📊 PerformanceDashboard Data Processing
 *
 * Data transformation functions for performance dashboard:
 * - Chart data conversion
 * - Statistics aggregation
 * - Filter and search logic
 */

import type {
  PerformanceData,
  PerformanceAlert,
} from './PerformanceDashboard.types';
import { ENGINE_COLORS, COLORS } from './PerformanceDashboard.constants';

/**
 * 📊 차트 데이터 변환 - 엔진별 성능 데이터
 */
export function getEnginePerformanceData(data: PerformanceData | null) {
  if (!data?.stats.engineStats) return [];

  return Object.entries(data.stats.engineStats).map(([engine, stats]) => ({
    name: engine,
    requests: stats.requests,
    responseTime: stats.averageResponseTime,
    successRate: stats.successRate * 100,
    confidence: stats.confidence * 100,
    color: ENGINE_COLORS[engine] || COLORS.info,
  }));
}

/**
 * 🧩 AI 모드별 분포 데이터
 */
export function getModeDistributionData(data: PerformanceData | null) {
  if (!data?.stats.modeStats) return [];

  return Object.entries(data.stats.modeStats).map(([_mode, stats]) => ({
    name: _mode,
    value: stats.requests,
    successRate: stats.successRate * 100,
  }));
}

/**
 * 📈 시간별 트렌드 데이터
 */
export function getHourlyTrendsData(data: PerformanceData | null) {
  if (!data?.stats.hourlyStats) return [];

  return data.stats.hourlyStats.map((stat) => ({
    time: new Date(stat.hour).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    requests: stat.requests,
    responseTime: stat.averageResponseTime,
    successRate: stat.successRate * 100,
  }));
}

/**
 * 🚨 알림 필터링 및 정렬
 */
export function getFilteredAlerts(
  data: PerformanceData | null,
  filterEngine: string,
  searchQuery: string
): PerformanceAlert[] {
  if (!data?.alerts) return [];

  let filtered = data.alerts;

  // 엔진 필터링
  if (filterEngine !== 'all') {
    filtered = filtered.filter((alert) => alert.engine === filterEngine);
  }

  // 검색 필터링
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (alert) =>
        alert.message.toLowerCase().includes(query) ||
        alert.engine.toLowerCase().includes(query)
    );
  }

  // 시간순 정렬 (최신순)
  return filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * 🎯 성능 점수 계산
 * 성공률(40%) + 응답시간(40%) + 에러율(20%) 가중 평균
 */
export function calculatePerformanceScore(
  data: PerformanceData | null
): number {
  if (!data?.stats) return 0;

  const { successRate, averageResponseTime, errorRate } = data.stats;

  // 성공률 점수 (40% 가중치)
  const successScore = successRate * 40;

  // 응답시간 점수 (40% 가중치) - 5000ms 기준으로 역계산
  const responseScore = Math.max(0, (5000 - averageResponseTime) / 5000) * 40;

  // 에러율 점수 (20% 가중치) - 10% 이하면 만점
  const errorScore = Math.max(0, (0.1 - errorRate) / 0.1) * 20;

  return Math.round(successScore + responseScore + errorScore);
}
