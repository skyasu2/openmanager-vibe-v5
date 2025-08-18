/**
 * 🔒 중앙화된 Zod 스키마 모음
 *
 * 모든 Zod 스키마를 중앙에서 관리하여 재사용성과 일관성 향상
 */

// Common schemas
export * from './common.schema';

// Server schemas (분할된 스키마)
export * from './server-schemas';

// Auth schemas
export * from './auth.schema';

// Monitoring schemas
export * from './monitoring.schema';

// Utils schemas
export * from './utils.schema';

// AI schemas (중복 방지를 위해 선택적 export)
export * from './ai-schemas/ai-performance.schema';

// API schemas - 중복 방지를 위해 필요한 것만 선택적 export
export {
  // Health Check
  HealthCheckServiceSchema,
  HealthCheckResponseSchema,

  // MCP
  MCPQueryRequestSchema,
  MCPQueryResponseSchema,

  // Basic Server Types (missing aliases)
  ServerStatusSchema as ServerSchema,
  NetworkMetricsSchema as NetworkInfoSchema,

  // Dashboard
  DashboardStatsSchema,
  DashboardDataSchema,
  DashboardResponseSchema,

  // Cache
  CacheStatsSchema,
  CachePerformanceSchema,

  // Error Reporting
  ErrorReportSchema,
  ErrorReportRequestSchema,

  // System Optimization
  SystemOptimizeRequestSchema,
  SystemOptimizeResponseSchema,

  // Types
  type HealthCheckResponse,
  type MCPQueryRequest,
  type MCPQueryResponse,
  type DashboardStats,
  type DashboardData,
  type DashboardResponse,
  type CacheStats,
  type CachePerformance,
  type ErrorReport,
  type ErrorReportRequest,
  type SystemOptimizeRequest,
  type SystemOptimizeResponse,
} from './api.schema';
