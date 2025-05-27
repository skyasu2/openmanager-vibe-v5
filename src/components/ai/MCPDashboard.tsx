'use client';

import React, { useState, useEffect } from 'react';
import { useMCPAnalysis } from '@/hooks/useMCPAnalysis';

interface MCPDashboardProps {
  className?: string;
}

interface MonitoringData {
  warmup?: {
    successRate: number;
    averageWarmupTime: number;
    lastSuccessTime: string;
    totalAttempts: number;
  };
  performance?: {
    totalRequests: number;
    averageResponseTime: number;
    requestsPerMinute: number;
    enginesUsage: Record<string, number>;
  };
  health?: {
    status: string;
    pythonServiceStatus: string;
    warmupHealth: string;
  };
  summary?: {
    overallSuccessRate: number;
    systemStatus: string;
  };
}

export default function MCPDashboard({ className = '' }: MCPDashboardProps) {
  const {
    loading,
    error,
    analyzeWithMCP,
    performHealthCheck
  } = useMCPAnalysis();
  
  // 임시 상태
  const [lastResult, setLastResult] = useState<any>(null);

  const [monitoringData, setMonitoringData] = useState<MonitoringData>({});
  const [query, setQuery] = useState('');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 실시간 모니터링 데이터 가져오기
  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const response = await fetch('/api/admin/monitoring?type=all');
        if (response.ok) {
          const data = await response.json();
          setMonitoringData(data.data || {});
        }
      } catch (error) {
        console.warn('모니터링 데이터 가져오기 실패:', error);
      }
    };

    fetchMonitoringData();
    
    // 5분마다 업데이트 (폴링 빈도 감소)
    const interval = setInterval(fetchMonitoringData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 통계 가져오기
  useEffect(() => {
    if (!isMonitoring) return;

    const fetchRealTimeStats = async () => {
      try {
        const response = await fetch('/api/admin/monitoring?type=realtime');
        if (response.ok) {
          const data = await response.json();
          setRealTimeStats(data.data);
        }
      } catch (error) {
        console.warn('실시간 통계 가져오기 실패:', error);
      }
    };

    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 30000); // 30초마다 (폴링 빈도 감소)
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleAnalysis = async () => {
    if (!query.trim()) return;

    const sampleMetrics = [
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        cpu: 65, memory: 70, disk: 45, networkIn: 1500, networkOut: 2500
      },
      {
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        cpu: 72, memory: 75, disk: 46, networkIn: 1800, networkOut: 2800
      },
      {
        timestamp: new Date().toISOString(),
        cpu: 75, memory: 78, disk: 48, networkIn: 2000, networkOut: 3000
      }
    ];

    try {
      const result = await analyzeWithMCP({
        query,
        context: {
          serverMetrics: sampleMetrics,
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          }
        }
      });
      setLastResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleHealthCheck = async () => {
    await performHealthCheck();
  };

  const handleStatusCheck = async () => {
    // 상태 확인 로직
    console.log('Status check requested');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'up':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'slow':
      case 'poor':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'down':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧠 MCP AI 시스템 대시보드
        </h2>
        <p className="text-gray-600">
          하이브리드 AI 분석 및 실시간 모니터링
        </p>
      </div>

      {/* 시스템 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-2">시스템 상태</h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor(monitoringData.health?.status || 'unknown')
          }`}>
            {monitoringData.health?.status || 'Unknown'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Python 서비스</h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor(monitoringData.health?.pythonServiceStatus || 'unknown')
          }`}>
            {monitoringData.health?.pythonServiceStatus || 'Unknown'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-2">웜업 상태</h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor(monitoringData.health?.warmupHealth || 'unknown')
          }`}>
            {monitoringData.health?.warmupHealth || 'Unknown'}
          </div>
          {monitoringData.warmup && (
            <div className="mt-2 text-xs text-gray-500">
              성공률: {(monitoringData.warmup.successRate * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-2">전체 성공률</h3>
          <div className="text-2xl font-bold text-blue-600">
            {monitoringData.summary?.overallSuccessRate ? 
              `${(monitoringData.summary.overallSuccessRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
          {monitoringData.performance && (
            <div className="text-xs text-gray-500 mt-1">
              총 {monitoringData.performance.totalRequests}개 요청
            </div>
          )}
        </div>
      </div>

      {/* 성능 메트릭 */}
      {monitoringData.performance && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 성능 메트릭</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">평균 응답시간</div>
              <div className="text-xl font-bold text-blue-600">
                {formatTime(monitoringData.performance.averageResponseTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">분당 요청수</div>
              <div className="text-xl font-bold text-green-600">
                {monitoringData.performance.requestsPerMinute}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">총 요청수</div>
              <div className="text-xl font-bold text-purple-600">
                {monitoringData.performance.totalRequests}
              </div>
            </div>
          </div>

          {/* 엔진 사용량 */}
          {monitoringData.performance.enginesUsage && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">엔진 사용량</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {Object.entries(monitoringData.performance.enginesUsage).map(([engine, count]) => (
                  <div key={engine} className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-medium capitalize">{engine}</div>
                    <div className="text-blue-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI 분석 실행 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 AI 분석 실행</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              분석 요청
            </label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 서버 CPU 사용률이 높아지고 있어요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleAnalysis}
              disabled={loading || !query.trim()}
              className={`px-4 py-2 rounded-md font-medium ${
                loading || !query.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '분석 중...' : '분석 실행'}
            </button>

            <button
              onClick={handleHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
            >
              헬스체크
            </button>

            <button
              onClick={handleStatusCheck}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300"
            >
              상태 확인
            </button>

            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-4 py-2 rounded-md font-medium ${
                isMonitoring 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {isMonitoring ? '모니터링 중지' : '실시간 모니터링'}
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 font-medium">오류</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* 결과 표시 */}
        {lastResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="font-medium text-gray-900 mb-2">분석 결과</div>
            <div className="text-sm text-gray-600 mb-2">
              신뢰도: {Math.round(lastResult.confidence * 100)}% | 
              처리시간: {formatTime(lastResult.processingTime)} | 
              사용 엔진: {lastResult.enginesUsed.join(', ')}
            </div>
            <div className="text-gray-800">{lastResult.summary}</div>
            
            {lastResult.recommendations?.length > 0 && (
              <div className="mt-2">
                <div className="font-medium text-gray-900 mb-1">권장사항:</div>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {lastResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 실시간 통계 */}
      {isMonitoring && realTimeStats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 실시간 통계 (자동 업데이트)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">최근 5분</h4>
              <div className="text-sm space-y-1">
                <div>요청: {realTimeStats.last5Minutes.requests}개</div>
                <div>성공률: {(realTimeStats.last5Minutes.successRate * 100).toFixed(1)}%</div>
                <div>평균 응답시간: {formatTime(realTimeStats.last5Minutes.averageResponseTime)}</div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">최근 1시간</h4>
              <div className="text-sm space-y-1">
                <div>요청: {realTimeStats.last1Hour.requests}개</div>
                <div>성공률: {(realTimeStats.last1Hour.successRate * 100).toFixed(1)}%</div>
                <div>평균 응답시간: {formatTime(realTimeStats.last1Hour.averageResponseTime)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            업타임: {formatTime(realTimeStats.current.uptime)} | 
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      )}

      {/* 웜업 정보 */}
      {monitoringData.warmup && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 웜업 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">총 시도</div>
              <div className="text-xl font-bold text-gray-900">
                {monitoringData.warmup.totalAttempts}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">성공률</div>
              <div className="text-xl font-bold text-green-600">
                {(monitoringData.warmup.successRate * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">평균 웜업 시간</div>
              <div className="text-xl font-bold text-blue-600">
                {formatTime(monitoringData.warmup.averageWarmupTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">마지막 성공</div>
              <div className="text-sm text-gray-900">
                {formatDate(monitoringData.warmup.lastSuccessTime)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 