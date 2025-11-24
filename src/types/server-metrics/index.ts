/**
 * 🛡️ Server Metrics Type Definitions
 *
 * @deprecated This file is deprecated. Use '@/types/server-metrics' instead.
 * All types have been consolidated into the main server-metrics.ts file.
 *
 * This file will be removed in a future version.
 */

// Re-export from the unified location
export type {
  RawServerData,
  ServerEventResult,
  BatchServerInfo,
  BatchMetricsResult,
  PerformanceStats,
  ServerMetrics,
  HourlyServerData,
  ServerTypeProfile,
  FileCache,
} from '../server-metrics';
