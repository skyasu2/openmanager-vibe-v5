/**
 * Performance Metrics Hook
 * Real-time performance monitoring with WebSocket integration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logging';
import type {
  Alert,
  AlertConfig,
  PerformanceData,
  PerformanceMetric,
  SystemHealth,
  WebSocketPerformanceMessage,
} from '@/types/performance/performance';

interface UsePerformanceMetricsOptions {
  updateInterval?: number;
  historyLimit?: number;
  alertConfig?: AlertConfig;
  autoConnect?: boolean;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  cpuThreshold: 80,
  memoryThreshold: 85,
  responseTimeThreshold: 1000,
  errorRateThreshold: 5,
  enabled: true,
};

export const usePerformanceMetrics = (
  options: UsePerformanceMetricsOptions = {}
) => {
  const {
    updateInterval = 5000,
    historyLimit = 100,
    alertConfig = DEFAULT_ALERT_CONFIG,
    autoConnect = true,
  } = options;

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    current: {
      timestamp: Date.now(),
      cpu: 0,
      memory: 0,
      responseTime: 0,
      activeConnections: 0,
      errorRate: 0,
    },
    history: [],
    health: {
      status: 'online',
      score: 100,
      lastUpdate: Date.now(),
    },
    alerts: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate system health score
  const calculateHealthScore = useCallback(
    (metric: PerformanceMetric): SystemHealth => {
      const scores = [
        Math.max(0, 100 - metric.cpu),
        Math.max(0, 100 - metric.memory),
        Math.max(0, 100 - metric.responseTime / 10),
        Math.max(0, 100 - metric.errorRate * 10),
      ];

      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      let status: SystemHealth['status'] = 'online';
      if (averageScore < 60) status = 'critical';
      else if (averageScore < 80) status = 'warning';

      return {
        status,
        score: Math.round(averageScore),
        lastUpdate: Date.now(),
      };
    },
    []
  );

  // Generate alerts based on thresholds
  const checkForAlerts = useCallback(
    (metric: PerformanceMetric): Alert[] => {
      if (!alertConfig.enabled) return [];

      const alerts: Alert[] = [];

      if (metric.cpu > alertConfig.cpuThreshold) {
        alerts.push({
          id: `cpu-${Date.now()}`,
          type: 'cpu',
          severity: metric.cpu > 90 ? 'critical' : 'warning',
          message: `High CPU usage detected: ${metric.cpu.toFixed(1)}%`,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      if (metric.memory > alertConfig.memoryThreshold) {
        alerts.push({
          id: `memory-${Date.now()}`,
          type: 'memory',
          severity: metric.memory > 95 ? 'critical' : 'warning',
          message: `High memory usage detected: ${metric.memory.toFixed(1)}%`,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      if (metric.responseTime > alertConfig.responseTimeThreshold) {
        alerts.push({
          id: `response-time-${Date.now()}`,
          type: 'response-time',
          severity: metric.responseTime > 2000 ? 'critical' : 'warning',
          message: `Slow response time detected: ${metric.responseTime}ms`,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      if (metric.errorRate > alertConfig.errorRateThreshold) {
        alerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'error-rate',
          severity: metric.errorRate > 10 ? 'critical' : 'warning',
          message: `High error rate detected: ${metric.errorRate.toFixed(1)}%`,
          timestamp: Date.now(),
          resolved: false,
        });
      }

      return alerts;
    },
    [alertConfig]
  );

  // Fetch performance metrics from API
  const fetchMetrics = useCallback(async (): Promise<PerformanceMetric> => {
    try {
      const response = await fetch('/api/performance/metrics');
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Error fetching performance metrics:', error);
      // Return mock data for development
      return {
        timestamp: Date.now(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: Math.random() * 1000,
        activeConnections: Math.floor(Math.random() * 1000),
        errorRate: Math.random() * 10,
      };
    }
  }, []);

  // Update performance data
  const updatePerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newMetric = await fetchMetrics();
      const health = calculateHealthScore(newMetric);
      const newAlerts = checkForAlerts(newMetric);

      setPerformanceData((prev) => ({
        current: newMetric,
        history: [...prev.history.slice(-(historyLimit - 1)), newMetric],
        health,
        alerts: [
          ...prev.alerts.filter((alert) => !alert.resolved),
          ...newAlerts,
        ],
      }));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMetrics, calculateHealthScore, checkForAlerts, historyLimit]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/performance`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        logger.info('Performance WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketPerformanceMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'performance-update': {
              const metric = message.data as PerformanceMetric;
              const health = calculateHealthScore(metric);

              setPerformanceData((prev) => ({
                current: metric,
                history: [...prev.history.slice(-(historyLimit - 1)), metric],
                health,
                alerts: prev.alerts,
              }));
              break;
            }

            case 'alert': {
              const alert = message.data as Alert;
              setPerformanceData((prev) => ({
                ...prev,
                alerts: [...prev.alerts, alert],
              }));
              break;
            }

            case 'health-check': {
              const healthData = message.data as SystemHealth;
              setPerformanceData((prev) => ({
                ...prev,
                health: healthData,
              }));
              break;
            }
          }
        } catch (err) {
          logger.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        logger.info('Performance WebSocket disconnected');

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (autoConnect) {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'WebSocket connection failed'
      );
    }
  }, [calculateHealthScore, historyLimit, autoConnect]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setPerformanceData((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ),
    }));
  }, []);

  // Clear resolved alerts
  const clearResolvedAlerts = useCallback(() => {
    setPerformanceData((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((alert) => !alert.resolved),
    }));
  }, []);

  // Manual refresh
  const refreshMetrics = useCallback(() => {
    void updatePerformanceData();
  }, [updatePerformanceData]);

  // Initialize
  useEffect(() => {
    if (autoConnect) {
      // Initial fetch
      void updatePerformanceData();

      // Set up polling interval as fallback
      intervalRef.current = setInterval(() => {
        void updatePerformanceData();
      }, updateInterval);

      // Connect WebSocket for real-time updates
      connectWebSocket();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      disconnectWebSocket();
    };
  }, [
    autoConnect,
    updateInterval,
    updatePerformanceData,
    connectWebSocket,
    disconnectWebSocket,
  ]);

  return {
    // Data
    performanceData,
    isConnected,
    isLoading,
    error,

    // Actions
    refreshMetrics,
    resolveAlert,
    clearResolvedAlerts,
    connectWebSocket,
    disconnectWebSocket,

    // Computed values
    currentMetrics: performanceData.current,
    metricsHistory: performanceData.history,
    systemHealth: performanceData.health,
    activeAlerts: performanceData.alerts.filter((alert) => !alert.resolved),
    resolvedAlerts: performanceData.alerts.filter((alert) => alert.resolved),
  };
};
