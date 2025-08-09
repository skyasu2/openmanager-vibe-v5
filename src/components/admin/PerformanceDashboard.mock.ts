/**
 * 📊 PerformanceDashboard Mock Data
 * 
 * Mock data generation for performance dashboard:
 * - Simulated performance metrics
 * - Network delay simulation
 * - Vercel free tier optimization
 */

import type { PerformanceData } from './PerformanceDashboard.types';

/**
 * 📡 성능 데이터 가져오기 (모킹)
 * Vercel 무료 티어 최적화로 실제 API 대신 모킹 사용
 */
export async function fetchPerformanceData(): Promise<PerformanceData> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockData: PerformanceData = {
    stats: {
      totalRequests: Math.floor(Math.random() * 1000) + 500,
      averageResponseTime: Math.floor(Math.random() * 100) + 120,
      successRate: (95 + Math.random() * 4) / 100,
      errorRate: (Math.random() * 3) / 100,
      fallbackRate: (Math.random() * 10) / 100,
      engineStats: {
        'google-ai': {
          requests: 150,
          averageResponseTime: 250,
          successRate: 0.98,
          confidence: 0.95,
        },
        mcp: {
          requests: 200,
          averageResponseTime: 180,
          successRate: 0.96,
          confidence: 0.93,
        },
        rag: {
          requests: 120,
          averageResponseTime: 200,
          successRate: 0.94,
          confidence: 0.89,
        },
      },
      modeStats: {
        'google-only': {
          requests: 300,
          averageResponseTime: 235,
          successRate: 0.99,
        },
        'with-fallback': {
          requests: 150,
          averageResponseTime: 280,
          successRate: 0.98,
        },
        hybrid: {
          requests: 20,
          averageResponseTime: 195,
          successRate: 0.97,
        },
      },
      hourlyStats: Array.from({ length: 24 }, (_, i) => ({
        hour: new Date(
          Date.now() - (23 - i) * 60 * 60 * 1000
        ).toISOString(),
        requests: Math.floor(Math.random() * 100) + 50,
        averageResponseTime: Math.floor(Math.random() * 200) + 150,
        successRate: 0.95 + Math.random() * 0.05,
      })),
      lastUpdated: new Date().toISOString(),
    },
    alerts: [],
    status: {
      enabled: true,
      metricsCount: Math.floor(Math.random() * 1000) + 500,
      alertsCount: 0,
      lastMetricTime: new Date().toISOString(),
    },
  };

  return mockData;
}