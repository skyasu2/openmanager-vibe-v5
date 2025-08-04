import { z } from 'zod';
import {
    BaseResponseSchema,
    ErrorResponseSchema,
    HealthStatusSchema,
    IdSchema,
    PercentageSchema,
    TimestampSchema,
} from './common.schema';

/**
 * 📡 API 관련 Zod 스키마
 * 
 * API 요청/응답에 사용되는 스키마들
 */

// ===== 헬스체크 =====

export const HealthCheckServiceSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'error']),
  latency: z.number().optional(),
  lastCheck: TimestampSchema,
  details: z.string().optional(),
});

export const HealthCheckResponseSchema = z.object({
  status: HealthStatusSchema,
  services: z.record(HealthCheckServiceSchema),
  uptime: z.number(),
  version: z.string(),
  timestamp: TimestampSchema,
});

// ===== MCP (Model Context Protocol) =====

export const MCPQueryRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.record(z.string()).optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    stream: z.boolean().optional(),
  }).optional(),
});

export const MCPQueryResponseSchema = z.object({
  id: IdSchema,
  queryId: IdSchema,
  response: z.string(),
  relatedServers: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  timestamp: TimestampSchema,
  sources: z.array(z.string()),
  actionable: z.boolean(),
  metadata: z.object({
    model: z.string().optional(),
    processingTime: z.number().optional(),
    tokensUsed: z.number().optional(),
  }).optional(),
});

// ===== 서버 메트릭 =====

export const NetworkMetricsSchema = z.object({
  bytesIn: z.number().nonnegative(),
  bytesOut: z.number().nonnegative(),
  packetsIn: z.number().nonnegative(),
  packetsOut: z.number().nonnegative(),
  latency: z.number().nonnegative(),
  connections: z.number().nonnegative(),
  errors: z.number().nonnegative().optional(),
  dropped: z.number().nonnegative().optional(),
});

export const ServerMetricsSchema = z.object({
  cpu: PercentageSchema,
  memory: PercentageSchema,
  disk: PercentageSchema,
  network: NetworkMetricsSchema,
  processes: z.number().nonnegative(),
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
  temperature: z.number().optional(),
});

export const ServerStatusSchema = z.object({
  id: IdSchema,
  name: z.string(),
  status: z.enum(['online', 'offline', 'warning', 'error', 'maintenance']),
  lastUpdate: TimestampSchema,
  location: z.string(),
  uptime: z.number().nonnegative(),
  metrics: ServerMetricsSchema,
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ===== 알림 =====

export const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const AlertSchema = z.object({
  id: IdSchema,
  serverId: IdSchema,
  severity: AlertSeveritySchema,
  type: z.string(),
  message: z.string(),
  timestamp: TimestampSchema,
  resolved: z.boolean(),
  resolvedAt: TimestampSchema.optional(),
  resolvedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ===== 대시보드 =====

export const SystemOverviewSchema = z.object({
  totalServers: z.number().nonnegative(),
  onlineServers: z.number().nonnegative(),
  criticalAlerts: z.number().nonnegative(),
  averageResponseTime: z.number().nonnegative(),
  systemHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  lastUpdated: TimestampSchema,
});

export const DashboardOverviewDataSchema = z.object({
  servers: z.array(ServerStatusSchema),
  alerts: z.array(AlertSchema),
  systemOverview: SystemOverviewSchema,
  timestamp: TimestampSchema,
});

// ===== API 응답 래퍼 =====

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
    metadata: z.record(z.string()).optional(),
  });

export const ApiErrorResponseSchema = ErrorResponseSchema.extend({
  statusCode: z.number().optional(),
  path: z.string().optional(),
  method: z.string().optional(),
});

// ===== 배치 작업 =====

export const BatchRequestSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema).min(1).max(100),
    options: z.object({
      parallel: z.boolean().default(false),
      continueOnError: z.boolean().default(false),
      timeout: z.number().positive().optional(),
    }).optional(),
  });

export const BatchResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.array(itemSchema),
    failed: z.array(z.object({
      item: z.unknown(),
      error: z.string(),
      index: z.number(),
    })),
    total: z.number(),
    successCount: z.number(),
    failedCount: z.number(),
  });

// ===== 캐시 통계 =====

export const CacheStatsSchema = z.object({
  hits: z.number().nonnegative(),
  misses: z.number().nonnegative(),
  errors: z.number().nonnegative(),
  commands: z.number().nonnegative(),
  memoryUsage: z.number().nonnegative(),
  storeSize: z.number().nonnegative(),
  hitRate: z.number().min(0).max(100),
  commandsPerSecond: z.number().nonnegative(),
  memoryUsageMB: z.number().nonnegative(),
});

export const CachePerformanceSchema = z.object({
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  hitRate: z.number().min(0).max(100),
  errorRate: z.string(),
  issues: z.array(z.string()),
  totalOperations: z.number().nonnegative(),
  recommendations: z.array(z.string()),
});

export const RedisInfoSchema = z.object({
  connected: z.boolean(),
  memory: z.string(),
  keys: z.number(),
  hits: z.number(),
  misses: z.number(),
  hitRate: z.number(),
  evictions: z.number(),
  connections: z.number(),
  commandsProcessed: z.number(),
  keyspaceHits: z.number(),
  keyspaceMisses: z.number(),
  usedMemoryPeak: z.string(),
  totalSystemMemory: z.string(),
  maxMemory: z.string(),
  maxMemoryPolicy: z.string(),
  role: z.string(),
  connectedSlaves: z.number(),
  masterReplOffset: z.number(),
  secondReplOffset: z.number(),
  replBacklogActive: z.number(),
  replBacklogSize: z.number(),
  replBacklogFirstByteOffset: z.number(),
  replBacklogHistlen: z.number(),
});

export const MemoryUsageSchema = z.object({
  estimatedMB: z.number().nonnegative(),
  maxMB: z.number().nonnegative(),
  usagePercent: z.number().min(0).max(100),
});

export const CacheStatsResponseSchema = z.object({
  success: z.boolean(),
  timestamp: TimestampSchema,
  stats: z.object({
    hits: z.number().nonnegative(),
    misses: z.number().nonnegative(),
    errors: z.number().nonnegative(),
    commands: z.number().nonnegative(),
    memoryUsage: z.number().nonnegative(),
    storeSize: z.number().nonnegative(),
    hitRate: z.number().min(0).max(100),
    commandsPerSecond: z.number().nonnegative(),
    memoryUsageMB: z.number().nonnegative(),
    performance: CachePerformanceSchema,
  }),
  redis: RedisInfoSchema,
  memory: MemoryUsageSchema,
});

// ===== 타입 내보내기 =====
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
export type MCPQueryRequest = z.infer<typeof MCPQueryRequestSchema>;
export type MCPQueryResponse = z.infer<typeof MCPQueryResponseSchema>;
export type ServerMetrics = z.infer<typeof ServerMetricsSchema>;
export type ServerStatus = z.infer<typeof ServerStatusSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type DashboardOverviewData = z.infer<typeof DashboardOverviewDataSchema>;
export type BatchRequest<T> = {
  items: T[];
  options?: {
    parallel?: boolean;
    continueOnError?: boolean;
    timeout?: number;
  };
};
export type CacheStats = z.infer<typeof CacheStatsSchema>;
export type CachePerformance = z.infer<typeof CachePerformanceSchema>;
export type RedisInfo = z.infer<typeof RedisInfoSchema>;
export type MemoryUsage = z.infer<typeof MemoryUsageSchema>;
export type CacheStatsResponse = z.infer<typeof CacheStatsResponseSchema>;

// ===== Redis 통계 =====

export const RedisStatsSchema = z.object({
  unifiedMockRedis: z.object({
    hits: z.number().nonnegative(),
    misses: z.number().nonnegative(),
    sets: z.number().nonnegative(),
    deletes: z.number().nonnegative(),
    errors: z.number().nonnegative(),
    commands: z.number().nonnegative(),
    memoryUsage: z.number().nonnegative(),
    storeSize: z.number().nonnegative(),
    hitRate: z.number().min(0).max(100),
    commandsPerSecond: z.number().nonnegative(),
    memoryUsageMB: z.number().nonnegative(),
  }).nullable(),
  realRedis: z.object({
    status: z.enum(['connected', 'disconnected']),
  }),
  mockRedis: z.object({
    size: z.number().nonnegative(),
    hits: z.number().nonnegative(),
    misses: z.number().nonnegative(),
    sets: z.number().nonnegative(),
    errors: z.number().nonnegative(),
  }).optional(),
  strategy: z.string(),
});

export const UsageStatsSchema = z.object({
  redis: z.object({
    canUse: z.boolean(),
    commands: z.number().nonnegative(),
    lastReset: TimestampSchema,
  }),
  supabase: z.object({
    canUse: z.boolean(),
    requests: z.number().nonnegative(),
    transferMB: z.number().nonnegative(),
    lastReset: TimestampSchema,
  }),
});

export const PerformanceMetricsSchema = z.object({
  responseTime: z.number().nonnegative(),
  memoryUsage: z.object({
    rss: z.number().nonnegative(),
    heapTotal: z.number().nonnegative(),
    heapUsed: z.number().nonnegative(),
    external: z.number().nonnegative(),
    arrayBuffers: z.number().nonnegative(),
  }),
  uptime: z.number().nonnegative(),
  timestamp: TimestampSchema,
});

export const PerformanceTestSchema = z.object({
  mockRedis: z.object({
    get: z.number().nonnegative(),
    set: z.number().nonnegative(),
    ping: z.number().nonnegative(),
  }),
  realRedis: z.object({
    get: z.number().nonnegative(),
    set: z.number().nonnegative(),
    ping: z.number().nonnegative(),
  }),
});

export const RedisStatsResponseSchema = z.object({
  success: z.boolean(),
  systemHealth: z.string().optional(),
  _systemHealth: z.string(),
  hybridStats: RedisStatsSchema,
  usageStats: UsageStatsSchema,
  performance: PerformanceMetricsSchema,
  timestamp: TimestampSchema,
  version: z.string(),
  cached: z.boolean(),
  cacheAge: z.number().optional(),
});

export const RedisTestRequestSchema = z.object({
  action: z.enum(['test-hybrid', 'benchmark']),
  context: z.string().optional(),
  dataSize: z.number().positive().optional(),
});

export const HybridTestResultSchema = z.object({
  mockRedis: z.object({ success: z.boolean() }),
  realRedis: z.object({ success: z.boolean() }),
  context: z.string(),
  dataSize: z.number(),
});

export const BenchmarkResultSchema = z.object({
  iterations: z.number().positive(),
  results: z.object({
    mock: z.object({
      total: z.number().nonnegative(),
      average: z.number().nonnegative(),
      operations: z.array(z.number().nonnegative()),
    }),
    real: z.object({
      total: z.number().nonnegative(),
      average: z.number().nonnegative(),
      operations: z.array(z.number().nonnegative()),
    }),
  }),
  comparison: z.object({
    mockFaster: z.boolean(),
    speedDifference: z.string(),
  }),
});

export type RedisStats = z.infer<typeof RedisStatsSchema>;
export type UsageStats = z.infer<typeof UsageStatsSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type PerformanceTest = z.infer<typeof PerformanceTestSchema>;
export type RedisStatsResponse = z.infer<typeof RedisStatsResponseSchema>;
export type RedisTestRequest = z.infer<typeof RedisTestRequestSchema>;
export type HybridTestResult = z.infer<typeof HybridTestResultSchema>;
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

// ===== 에러 리포트 =====

export const ErrorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const ErrorReportSchema = z.object({
  id: IdSchema,
  timestamp: TimestampSchema,
  severity: ErrorSeveritySchema,
  type: z.string(),
  message: z.string(),
  source: z.string(),
  stackTrace: z.string().optional(),
  metadata: z.record(z.unknown()),
  resolved: z.boolean(),
});

export const ErrorReportRequestSchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
  severity: ErrorSeveritySchema.optional(),
  source: z.string().optional(),
  stackTrace: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ErrorReportQuerySchema = z.object({
  severity: ErrorSeveritySchema.optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  resolved: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().default(20),
  page: z.coerce.number().default(1),
});

export const ErrorReportListResponseSchema = z.object({
  reports: z.array(ErrorReportSchema),
  pagination: z.object({
    page: z.number().positive(),
    limit: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
  timestamp: TimestampSchema,
});

export const ErrorReportCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  report: ErrorReportSchema,
  timestamp: TimestampSchema,
});

export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;
export type ErrorReport = z.infer<typeof ErrorReportSchema>;
export type ErrorReportRequest = z.infer<typeof ErrorReportRequestSchema>;
export type ErrorReportQuery = z.infer<typeof ErrorReportQuerySchema>;
export type ErrorReportListResponse = z.infer<typeof ErrorReportListResponseSchema>;
export type ErrorReportCreateResponse = z.infer<typeof ErrorReportCreateResponseSchema>;

// ===== 인증 테스트 =====

export const AuthTestResultSchema = z.object({
  timestamp: TimestampSchema,
  supabase: z.object({
    url: z.string(),
    connection: z.boolean(),
    connectionError: z.string().nullable(),
  }),
  auth: z.object({
    configured: z.boolean(),
    error: z.string().nullable(),
    session: z.boolean(),
  }),
  githubOAuth: z.object({
    urlGenerated: z.boolean(),
    error: z.string().nullable(),
    redirectUrl: z.string().nullable(),
  }),
  environment: z.object({
    nodeEnv: z.string().optional(),
    vercel: z.boolean(),
    domain: z.string(),
  }),
});

export const AuthTestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AuthTestResultSchema,
  recommendations: z.array(z.string()),
});

export const AuthDiagnosticsRequestSchema = z.object({
  testType: z.enum(['full', 'oauth', 'auth']).default('full'),
});

export const AuthDiagnosticsSchema = z.object({
  timestamp: TimestampSchema,
  testType: z.enum(['full', 'oauth', 'auth']),
  github: z.object({
    success: z.boolean(),
    url: z.string().optional(),
    error: z.string().optional(),
    provider: z.string().optional(),
    urlAnalysis: z.object({
      domain: z.string(),
      hasClientId: z.boolean(),
      hasRedirectUri: z.boolean(),
      hasScopes: z.boolean(),
      redirectUri: z.string().nullable(),
      scopes: z.string().nullable(),
      state: z.string().nullable(),
    }).optional(),
  }).optional(),
  authSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    canAccessAuthTable: z.boolean(),
  }).optional(),
});

export const AuthDiagnosticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  diagnostics: AuthDiagnosticsSchema,
});

export type AuthTestResult = z.infer<typeof AuthTestResultSchema>;
export type AuthTestResponse = z.infer<typeof AuthTestResponseSchema>;
export type AuthDiagnosticsRequest = z.infer<typeof AuthDiagnosticsRequestSchema>;
export type AuthDiagnostics = z.infer<typeof AuthDiagnosticsSchema>;
export type AuthDiagnosticsResponse = z.infer<typeof AuthDiagnosticsResponseSchema>;

// ===== 대시보드 =====

export const DashboardStatsSchema = z.object({
  total: z.number().nonnegative(),
  healthy: z.number().nonnegative(),
  warning: z.number().nonnegative(),
  critical: z.number().nonnegative(),
  avgCpu: z.number().min(0).max(100),
  avgMemory: z.number().min(0).max(100),
  avgDisk: z.number().min(0).max(100),
});

export const DashboardServerSchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: z.string(),
  status: z.enum(['healthy', 'warning', 'critical']),
  cpu: z.object({
    usage: z.number().min(0).max(100),
    cores: z.number().positive(),
  }),
  memory: z.object({
    usage: z.number().min(0).max(100),
    total: z.number().positive(),
  }),
  disk: z.object({
    usage: z.number().min(0).max(100),
    total: z.number().positive(),
  }),
  network: z.object({
    rx: z.number().nonnegative(),
    tx: z.number().nonnegative(),
  }),
  location: z.string().optional(),
  environment: z.string().optional(),
  uptime: z.number().nonnegative().optional(),
  lastUpdate: TimestampSchema.optional(),
  tags: z.array(z.string()).optional(),
  metrics: ServerMetricsSchema.optional(),
});

export const DashboardDataSchema = z.object({
  servers: z.record(DashboardServerSchema),
  stats: DashboardStatsSchema,
  lastUpdate: TimestampSchema,
  dataSource: z.string(),
});

export const DashboardResponseSchema = z.object({
  success: z.boolean(),
  data: DashboardDataSchema,
  metadata: z.object({
    responseTime: z.number().nonnegative(),
    serversLoaded: z.number().nonnegative(),
    scenarioActive: z.boolean().optional(),
  }).optional(),
});

export const DashboardActionRequestSchema = z.object({
  action: z.string().optional(),
});

export const DashboardActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  action: z.string().optional(),
  timestamp: TimestampSchema.optional(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardServer = z.infer<typeof DashboardServerSchema>;
export type DashboardData = z.infer<typeof DashboardDataSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardActionRequest = z.infer<typeof DashboardActionRequestSchema>;
export type DashboardActionResponse = z.infer<typeof DashboardActionResponseSchema>;

// ===== 캐시 최적화 =====

export const CacheOptimizeActionSchema = z.enum(['warmup', 'invalidate', 'optimize', 'reset-stats']);

export const CacheOptimizeRequestSchema = z.object({
  action: CacheOptimizeActionSchema,
  options: z.object({
    targets: z.array(z.string()).optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export const CacheWarmupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  items: z.array(z.string()),
});

export const CacheInvalidateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const CacheOptimizeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  optimizations: z.array(z.string()),
  newStats: CacheStatsSchema,
});

export const CacheResetStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newStats: CacheStatsSchema,
});

export const ServerMetricsDetailSchema = z.object({
  cpu: z.object({
    usage: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type CacheOptimizeAction = z.infer<typeof CacheOptimizeActionSchema>;
export type CacheOptimizeRequest = z.infer<typeof CacheOptimizeRequestSchema>;
export type CacheWarmupResponse = z.infer<typeof CacheWarmupResponseSchema>;
export type CacheInvalidateResponse = z.infer<typeof CacheInvalidateResponseSchema>;
export type CacheOptimizeResponse = z.infer<typeof CacheOptimizeResponseSchema>;
export type CacheResetStatsResponse = z.infer<typeof CacheResetStatsResponseSchema>;
export type ServerMetricsDetail = z.infer<typeof ServerMetricsDetailSchema>;

// ===== 시스템 최적화 =====

export const SystemOptimizeLevelSchema = z.enum(['normal', 'aggressive']);

export const SystemOptimizeRequestSchema = z.object({
  level: SystemOptimizeLevelSchema.default('normal'),
});

export const MemoryStatsSchema = z.object({
  heapUsed: z.number().nonnegative(),
  heapTotal: z.number().nonnegative(),
  rss: z.number().nonnegative(),
  external: z.number().nonnegative(),
  usagePercent: z.number().min(0).max(100),
  timestamp: z.number().positive(),
});

export const OptimizationResultSchema = z.object({
  success: z.boolean(),
  before: MemoryStatsSchema,
  after: MemoryStatsSchema,
  freedMB: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  optimizationActions: z.array(z.string()),
});

export const MemoryStatusSchema = z.enum(['optimal', 'good', 'acceptable', 'warning', 'critical']);

export const MemorySummarySchema = z.object({
  status: MemoryStatusSchema,
  current: MemoryStatsSchema,
  lastOptimization: z.string().nullable(),
  totalOptimizations: z.number().nonnegative(),
});

export const SystemOptimizeResponseSchema = z.object({
  optimization: z.object({
    success: z.boolean(),
    level: z.string(),
    duration: z.number(),
    actions: z.array(z.string()),
    targetAchieved: z.boolean(),
    optimalAchieved: z.boolean(),
    memory: z.object({
      before: z.object({
        usagePercent: z.number(),
        heapUsed: z.number(),
        heapTotal: z.number(),
        rss: z.number(),
      }),
      after: z.object({
        usagePercent: z.number(),
        heapUsed: z.number(),
        heapTotal: z.number(),
        rss: z.number(),
      }),
      improvement: z.object({
        freedMB: z.number(),
        percentageReduction: z.number(),
        status: z.enum(['optimal', 'good', 'acceptable', 'critical']),
      }),
    }),
  }),
  monitoring: z.object({
    enabled: z.boolean(),
    interval: z.string(),
    threshold: z.object({
      target: z.string(),
      warning: z.string(),
      critical: z.string(),
    }),
  }),
  recommendations: z.array(z.string()),
  apiMetrics: z.object({
    responseTime: z.number(),
    timestamp: TimestampSchema,
  }),
});

export const MemoryHistoryItemSchema = z.object({
  timestamp: TimestampSchema,
  improvement: z.object({
    before: z.string(),
    after: z.string(),
    freedMB: z.number(),
  }),
  duration: z.number(),
  actions: z.array(z.string()),
});

export const MemoryStatusResponseSchema = z.object({
  status: MemoryStatusSchema,
  current: MemoryStatsSchema,
  monitoring: z.object({
    enabled: z.boolean(),
    lastOptimization: z.string().nullable(),
    totalOptimizations: z.number(),
  }),
  history: z.array(MemoryHistoryItemSchema),
  recommendations: z.array(z.string()),
});

export type SystemOptimizeLevel = z.infer<typeof SystemOptimizeLevelSchema>;
export type SystemOptimizeRequest = z.infer<typeof SystemOptimizeRequestSchema>;
export type MemoryStats = z.infer<typeof MemoryStatsSchema>;
export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;
export type MemoryStatus = z.infer<typeof MemoryStatusSchema>;
export type MemorySummary = z.infer<typeof MemorySummarySchema>;
export type SystemOptimizeResponse = z.infer<typeof SystemOptimizeResponseSchema>;
export type MemoryHistoryItem = z.infer<typeof MemoryHistoryItemSchema>;
export type MemoryStatusResponse = z.infer<typeof MemoryStatusResponseSchema>;

// ===== 캐시된 서버 API =====

export const ServerStatusLiteralSchema = z.enum(['online', 'offline', 'warning', 'healthy', 'critical']);

export const ServerAlertSchema = z.object({
  id: z.string(),
  server_id: z.string(),
  type: z.string(),
  message: z.string(),
  severity: AlertSeveritySchema,
  timestamp: z.string(),
  resolved: z.boolean(),
});

export const CachedServerSummarySchema = z.object({
  stats: z.object({
    total: z.number().nonnegative(),
    online: z.number().nonnegative(),
    warning: z.number().nonnegative(),
    critical: z.number().nonnegative(),
    offline: z.number().nonnegative(),
  }),
  metrics: z.object({
    avgCpuUsage: z.number().min(0).max(100),
    avgMemoryUsage: z.number().min(0).max(100),
    avgDiskUsage: z.number().min(0).max(100),
    totalBandwidth: z.number().nonnegative(),
  }),
  health: z.object({
    score: z.number().min(0).max(100),
    trend: z.string(),
    issues: z.number().nonnegative(),
  }),
  timestamp: z.number().positive(),
});

export const CachedServersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()), // EnhancedServerMetrics type is complex, using any for now
  count: z.number().nonnegative(),
  summary: CachedServerSummarySchema.nullable(),
  timestamp: z.number().positive(),
  cached: z.boolean(),
  optimized: z.boolean(),
  serverless: z.boolean(),
  dataSource: z.string(),
  metadata: z.object({
    cacheStrategy: z.string(),
    ttl: z.number().positive(),
  }).optional(),
});

export type ServerStatusLiteral = z.infer<typeof ServerStatusLiteralSchema>;
export type ServerAlert = z.infer<typeof ServerAlertSchema>;
export type CachedServerSummary = z.infer<typeof CachedServerSummarySchema>;
export type CachedServersResponse = z.infer<typeof CachedServersResponseSchema>;

// ===== 브라우저 알림 API =====

export const NotificationPermissionSchema = z.enum(['default', 'granted', 'denied']);

export const NotificationStatusSchema = z.object({
  supported: z.boolean(),
  permission: NotificationPermissionSchema,
  enabled: z.boolean(),
});

export const NotificationActionSchema = z.enum(['test', 'validate', 'clear-history', 'update-settings']);

export const TestNotificationDataSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  silent: z.boolean().optional(),
});

export const ValidateNotificationDataSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }).optional(),
  }).optional(),
  permission: NotificationPermissionSchema.optional(),
});

export const UpdateNotificationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  silent: z.boolean().optional(),
  frequency: z.enum(['instant', 'hourly', 'daily']).optional(),
  categories: z.array(z.string()).optional(),
});

export const NotificationRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('test'),
    title: z.string().optional(),
    body: z.string().optional(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    tag: z.string().optional(),
    silent: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('validate'),
    subscription: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }).optional(),
    }).optional(),
    permission: NotificationPermissionSchema.optional(),
  }),
  z.object({
    action: z.literal('clear-history'),
  }),
  z.object({
    action: z.literal('update-settings'),
    enabled: z.boolean().optional(),
    silent: z.boolean().optional(),
    frequency: z.enum(['instant', 'hourly', 'daily']).optional(),
    categories: z.array(z.string()).optional(),
  }),
]);

export const NotificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  valid: z.boolean().optional(),
});

export const NotificationStatusResponseSchema = z.object({
  success: z.boolean(),
  data: NotificationStatusSchema,
});

export type NotificationPermission = z.infer<typeof NotificationPermissionSchema>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export type NotificationAction = z.infer<typeof NotificationActionSchema>;
export type TestNotificationData = z.infer<typeof TestNotificationDataSchema>;
export type ValidateNotificationData = z.infer<typeof ValidateNotificationDataSchema>;
export type UpdateNotificationSettings = z.infer<typeof UpdateNotificationSettingsSchema>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationStatusResponse = z.infer<typeof NotificationStatusResponseSchema>;

// ===== 서버 페이지네이션 API =====

export const ServerPaginationQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.string().default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['healthy', 'warning', 'critical']).optional(),
});

export const PaginatedServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['healthy', 'warning', 'critical']),
  type: z.string(),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  network: z.number().min(0).max(100),
  uptime: z.string(),
  lastUpdate: z.string(),
  location: z.string(),
  environment: z.string(),
});

export const ServerPaginationSchema = z.object({
  currentPage: z.number().positive(),
  totalPages: z.number().nonnegative(),
  totalItems: z.number().nonnegative(),
  itemsPerPage: z.number().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  nextPage: z.number().positive().nullable(),
  prevPage: z.number().positive().nullable(),
});

export const ServerSummarySchema = z.object({
  total: z.number().nonnegative(),
  healthy: z.number().nonnegative(),
  warning: z.number().nonnegative(),
  critical: z.number().nonnegative(),
});

export const ServerPaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    servers: z.array(PaginatedServerSchema),
    pagination: ServerPaginationSchema,
    filters: z.object({
      status: z.enum(['healthy', 'warning', 'critical']).nullable(),
      sortBy: z.string(),
      order: z.enum(['asc', 'desc']),
    }),
    summary: ServerSummarySchema,
  }),
  timestamp: z.string(),
});

export const ServerBatchActionSchema = z.enum(['batch-restart', 'batch-update', 'batch-configure', 'health-check']);

export const ServerBatchRequestSchema = z.object({
  action: ServerBatchActionSchema,
  serverIds: z.array(z.string()).min(1),
  settings: z.record(z.unknown()).optional(),
});

export const ServerBatchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  serverIds: z.array(z.string()).optional(),
  estimatedDuration: z.number().optional(),
  timestamp: z.string(),
  settings: z.record(z.unknown()).optional(),
  results: z.array(z.object({
    serverId: z.string(),
    status: z.enum(['healthy', 'warning', 'critical']),
    responseTime: z.number(),
    lastCheck: z.string(),
  })).optional(),
});

export type ServerPaginationQuery = z.infer<typeof ServerPaginationQuerySchema>;
export type PaginatedServer = z.infer<typeof PaginatedServerSchema>;
export type ServerPagination = z.infer<typeof ServerPaginationSchema>;
export type ServerSummary = z.infer<typeof ServerSummarySchema>;
export type ServerPaginatedResponse = z.infer<typeof ServerPaginatedResponseSchema>;
export type ServerBatchAction = z.infer<typeof ServerBatchActionSchema>;
export type ServerBatchRequest = z.infer<typeof ServerBatchRequestSchema>;
export type ServerBatchResponse = z.infer<typeof ServerBatchResponseSchema>;

// ===== AI 로그 스트리밍 API =====

export const AILogLevelSchema = z.enum(['info', 'warn', 'error', 'debug']);

export const AILogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: AILogLevelSchema,
  source: z.string(),
  message: z.string(),
  metadata: z.object({
    engineId: z.string().optional(),
    processingTime: z.number().optional(),
    confidence: z.string().optional(),
    tokensUsed: z.number().optional(),
  }).optional(),
});

export const AILogActionSchema = z.enum(['write', 'clear', 'export']);

export const AILogWriteRequestSchema = z.object({
  action: z.literal('write'),
  logs: z.array(AILogEntrySchema.partial().extend({
    level: AILogLevelSchema,
    source: z.string(),
    message: z.string(),
  })),
});

export const AILogClearRequestSchema = z.object({
  action: z.literal('clear'),
});

export const AILogExportRequestSchema = z.object({
  action: z.literal('export'),
});

export const AILogRequestSchema = z.discriminatedUnion('action', [
  AILogWriteRequestSchema,
  AILogClearRequestSchema,
  AILogExportRequestSchema,
]);

export const AILogWriteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
});

export const AILogExportResponseSchema = z.object({
  success: z.boolean(),
  logs: z.array(AILogEntrySchema),
  count: z.number(),
  timestamp: z.string(),
});

export const AILogResponseSchema = z.union([
  AILogWriteResponseSchema,
  AILogExportResponseSchema,
]);

export const AILogStatsSchema = z.object({
  totalLogs: z.number(),
  errorRate: z.number(),
  avgProcessingTime: z.number(),
  activeEngines: z.array(z.string()),
});

export const AILogStreamMessageSchema = z.object({
  type: z.enum(['logs', 'stats', 'error']),
  data: z.union([
    z.array(AILogEntrySchema),
    AILogStatsSchema,
  ]).optional(),
  message: z.string().optional(),
  timestamp: z.string(),
  count: z.number().optional(),
  filters: z.object({
    level: z.string(),
    source: z.string(),
  }).optional(),
});

export type AILogLevel = z.infer<typeof AILogLevelSchema>;
export type AILogEntry = z.infer<typeof AILogEntrySchema>;
export type AILogAction = z.infer<typeof AILogActionSchema>;
export type AILogRequest = z.infer<typeof AILogRequestSchema>;
export type AILogWriteResponse = z.infer<typeof AILogWriteResponseSchema>;
export type AILogExportResponse = z.infer<typeof AILogExportResponseSchema>;
export type AILogResponse = z.infer<typeof AILogResponseSchema>;
export type AILogStats = z.infer<typeof AILogStatsSchema>;
export type AILogStreamMessage = z.infer<typeof AILogStreamMessageSchema>;

// ===== AI 성능 모니터링 API =====

export const AIPerformanceMetricsSchema = z.object({
  totalQueries: z.number().nonnegative(),
  avgResponseTime: z.number().nonnegative(),
  cacheHitRate: z.number().min(0).max(1),
  errorRate: z.number().min(0).max(1),
  parallelEfficiency: z.number().min(0).max(1),
  optimizationsSaved: z.number().nonnegative(),
});

export const AIOptimizationStatusSchema = z.object({
  warmupCompleted: z.boolean(),
  preloadedEmbeddings: z.number().nonnegative(),
  circuitBreakers: z.number().nonnegative(),
  cacheHitRate: z.number().min(0).max(1),
});

export const AIEngineHealthSchema = z.object({
  id: z.string(),
  status: z.enum(['healthy', 'degraded', 'unavailable']),
  responseTime: z.number().optional(),
  lastCheck: z.string().optional(),
});

export const AIPerformanceStatsResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  service: z.string(),
  metrics: z.object({
    totalQueries: z.number(),
    avgResponseTime: z.number(),
    cacheHitRate: z.number(),
    errorRate: z.number(),
    parallelEfficiency: z.number(),
    optimizationsSaved: z.number(),
  }),
  optimization: z.object({
    warmupCompleted: z.boolean(),
    preloadedEmbeddings: z.number(),
    circuitBreakers: z.number(),
    cacheHitRate: z.number(),
  }),
  health: z.object({
    status: z.enum(['healthy', 'degraded', 'unavailable']),
    engines: z.array(AIEngineHealthSchema),
  }),
  analysis: z.object({
    performanceGrade: z.string(),
    bottlenecks: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export const AIBenchmarkRequestSchema = z.object({
  mode: z.enum(['comparison', 'load']).default('comparison'),
  queries: z.array(z.string()).default(['서버 상태', 'CPU 사용률', '메모리 상태']),
  iterations: z.number().positive().default(3),
});

export const BenchmarkResponseItemSchema = z.object({
  query: z.string(),
  iteration: z.number(),
  responseTime: z.number(),
  success: z.boolean(),
  cached: z.boolean().optional(),
  error: z.string().optional(),
});

export const ComparisonBenchmarkResponseSchema = z.object({
  success: z.boolean(),
  benchmarkType: z.literal('comparison'),
  timestamp: z.string(),
  configuration: z.object({
    queries: z.number(),
    iterations: z.number(),
    totalQueries: z.number(),
  }),
  results: z.object({
    originalEngine: z.object({
      avgResponseTime: z.number(),
      totalTime: z.number(),
      successRate: z.number(),
      responses: z.array(BenchmarkResponseItemSchema),
    }),
    optimizedEngine: z.object({
      avgResponseTime: z.number(),
      totalTime: z.number(),
      successRate: z.number(),
      cacheHitRate: z.number(),
      responses: z.array(BenchmarkResponseItemSchema),
    }),
  }),
  analysis: z.object({
    improvementPercentage: z.number(),
    timeSaved: z.number(),
    performanceBetter: z.boolean(),
    cacheEffectiveness: z.enum(['high', 'medium', 'low']),
  }),
});

export const LoadBenchmarkResponseSchema = z.object({
  success: z.boolean(),
  benchmarkType: z.literal('load'),
  timestamp: z.string(),
  configuration: z.object({
    queries: z.number(),
    iterations: z.number(),
    concurrency: z.number(),
    totalQueries: z.number(),
  }),
  results: z.object({
    totalTime: z.number(),
    avgResponseTime: z.number(),
    successRate: z.number(),
    cacheHitRate: z.number(),
    throughput: z.number(),
    responses: z.array(BenchmarkResponseItemSchema),
  }),
  analysis: z.object({
    performanceGrade: z.enum(['excellent', 'good', 'fair', 'poor']),
    bottlenecks: z.array(z.string()),
    scalability: z.enum(['high', 'medium', 'low']),
  }),
});

export const CacheClearResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
});

// ===== Database Pool Management =====

export const DatabasePoolConfigSchema = z.object({
  maxConnections: z.number().min(1).max(100).default(20),
  minConnections: z.number().min(1).max(50).default(5),
  acquireTimeout: z.number().min(1000).max(60000).default(30000),
  idleTimeout: z.number().min(60000).max(600000).default(300000),
});

export const DatabasePoolResetRequestSchema = z.object({
  force: z.boolean().optional(),
  config: DatabasePoolConfigSchema.optional(),
});

export const DatabasePoolStatusSchema = z.object({
  total: z.number(),
  active: z.number(),
  idle: z.number(),
  waiting: z.number(),
});

export const DatabasePoolResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    action: z.literal('reset_pool'),
    timestamp: z.string(),
    previousPool: DatabasePoolStatusSchema,
    newPool: DatabasePoolStatusSchema,
    config: DatabasePoolConfigSchema,
    result: z.literal('success'),
  }),
  timestamp: z.string(),
});

export const DatabasePoolStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current: DatabasePoolStatusSchema,
    statistics: z.object({
      totalAcquired: z.number(),
      totalReleased: z.number(),
      totalCreated: z.number(),
      totalDestroyed: z.number(),
      averageAcquireTime: z.number(),
      maxAcquireTime: z.number(),
    }),
    health: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      lastReset: z.string(),
      nextScheduledReset: z.string().nullable(),
    }),
    config: DatabasePoolConfigSchema,
  }),
  timestamp: z.string(),
});

export type AIPerformanceMetrics = z.infer<typeof AIPerformanceMetricsSchema>;
export type AIOptimizationStatus = z.infer<typeof AIOptimizationStatusSchema>;
export type AIEngineHealth = z.infer<typeof AIEngineHealthSchema>;
export type AIPerformanceStatsResponse = z.infer<typeof AIPerformanceStatsResponseSchema>;
export type AIBenchmarkRequest = z.infer<typeof AIBenchmarkRequestSchema>;
export type BenchmarkResponseItem = z.infer<typeof BenchmarkResponseItemSchema>;
export type ComparisonBenchmarkResponse = z.infer<typeof ComparisonBenchmarkResponseSchema>;
export type LoadBenchmarkResponse = z.infer<typeof LoadBenchmarkResponseSchema>;
export type CacheClearResponse = z.infer<typeof CacheClearResponseSchema>;
export type DatabasePoolConfig = z.infer<typeof DatabasePoolConfigSchema>;
export type DatabasePoolResetRequest = z.infer<typeof DatabasePoolResetRequestSchema>;
export type DatabasePoolStatus = z.infer<typeof DatabasePoolStatusSchema>;
export type DatabasePoolResetResponse = z.infer<typeof DatabasePoolResetResponseSchema>;
export type DatabasePoolStatusResponse = z.infer<typeof DatabasePoolStatusResponseSchema>;

// ===== Server Details API =====

export const ServerServiceSchema = z.object({
  name: z.string(),
  status: z.enum(['running', 'stopped']),
  port: z.number(),
});

export const ServerSpecsSchema = z.object({
  cpu_cores: z.number(),
  memory_gb: z.number(),
  disk_gb: z.number(),
  os: z.string(),
});

export const ServerDetailQuerySchema = z.object({
  history: z.enum(['true', 'false']).optional(),
  range: z.string().optional().default('24h'),
  format: z.enum(['enhanced', 'legacy', 'prometheus']).optional().default('enhanced'),
  include_metrics: z.enum(['true', 'false']).optional(),
  include_patterns: z.enum(['true', 'false']).optional(),
});

export const ServerHistoryDataPointSchema = z.object({
  timestamp: z.string(),
  metrics: z.object({
    cpu_usage: z.number(),
    memory_usage: z.number(),
    disk_usage: z.number(),
    network_in: z.number(),
    network_out: z.number(),
    response_time: z.number(),
  }),
});

export const ServerHistorySchema = z.object({
  time_range: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  interval_ms: z.number(),
  data_points: z.array(ServerHistoryDataPointSchema),
});

export const LegacyServerResponseSchema = z.object({
  success: z.boolean(),
  server: z.object({
    id: z.string(),
    hostname: z.string(),
    name: z.string(),
    type: z.string(),
    environment: z.string(),
    location: z.string(),
    provider: z.string(),
    status: z.string(),
    cpu: z.number(),
    memory: z.number(),
    disk: z.number(),
    uptime: z.string(),
    lastUpdate: z.date(),
    alerts: z.number(),
    services: z.array(ServerServiceSchema),
    specs: ServerSpecsSchema,
    os: z.string(),
    ip: z.string(),
    metrics: z.object({
      cpu: z.number(),
      memory: z.number(),
      disk: z.number(),
      network_in: z.number(),
      network_out: z.number(),
      response_time: z.number(),
    }),
  }),
  history: ServerHistorySchema.nullable(),
  meta: z.object({
    format: z.literal('legacy'),
    include_history: z.boolean(),
    range: z.string(),
    timestamp: z.string(),
    processing_time_ms: z.number(),
  }),
});

export const EnhancedServerResponseSchema = z.object({
  meta: z.object({
    request_info: z.object({
      server_id: z.string(),
      format: z.string(),
      include_history: z.boolean(),
      include_metrics: z.boolean(),
      include_patterns: z.boolean(),
      range: z.string(),
      processing_time_ms: z.number(),
      timestamp: z.string(),
    }),
    dataSource: z.string(),
    scenario: z.string(),
  }),
  data: z.object({
    server_info: z.object({
      id: z.string(),
      hostname: z.string(),
      environment: z.string().optional(),
      role: z.string().optional(),
      status: z.string(),
      uptime: z.string(),
      last_updated: z.string().optional(),
    }),
    current_metrics: z.object({
      cpu_usage: z.number(),
      memory_usage: z.number(),
      disk_usage: z.number(),
      network_in: z.number(),
      network_out: z.number(),
      response_time: z.number(),
    }),
    resources: ServerSpecsSchema,
    network: z.object({
      ip: z.string(),
      hostname: z.string(),
      interface: z.string(),
    }),
    alerts: z.array(z.unknown()),
    services: z.array(ServerServiceSchema),
    pattern_info: z.any().optional(),
    correlation_metrics: z.any().optional(),
    history: ServerHistorySchema.optional(),
  }),
});

export const ServerErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string(),
  message: z.string(),
  available_servers: z.array(z.object({
    id: z.string(),
    hostname: z.string(),
  })).optional(),
  timestamp: z.string(),
});

export type ServerService = z.infer<typeof ServerServiceSchema>;
export type ServerSpecs = z.infer<typeof ServerSpecsSchema>;
export type ServerDetailQuery = z.infer<typeof ServerDetailQuerySchema>;
export type ServerHistoryDataPoint = z.infer<typeof ServerHistoryDataPointSchema>;
export type ServerHistory = z.infer<typeof ServerHistorySchema>;
export type LegacyServerResponse = z.infer<typeof LegacyServerResponseSchema>;
export type EnhancedServerResponse = z.infer<typeof EnhancedServerResponseSchema>;
export type ServerErrorResponse = z.infer<typeof ServerErrorResponseSchema>;

// ===== MCP Context Integration Sync API =====

export const MCPSyncRequestSchema = z.object({
  ragEngineUrl: z.string().url(),
  syncType: z.enum(['full', 'incremental', 'mcp_only', 'local_only']).default('full'),
  force: z.boolean().optional().default(false),
});

export const MCPSyncResultSchema = z.object({
  success: z.boolean(),
  syncedContexts: z.number(),
  errors: z.array(z.string()),
  timestamp: z.string(),
  syncType: z.enum(['full', 'incremental', 'mcp_only', 'local_only']),
  message: z.string().optional(),
});

export const MCPIntegratedStatusSchema = z.object({
  mcpServer: z.object({
    status: z.enum(['online', 'offline', 'connecting', 'degraded']),
  }),
  ragIntegration: z.object({
    enabled: z.boolean(),
    lastSync: z.string().optional(),
    syncCount: z.number().optional(),
  }),
  contextCache: z.object({
    size: z.number(),
  }),
  performance: z.any().optional(),
});

export const MCPSyncResponseSchema = MCPSyncResultSchema.extend({
  integratedStatus: MCPIntegratedStatusSchema,
  performance: z.object({
    mcpServerStatus: z.enum(['online', 'offline', 'connecting', 'degraded']),
    ragIntegrationEnabled: z.boolean(),
    contextCacheSize: z.number(),
  }),
});

export const MCPSyncStatusResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  syncStatus: z.object({
    mcpServerOnline: z.boolean(),
    ragIntegrationEnabled: z.boolean(),
    lastSyncTime: z.string().optional(),
    syncCount: z.number().optional(),
  }),
  availableSyncTypes: z.array(z.object({
    type: z.enum(['full', 'incremental', 'mcp_only', 'local_only']),
    description: z.string(),
    recommendedFor: z.string(),
  })),
  performance: z.any().optional(),
});

export type MCPSyncRequest = z.infer<typeof MCPSyncRequestSchema>;
export type MCPSyncResult = z.infer<typeof MCPSyncResultSchema>;
export type MCPIntegratedStatus = z.infer<typeof MCPIntegratedStatusSchema>;
export type MCPSyncResponse = z.infer<typeof MCPSyncResponseSchema>;
export type MCPSyncStatusResponse = z.infer<typeof MCPSyncStatusResponseSchema>;

// ===== MCP Context Integration API =====

export const MCPContextIntegrationRequestSchema = z.object({
  query: z.string(),
  contextType: z.enum(['mcp', 'local', 'hybrid']).default('hybrid'),
  nlpType: z.enum(['intent_analysis', 'entity_extraction', 'sentiment_analysis', 'command_parsing']).optional(),
  maxFiles: z.number().min(1).max(100).default(10),
  includeSystemContext: z.boolean().default(true),
  pathFilters: z.array(z.string()).default([]),
});

export type MCPContextIntegrationRequest = z.infer<typeof MCPContextIntegrationRequestSchema>;

export const MCPNLPContextSchema = z.object({
  query: z.string(),
  processingType: z.string(),
  contextSources: z.array(z.object({
    source: z.string(),
    relevance: z.number().min(0).max(1),
    content: z.any(),
  })),
  relevanceScore: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export type MCPNLPContext = z.infer<typeof MCPNLPContextSchema>;

export const MCPContextSchema = z.object({
  id: z.string(),
  query: z.string(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    relevance: z.number().min(0).max(1),
  })),
  systemContext: z.record(z.any()).optional(),
  metadata: z.object({
    totalFiles: z.number(),
    maxRelevance: z.number(),
    avgRelevance: z.number(),
    processingTime: z.number(),
  }),
});

export type MCPContext = z.infer<typeof MCPContextSchema>;

export const LocalContextBundleSchema = z.object({
  id: z.string(),
  type: z.enum(['base', 'advanced', 'custom']),
  content: z.record(z.any()),
  version: z.string(),
  lastUpdated: z.string(),
});

export type LocalContextBundle = z.infer<typeof LocalContextBundleSchema>;

export const MCPContextIntegrationResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  query: z.string(),
  contextType: z.enum(['mcp', 'local', 'hybrid']),
  data: z.object({
    nlpContext: MCPNLPContextSchema.optional(),
    processingType: z.string().optional(),
    nlpType: z.string().optional(),
    mcpContext: MCPContextSchema.optional(),
    localContexts: z.array(LocalContextBundleSchema).optional(),
    contextSources: z.array(z.string()).optional(),
    serverStatus: MCPIntegratedStatusSchema,
  }),
});

export type MCPContextIntegrationResponse = z.infer<typeof MCPContextIntegrationResponseSchema>;

export const MCPIntegrationStatusResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  data: MCPIntegratedStatusSchema,
  capabilities: z.object({
    mcpIntegration: z.boolean(),
    ragIntegration: z.boolean(),
    nlpSupport: z.boolean(),
    contextTypes: z.array(z.string()),
    nlpTypes: z.array(z.string()),
  }),
  endpoints: z.object({
    contextQuery: z.string(),
    ragSync: z.string(),
    mcpHealth: z.string(),
  }),
});

export type MCPIntegrationStatusResponse = z.infer<typeof MCPIntegrationStatusResponseSchema>;

// ===== Dev Key Manager API =====

export const DevKeyManagerActionSchema = z.enum(['status', 'report', 'generate-env', 'quick-setup']);

export type DevKeyManagerAction = z.infer<typeof DevKeyManagerActionSchema>;

export const DevKeyManagerServiceDetailSchema = z.object({
  name: z.string(),
  key: z.string(),
  configured: z.boolean(),
  valid: z.boolean(),
  value: z.string().optional(),
  message: z.string().optional(),
  required: z.boolean().optional(),
});

export type DevKeyManagerServiceDetail = z.infer<typeof DevKeyManagerServiceDetailSchema>;

export const DevKeyManagerValidationSchema = z.object({
  valid: z.number(),
  invalid: z.number(),
  missing: z.number(),
  details: z.array(DevKeyManagerServiceDetailSchema),
});

export type DevKeyManagerValidation = z.infer<typeof DevKeyManagerValidationSchema>;

export const DevKeyManagerStatusResponseSchema = z.object({
  timestamp: z.string(),
  environment: z.string(),
  summary: z.object({
    total: z.number(),
    valid: z.number(),
    invalid: z.number(),
    missing: z.number(),
    successRate: z.number(),
  }),
  services: z.array(DevKeyManagerServiceDetailSchema),
});

export type DevKeyManagerStatusResponse = z.infer<typeof DevKeyManagerStatusResponseSchema>;

export const DevKeyManagerReportResponseSchema = z.object({
  timestamp: z.string(),
  report: z.string(),
});

export type DevKeyManagerReportResponse = z.infer<typeof DevKeyManagerReportResponseSchema>;

export const DevKeyManagerEnvResponseSchema = z.object({
  timestamp: z.string(),
  success: z.boolean(),
  path: z.string().optional(),
  message: z.string().optional(),
  generatedKeys: z.number().optional(),
});

export type DevKeyManagerEnvResponse = z.infer<typeof DevKeyManagerEnvResponseSchema>;

export const DevKeyManagerSetupResponseSchema = z.object({
  timestamp: z.string(),
  success: z.boolean(),
  message: z.string(),
  details: z.object({
    envFileCreated: z.boolean().optional(),
    keysGenerated: z.number().optional(),
    warnings: z.array(z.string()).optional(),
  }).optional(),
});

export type DevKeyManagerSetupResponse = z.infer<typeof DevKeyManagerSetupResponseSchema>;

export const DevKeyManagerDefaultResponseSchema = z.object({
  timestamp: z.string(),
  environment: z.string(),
  keyManager: z.string(),
  summary: z.object({
    total: z.number(),
    valid: z.number(),
    invalid: z.number(),
    missing: z.number(),
    successRate: z.number(),
  }),
  availableActions: z.array(z.string()),
});

export type DevKeyManagerDefaultResponse = z.infer<typeof DevKeyManagerDefaultResponseSchema>;

export const DevKeyManagerErrorResponseSchema = z.object({
  timestamp: z.string(),
  error: z.string(),
  keyManager: z.string(),
});

export type DevKeyManagerErrorResponse = z.infer<typeof DevKeyManagerErrorResponseSchema>;

// ===== Alerts Stream API =====

export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertTypeSchema = z.enum(['info', 'warning', 'error', 'success']);

export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertEventSchema = z.object({
  id: z.string(),
  type: AlertTypeSchema,
  title: z.string(),
  message: z.string(),
  severity: AlertSeveritySchema,
  timestamp: z.number(),
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;

export const SSEPingEventSchema = z.object({
  event: z.literal('ping'),
  data: z.literal('connected'),
});

export type SSEPingEvent = z.infer<typeof SSEPingEventSchema>;

// ===== Google AI Generate API =====

export const GoogleAIGenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().max(10000).default(1000),
  model: z.string().default('gemini-pro'),
});

export type GoogleAIGenerateRequest = z.infer<typeof GoogleAIGenerateRequestSchema>;

export const GoogleAIUsageMetadataSchema = z.object({
  totalTokenCount: z.number().optional(),
  promptTokenCount: z.number().optional(),
  candidatesTokenCount: z.number().optional(),
});

export type GoogleAIUsageMetadata = z.infer<typeof GoogleAIUsageMetadataSchema>;

export const GoogleAIGenerateResponseSchema = z.object({
  success: z.boolean(),
  response: z.string(),
  text: z.string(), // 호환성을 위해 둘 다 제공
  model: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    temperature: z.number(),
    maxTokens: z.number(),
    actualTokens: z.number().optional(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
    processingTime: z.number(),
  }),
  timestamp: z.string(),
});

export type GoogleAIGenerateResponse = z.infer<typeof GoogleAIGenerateResponseSchema>;

export const GoogleAIErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export type GoogleAIErrorResponse = z.infer<typeof GoogleAIErrorResponseSchema>;

export const GoogleAIStatusResponseSchema = z.object({
  success: z.boolean(),
  service: z.string(),
  status: z.enum(['active', 'not_configured']),
  configured: z.boolean(),
  models: z.array(z.string()),
  capabilities: z.object({
    textGeneration: z.boolean(),
    streaming: z.boolean(),
    multimodal: z.boolean(),
  }),
  timestamp: z.string(),
});

export type GoogleAIStatusResponse = z.infer<typeof GoogleAIStatusResponseSchema>;

// ===== Dashboard Optimized API =====

export const DashboardOptimizedServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostname: z.string().optional(),
  environment: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['healthy', 'warning', 'critical']),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  network: z.number().nonnegative(),
  uptime: z.union([z.number(), z.string()]).optional(),
  lastUpdate: z.string().optional(),
  alerts: z.union([z.number(), z.array(z.any())]).optional(),
});

export type DashboardOptimizedServer = z.infer<typeof DashboardOptimizedServerSchema>;

export const DashboardOptimizedDataSchema = z.object({
  servers: z.record(DashboardOptimizedServerSchema),
  stats: DashboardStatsSchema,
  lastUpdate: z.string(),
  dataSource: z.string(),
});

export type DashboardOptimizedData = z.infer<typeof DashboardOptimizedDataSchema>;

export const DashboardOptimizedMetadataSchema = z.object({
  responseTime: z.number(),
  cacheHit: z.boolean(),
  redisKeys: z.number(),
  serversLoaded: z.number(),
  optimizationType: z.string(),
  performanceGain: z.string(),
  apiVersion: z.string(),
  scenario: z.string().optional(),
});

export type DashboardOptimizedMetadata = z.infer<typeof DashboardOptimizedMetadataSchema>;

export const DashboardOptimizedResponseSchema = z.object({
  success: z.boolean(),
  data: DashboardOptimizedDataSchema,
  metadata: DashboardOptimizedMetadataSchema,
});

export type DashboardOptimizedResponse = z.infer<typeof DashboardOptimizedResponseSchema>;

export const DashboardOptimizedErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  metadata: z.object({
    responseTime: z.number(),
    serversLoaded: z.number(),
  }),
});

export type DashboardOptimizedErrorResponse = z.infer<typeof DashboardOptimizedErrorResponseSchema>;