/**
 * 📊 PerformanceDashboard Utils
 * 
 * Utility functions for performance dashboard:
 * - Data export functionality
 * - Manual refresh handlers
 * - Helper functions
 */

import type { PerformanceData } from './PerformanceDashboard.types';

/**
 * 📥 데이터 내보내기 함수
 * 현재 성능 데이터를 JSON 파일로 내보냄 (Vercel 무료 티어 최적화)
 */
export async function handleExportData(
  data: PerformanceData | null,
  selectedTimeRange: string
): Promise<void> {
  try {
    if (!data) {
      console.warn('내보낼 데이터가 없습니다.');
      return;
    }

    // 현재 표시된 데이터를 JSON으로 내보내기
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      data: data,
      source: 'portfolio-demo',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('✅ 성능 데이터 내보내기 완료');
  } catch (error) {
    console.error('❌ 데이터 내보내기 실패:', error);
  }
}

/**
 * 🔄 수동 새로고침 핸들러
 */
export function createManualRefreshHandler(
  fetchPerformanceData: () => Promise<void>
) {
  return () => {
    fetchPerformanceData();
  };
}

/**
 * 📊 성능 상태 계산
 */
export function getPerformanceStatus(score: number): {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  color: string;
  message: string;
} {
  if (score >= 90) {
    return {
      status: 'excellent',
      color: 'text-green-600',
      message: '매우 우수한 성능',
    };
  } else if (score >= 75) {
    return {
      status: 'good',
      color: 'text-blue-600',
      message: '양호한 성능',
    };
  } else if (score >= 60) {
    return {
      status: 'warning',
      color: 'text-yellow-600',
      message: '개선이 필요한 성능',
    };
  } else {
    return {
      status: 'critical',
      color: 'text-red-600',
      message: '심각한 성능 문제',
    };
  }
}

/**
 * 📅 시간 범위 옵션
 */
export const TIME_RANGE_OPTIONS = [
  { value: '30', label: '최근 30분' },
  { value: '60', label: '최근 1시간' },
  { value: '360', label: '최근 6시간' },
  { value: '1440', label: '최근 24시간' },
] as const;