'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Tooltip,
} from 'recharts';
import type { SystemHealthAPIResponse } from '@/types/admin-dashboard.types';
import { COLORS, SEVERITY_COLORS } from '@/constants/chart-colors';
import {
  getPerformanceChartData,
  getAvailabilityChartData,
  getAlertsChartData,
  getTrendsChartData,
} from '@/utils/admin-chart-data';
import CustomTooltip from './charts/CustomTooltip';
import {
  Activity,
  Server,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { timerManager } from '@/utils/TimerManager';


export default function AdminDashboardCharts() {
  const [data, setData] = useState<SystemHealthAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 📡 API 데이터 가져오기
  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/system/health');
      if (!response.ok) {
        throw new Error(
          `API 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const healthData: SystemHealthAPIResponse = await response.json();
      setData(healthData);
      setLastUpdate(new Date());

      console.log('✅ 관리자 대시보드 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('❌ 관리자 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 자동 새로고침 (30초 인터벌)
  useEffect(() => {
    fetchHealthData(); // 초기 로드

    if (autoRefresh) {
      // TimerManager를 사용한 자동 새로고침
      timerManager.register({
        id: 'admin-dashboard-charts-refresh',
        callback: fetchHealthData,
        interval: 30000,
        priority: 'medium',
        enabled: true,
      });
    } else {
      timerManager.unregister('admin-dashboard-charts-refresh');
    }

    return () => {
      timerManager.unregister('admin-dashboard-charts-refresh');
    };
  }, [autoRefresh, fetchHealthData]);


  // 🔄 수동 새로고침
  const handleManualRefresh = () => {
    fetchHealthData();
  };

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Activity className="h-6 w-6 text-blue-600" />
            시스템 모니터링 대시보드
          </h2>
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">데이터 로딩 중...</span>
          </div>
        </div>

        {/* 로딩 스켈레톤 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="_animate-pulse rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 h-4 w-1/3 rounded bg-gray-200"></div>
              <div className="h-64 rounded bg-gray-100"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-red-800">
            데이터 로드 실패
          </h3>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="mx-auto flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const performanceData = getPerformanceChartData(data);
  const availabilityData = getAvailabilityChartData(data);
  const alertsData = getAlertsChartData(data);
  const trendsData = getTrendsChartData(data);

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Activity className="h-6 w-6 text-blue-600" />
            시스템 모니터링 대시보드
          </h2>
          <p className="mt-1 text-gray-600">
            실시간 서버 성능 및 상태 모니터링
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* 연결 상태 */}
          <div className="flex items-center gap-2">
            {data.summary.dataSource === 'api' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {data.summary.dataSource === 'api'
                ? '실시간 연결'
                : 'Fallback 모드'}
            </span>
          </div>

          {/* 자동 새로고침 토글 */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* 수동 새로고침 */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            title="수동 새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* 마지막 업데이트 */}
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString('ko-KR')} 업데이트
            </span>
          )}
        </div>
      </div>

      {/* 요약 카드들 */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">헬스 스코어</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.healthScore}/100
              </p>
            </div>
            <div
              className={`h-3 w-3 rounded-full ${
                data.summary.healthScore >= 80
                  ? 'bg-green-500'
                  : data.summary.healthScore >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            ></div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">서버 수</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.serverCount}
              </p>
            </div>
            <Server className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">심각한 이슈</p>
              <p className="text-2xl font-bold text-red-600">
                {data.summary.criticalIssues}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">경고</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.summary.warnings}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. 실시간 자원 사용률 - BarChart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            실시간 자원 사용률
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 서버 가용성 - DonutChart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Server className="h-5 w-5 text-green-600" />
            서버 가용성
          </h3>
          <div className="flex h-64 items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* @ts-ignore - Recharts 3.x PieProps 타입 정의 이슈 (children prop + data prop) */}
                <Pie
                  data={availabilityData as any}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {availabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              가용성: {data.charts.availabilityChart.rate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 3. 알림 분포 - PieChart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            알림 분포
          </h3>
          <div className="h-64">
            {alertsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* @ts-ignore - Recharts 3.x PieProps 타입 정의 이슈 (children prop + data prop) */}
                  <Pie
                    data={alertsData as any}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    {alertsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p>알림 없음</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              총 알림: {data.charts.alertsChart.total}개
            </p>
          </div>
        </div>

        {/* 4. 트렌드 변화 - LineChart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            성능 트렌드
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="CPU"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.danger }}
                />
                <Line
                  type="monotone"
                  dataKey="Memory"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.warning }}
                />
                <Line
                  type="monotone"
                  dataKey="Alerts"
                  stroke={COLORS.info}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.info }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 이상 징후 및 권장사항 */}
      {(data.anomalies.length > 0 || data.recommendations.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 이상 징후 */}
          {data.anomalies.length > 0 && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                감지된 이상 징후
              </h3>
              <div className="max-h-48 space-y-3 overflow-y-auto">
                {data.anomalies.slice(0, 5).map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`rounded-lg border-l-4 p-3 ${
                      anomaly.severity === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : anomaly.severity === 'high'
                          ? 'border-orange-500 bg-orange-50'
                          : anomaly.severity === 'medium'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {anomaly.description}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          {anomaly.recommendation}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          anomaly.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : anomaly.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : anomaly.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {anomaly.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 권장사항 */}
          {data.recommendations.length > 0 && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                시스템 권장사항
              </h3>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {data.recommendations
                  .slice(0, 6)
                  .map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded p-2 hover:bg-gray-50"
                    >
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
