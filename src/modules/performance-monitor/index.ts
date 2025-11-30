/**
 * Performance Monitor Module
 * Agentic coding development - independent module for parallel development
 */

// Components
export { default as PerformanceMonitor } from './components/PerformanceMonitor';

// Hooks
export { usePerformanceMetrics } from './hooks/usePerformanceMetrics';

// Services
export { PerformanceService } from './services/PerformanceService';

// Types
export type {
  Alert,
  AlertConfig,
  ChartConfig,
  ChartDataPoint,
  PerformanceData,
  PerformanceMetric,
  SystemHealth,
  WebSocketPerformanceMessage,
} from './types/performance';

// Utilities
export const formatMetricValue = (
  value: number,
  unit: string,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}${unit}`;
};

export const getHealthStatusColor = (status: string): string => {
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

export const calculatePerformanceScore = (
  metrics: import('./types/performance').PerformanceMetric
): number => {
  const scores = [
    Math.max(0, 100 - metrics.cpu),
    Math.max(0, 100 - metrics.memory),
    Math.max(0, 100 - metrics.responseTime / 20),
    Math.max(0, 100 - metrics.errorRate * 10),
  ];

  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );
};
