/**
 * Performance Monitor Component
 * Real-time performance monitoring dashboard with charts and alerts
 */

'use client';

import { type FC, useMemo } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import type { Alert as AlertType } from '../types/performance';

interface PerformanceMonitorProps {
  updateInterval?: number;
  historyLimit?: number;
  showAlerts?: boolean;
  showCharts?: boolean;
  className?: string;
}

const PerformanceMonitor: FC<PerformanceMonitorProps> = ({
  updateInterval = 5000,
  historyLimit = 50,
  showAlerts = true,
  showCharts = true,
  className = '',
}) => {
  const {
    performanceData,
    isConnected,
    isLoading,
    error,
    refreshMetrics,
    resolveAlert,
    clearResolvedAlerts,
    activeAlerts,
    systemHealth,
  } = usePerformanceMetrics({
    updateInterval,
    historyLimit,
    autoConnect: true,
  });

  // Chart data for metrics history
  const metricsChartData = useMemo(() => {
    return performanceData.history.map((metric) => ({
      time: new Date(metric.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      cpu: metric.cpu,
      memory: metric.memory,
      responseTime: metric.responseTime / 10, // Scaled for visualization
    }));
  }, [performanceData.history]);

  // System health doughnut chart data
  const healthChartData = useMemo(() => {
    const score = systemHealth.score;
    const remaining = 100 - score;

    return [
      {
        name: 'Health Score',
        value: score,
        color:
          systemHealth.status === 'healthy'
            ? '#10B981'
            : systemHealth.status === 'warning'
              ? '#F59E0B'
              : '#EF4444',
      },
      { name: 'Issues', value: remaining, color: '#E5E7EB' },
    ];
  }, [systemHealth]);

  const getAlertColor = (severity: AlertType['severity']) => {
    return severity === 'critical'
      ? 'bg-red-100 border-red-500 text-red-700'
      : 'bg-yellow-100 border-yellow-500 text-yellow-700';
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatMetricValue = (value: number, unit: string) => {
    return `${value.toFixed(1)}${unit}`;
  };

  return (
    <div className={`performance-monitor space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Performance Monitor
        </h2>
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 ${getHealthStatusColor(systemHealth.status)}`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                systemHealth.status === 'healthy'
                  ? 'bg-green-500'
                  : systemHealth.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              {systemHealth.status.toUpperCase()} ({systemHealth.score}%)
            </span>
          </div>
          <div
            className={`flex items-center space-x-2 ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={refreshMetrics}
            disabled={isLoading}
            className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Current Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            CPU Usage
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatMetricValue(performanceData.current.cpu, '%')}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Memory Usage
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMetricValue(performanceData.current.memory, '%')}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Response Time
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatMetricValue(performanceData.current.responseTime, 'ms')}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Active Connections
          </h3>
          <p className="text-3xl font-bold text-indigo-600">
            {performanceData.current.activeConnections}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Error Rate
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {formatMetricValue(performanceData.current.errorRate, '%')}
          </p>
        </div>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Metrics History Chart */}
          <div className="rounded-lg border bg-white p-6 shadow-md lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
              Performance Metrics History
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="rgb(255, 99, 132)"
                    name="CPU %"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="rgb(54, 162, 235)"
                    name="Memory %"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="rgb(255, 205, 86)"
                    name="Response Time (ms/10)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Health Chart */}
          <div className="rounded-lg border bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
              System Health: {systemHealth.status.toUpperCase()}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {showAlerts && (
        <div className="rounded-lg border bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Alerts ({activeAlerts.length})
            </h3>
            {activeAlerts.length > 0 && (
              <button
                onClick={clearResolvedAlerts}
                className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                Clear Resolved
              </button>
            )}
          </div>
          <div className="p-6">
            {activeAlerts.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-md border-l-4 p-4 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {alert.severity.toUpperCase()} -{' '}
                          {alert.type.replace('-', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm">{alert.message}</p>
                        <p className="mt-1 text-xs">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="rounded-md bg-white/50 px-3 py-1 text-xs transition-all hover:bg-white/75"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-gray-500">
        <p>
          Last update:{' '}
          {new Date(performanceData.current.timestamp).toLocaleString()}
        </p>
        <p>History entries: {performanceData.history.length}</p>
        <p>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
