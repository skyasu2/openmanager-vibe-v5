/**
 * Performance Monitor Component
 * Real-time performance monitoring dashboard with charts and alerts
 */

'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import { Alert as AlertType, PerformanceMetric } from '../types/performance';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PerformanceMonitorProps {
  updateInterval?: number;
  historyLimit?: number;
  showAlerts?: boolean;
  showCharts?: boolean;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
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
    const history = performanceData.history;
    const labels = history.map(metric => 
      new Date(metric.timestamp).toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'CPU %',
          data: history.map(metric => metric.cpu),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Memory %',
          data: history.map(metric => metric.memory),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Response Time (ms/10)',
          data: history.map(metric => metric.responseTime / 10),
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
        },
      ],
    };
  }, [performanceData.history]);

  // System health doughnut chart
  const healthChartData = useMemo(() => {
    const score = systemHealth.score;
    const remaining = 100 - score;

    return {
      labels: ['Health Score', 'Issues'],
      datasets: [
        {
          data: [score, remaining],
          backgroundColor: [
            systemHealth.status === 'healthy' ? '#10B981' :
            systemHealth.status === 'warning' ? '#F59E0B' : '#EF4444',
            '#E5E7EB',
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [systemHealth]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const healthChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: `System Health: ${systemHealth.status.toUpperCase()}`,
      },
    },
  };

  const getAlertColor = (severity: AlertType['severity']) => {
    return severity === 'critical' ? 'bg-red-100 border-red-500 text-red-700' : 
           'bg-yellow-100 border-yellow-500 text-yellow-700';
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatMetricValue = (value: number, unit: string) => {
    return `${value.toFixed(1)}${unit}`;
  };

  return (
    <div className={`performance-monitor space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${getHealthStatusColor(systemHealth.status)}`}>
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.status === 'healthy' ? 'bg-green-500' :
              systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              {systemHealth.status.toUpperCase()} ({systemHealth.score}%)
            </span>
          </div>
          <div className={`flex items-center space-x-2 ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={refreshMetrics}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">CPU Usage</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatMetricValue(performanceData.current.cpu, '%')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Memory Usage</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMetricValue(performanceData.current.memory, '%')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Response Time</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatMetricValue(performanceData.current.responseTime, 'ms')}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Connections</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {performanceData.current.activeConnections}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Rate</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatMetricValue(performanceData.current.errorRate, '%')}
          </p>
        </div>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics History Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border">
            <div className="h-64">
              <Line data={metricsChartData} options={chartOptions} />
            </div>
          </div>

          {/* System Health Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="h-64">
              <Doughnut data={healthChartData} options={healthChartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {showAlerts && (
        <div className="bg-white rounded-lg shadow-md border">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Alerts ({activeAlerts.length})
            </h3>
            {activeAlerts.length > 0 && (
              <button
                onClick={clearResolvedAlerts}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Resolved
              </button>
            )}
          </div>
          <div className="p-6">
            {activeAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 rounded-md ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {alert.severity.toUpperCase()} - {alert.type.replace('-', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-white bg-opacity-50 rounded-md hover:bg-opacity-75 transition-all"
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
        <p>Last update: {new Date(performanceData.current.timestamp).toLocaleString()}</p>
        <p>History entries: {performanceData.history.length}</p>
        <p>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;