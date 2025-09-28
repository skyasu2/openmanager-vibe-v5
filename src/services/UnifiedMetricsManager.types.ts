/**
 * 🎯 Unified Metrics Manager Types & Interfaces
 *
 * Complete type definitions for the unified metrics system:
 * - Server environment and role types
 * - Unified server metrics interface
 * - System configuration interfaces
 * - Performance and AI analysis types
 */

// Server environment type
export type ServerEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'fallback'
  | 'error';

// Server role type
export type ServerRole =
  | 'web'
  | 'api'
  | 'database'
  | 'cache'
  | 'worker'
  | 'fallback'
  | 'error';

// Server status type
export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'unknown'; // 🔧 수정: 'offline' → 'unknown' (다른 파일과 일관성)

// Unified server metrics interface (Prometheus standard)
export interface UnifiedServerMetrics {
  // Server basic information
  id: string;
  name: string;
  hostname: string;
  environment: ServerEnvironment;
  role: ServerRole;
  status: ServerStatus;

  // Prometheus standard metrics
  node_cpu_usage_percent: number;
  node_memory_usage_percent: number;
  node_disk_usage_percent: number;
  node_network_receive_rate_mbps: number;
  node_network_transmit_rate_mbps: number;
  node_uptime_seconds: number;

  // Application metrics
  http_request_duration_seconds: number;
  http_requests_total: number;
  http_requests_errors_total: number;

  // Metadata
  timestamp: number;
  labels: Record<string, string>;

  // AI analysis results (optional)
  ai_analysis?: {
    prediction_score: number;
    anomaly_score: number;
    recommendation: string;
  };
}

// System configuration interface
export interface UnifiedMetricsConfig {
  // Metrics generation settings
  generation: {
    enabled: boolean;
    interval_seconds: number;
    realistic_patterns: boolean;
    failure_scenarios: boolean;
  };

  // AI analysis settings
  ai_analysis: {
    enabled: boolean;
    interval_seconds: number;
    python_engine_preferred: boolean;
    fallback_to_typescript: boolean;
  };

  // Auto scaling simulation
  autoscaling: {
    enabled: boolean;
    min_servers: number;
    max_servers: number;
    target_cpu_percent: number;
    scale_interval_seconds: number;
  };

  // Performance optimization
  performance: {
    memory_optimization: boolean;
    batch_processing: boolean;
    cache_enabled: boolean;
    parallel_processing: boolean;
  };
}

// Performance metrics tracking
export interface MetricsPerformanceData {
  total_updates: number;
  last_update: number;
  avg_processing_time: number;
  errors_count: number;
  ai_analysis_count: number;
  scaling_decisions: number;
}

// AI analysis result interface
export interface AIAnalysisResult {
  analysis: string;
  server_count: number;
  avg_cpu: string;
  avg_memory: string;
  critical_servers: number;
  health_score: string;
  timestamp: string;
}

// Server configuration for initialization
export interface ServerInitConfig {
  environment: ServerEnvironment;
  role: ServerRole;
  count: number;
}

// Architecture type for server initialization
export type ArchitectureType = 'minimal' | 'standard' | 'enterprise';

// Role multipliers for realistic metrics generation
export interface RoleMultipliers {
  database: number;
  api: number;
  web: number;
  cache: number;
  worker: number;
  [key: string]: number;
}

// Export commonly used constants
export const DEFAULT_METRICS_CONFIG: UnifiedMetricsConfig = {
  generation: {
    enabled: true,
    interval_seconds: 15,
    realistic_patterns: true,
    failure_scenarios: true,
  },
  ai_analysis: {
    enabled: true,
    interval_seconds: 300,
    python_engine_preferred: false,
    fallback_to_typescript: true,
  },
  autoscaling: {
    enabled: true,
    min_servers: 3,
    max_servers: 20,
    target_cpu_percent: 70,
    scale_interval_seconds: 60,
  },
  performance: {
    memory_optimization: true,
    batch_processing: true,
    cache_enabled: true,
    parallel_processing: true,
  },
};

export const ROLE_MULTIPLIERS: RoleMultipliers = {
  database: 1.3, // DB servers have higher load
  api: 1.1, // API servers also slightly higher
  web: 1.0, // Web servers baseline
  cache: 0.8, // Cache servers optimized
  worker: 1.2, // Worker servers variable load
};

export const DUPLICATE_TIMER_IDS = [
  'simulation-engine-update',
  'optimized-data-generator',
  'data-flow-generation',
  'data-flow-ai-analysis',
  'data-flow-autoscaling',
  'data-flow-performance',
  'server-dashboard-refresh',
  'websocket-data-generation',
  'smart-cache-cleanup',
  'memory-optimizer',
  'performance-monitor',
] as const;
