/**
 * 📊 AI 성능 모니터링 컴포넌트
 * 
 * 실시간 AI 시스템 성능, 캐시 통계, 에러 분석 표시
 * AISidebarV3에 통합되어 개발자 도구로 사용
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  RefreshCw,
  Database,
  Clock,
  TrendingUp
} from 'lucide-react';

interface MonitoringData {
  timestamp: string;
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    hitRateImprovement: string;
    totalEntries: number;
    memoryUsage: {
      entriesCount: number;
      maxEntries: number;
      utilizationRate: number;
    };
  };
  engines: {
    local: {
      status: 'active' | 'inactive';
      requestCount: number;
      avgResponseTime: number;
    };
    googleAI: {
      status: 'active' | 'inactive';
      requestCount: number;
      avgResponseTime: number;
      apiUsage: {
        dailyRequests: number;
        dailyLimit: number;
        utilizationRate: number;
      };
    };
  };
}

interface AIPerformanceMonitorProps {
  className?: string;
  refreshInterval?: number; // seconds
}

export default function AIPerformanceMonitor({ 
  className = '', 
  refreshInterval = 30 
}: AIPerformanceMonitorProps) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/ai/monitoring');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      console.error('모니터링 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    void fetchMonitoringData();
  }, [fetchMonitoringData]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => { void fetchMonitoringData(); }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchMonitoringData, refreshInterval, autoRefresh]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: 'active' | 'inactive') => {
    return status === 'active' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">모니터링 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">모니터링 오류: {error}</span>
        </div>
        <button
          onClick={() => { void fetchMonitoringData(); }}
          className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm text-gray-800">AI 성능 모니터</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2 py-1 rounded ${
              autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {autoRefresh ? '자동' : '수동'}
          </button>
          <button
            onClick={() => { void fetchMonitoringData(); }}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 성능 지표 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded p-2">
            <div className="flex items-center space-x-1 mb-1">
              <BarChart3 className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">응답 시간</span>
            </div>
            <div className={`text-sm font-bold ${getStatusColor(data.performance.avgResponseTime, { good: 300, warning: 500 })}`}>
              {Math.round(data.performance.avgResponseTime)}ms
            </div>
            <div className="text-xs text-gray-600">
              {data.performance.totalRequests}개 요청 (24h)
            </div>
          </div>

          <div className="bg-green-50 rounded p-2">
            <div className="flex items-center space-x-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">성공률</span>
            </div>
            <div className={`text-sm font-bold ${getStatusColor(data.performance.successRate, { good: 95, warning: 85 })}`}>
              {data.performance.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">
              오류: {data.performance.errorRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 캐시 성능 */}
        <div className="bg-purple-50 rounded p-2">
          <div className="flex items-center space-x-1 mb-1">
            <Database className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-800">캐시 히트율</span>
          </div>
          <div className="flex items-center justify-between">
            <div className={`text-sm font-bold ${getStatusColor(data.cache.hitRate, { good: 60, warning: 40 })}`}>
              {data.cache.hitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-purple-700">
              {data.cache.totalEntries}개 항목
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            메모리: {data.cache.memoryUsage.utilizationRate}% 사용
          </div>
          {data.cache.hitRateImprovement.includes('목표') && (
            <div className="text-xs text-green-700 mt-1">
              {data.cache.hitRateImprovement}
            </div>
          )}
        </div>

        {/* AI 엔진 상태 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>AI 엔진 상태</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Local Engine */}
            <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
              <div className="flex items-center space-x-2">
                {getStatusIcon(data.engines.local.status)}
                <span className="text-xs font-medium">Local</span>
              </div>
              <div className="text-xs text-gray-600">
                {data.engines.local.requestCount}회 / {Math.round(data.engines.local.avgResponseTime)}ms
              </div>
            </div>

            {/* Google AI Engine */}
            <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
              <div className="flex items-center space-x-2">
                {getStatusIcon(data.engines.googleAI.status)}
                <span className="text-xs font-medium">Google AI</span>
              </div>
              <div className="text-xs text-gray-600">
                {data.engines.googleAI.requestCount}회 / {Math.round(data.engines.googleAI.avgResponseTime)}ms
              </div>
            </div>

            {/* Google AI API 사용량 */}
            {data.engines.googleAI.status === 'active' && (
              <div className="bg-yellow-50 rounded px-2 py-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yellow-800">API 사용량</span>
                  <span className="font-medium text-yellow-900">
                    {data.engines.googleAI.apiUsage.utilizationRate}%
                  </span>
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  {data.engines.googleAI.apiUsage.dailyRequests}/{data.engines.googleAI.apiUsage.dailyLimit} (일일)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 마지막 업데이트 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              마지막 업데이트: {lastUpdated?.toLocaleTimeString() || 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{refreshInterval}초마다 갱신</span>
          </div>
        </div>
      </div>
    </div>
  );
}