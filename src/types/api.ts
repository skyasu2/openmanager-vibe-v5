import * as z from 'zod';
// 실제 사용을 위해 유형을 가져옵니다. ESLint에서는 사용하지 않는다고 표시될 수 있지만
// Zod 스키마와 TypeScript 타입 간의 일관성을 위해 필요합니다.
/* import type { 
  ServerStatus, 
  MCPQuery, 
  MCPResponse, 
  MonitoringAlert,
  DashboardData 
} from './index' */

/**
 * API 응답 타입 정의 + Zod 런타임 검증
 * 모든 API 응답은 이 형식을 따름
 */

// 🌐 기본 API 응답 스키마
export const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  version: z.string().default('1.0.0'),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseApiResponseSchema.extend({
    data: dataSchema.optional(),
    error: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  });

export type ApiResponse<T = unknown> = {
  readonly success: boolean;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly version: string;
  readonly data?: T;
  readonly error?: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

// 🏥 헬스체크 API 스키마
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  services: z.record(
    z.string(),
    z.object({
      status: z.enum(['connected', 'disconnected', 'error']),
      latency: z.number().optional(),
      lastCheck: z.string(),
      details: z.string().optional(),
    })
  ),
  uptime: z.number(),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// 🤖 MCP 쿼리 API 스키마
export const MCPQueryRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.record(z.string(), z.string()).optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

export const MCPQueryResponseSchema = z.object({
  id: z.string(),
  queryId: z.string(),
  response: z.string(),
  relatedServers: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  timestamp: z.string(),
  sources: z.array(z.string()),
  actionable: z.boolean(),
});

export type MCPQueryRequest = z.infer<typeof MCPQueryRequestSchema>;
export type MCPQueryResponse = z.infer<typeof MCPQueryResponseSchema>;

// 🖥️ 서버 모니터링 API 스키마
export const ServerMetricsSchema = z.object({
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  network: z.object({
    bytesIn: z.number().min(0),
    bytesOut: z.number().min(0),
    packetsIn: z.number().min(0),
    packetsOut: z.number().min(0),
    latency: z.number().min(0),
    connections: z.number().min(0),
  }),
  processes: z.number().min(0),
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
});

export const ServerStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['online', 'offline', 'warning', 'error']),
  lastUpdate: z.string(),
  location: z.string(),
  uptime: z.number().min(0),
  metrics: ServerMetricsSchema,
});

// 📊 대시보드 API 스키마
export const DashboardDataSchema = z.object({
  servers: z.array(ServerStatusSchema),
  alerts: z.array(
    z.object({
      id: z.string(),
      serverId: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      type: z.string(),
      message: z.string(),
      timestamp: z.string(),
      resolved: z.boolean(),
    })
  ),
  systemOverview: z.object({
    totalServers: z.number().min(0),
    onlineServers: z.number().min(0),
    criticalAlerts: z.number().min(0),
    averageResponseTime: z.number().min(0),
    _systemHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  }),
  timestamp: z.string(),
});

// 🔧 페이지네이션 스키마
export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema,
  });

// 🎯 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  errorCode: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// 🏥 시스템 헬스 API 응답 타입
export interface SystemHealthAPIResponse {
  status: 'online' | 'warning' | 'critical';
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  services: {
    database: 'operational' | 'degraded' | 'down';
    cache: 'operational' | 'degraded' | 'down';
    ai: 'operational' | 'degraded' | 'down';
  };
  timestamp: string;
  charts?: {
    performanceChart: Array<{ name: string; value: number; color: string }>;
    availabilityChart: { online: number; total: number };
    alertsChart: { bySeverity: Record<string, number> };
    trendsChart: {
      timePoints: string[];
      metrics: { cpu?: number[]; memory?: number[]; alerts?: number[] };
    };
  };
}

// 🛡️ 타입 가드 함수들
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse(
  response: ApiResponse<unknown>
): response is ApiResponse<never> & { success: false; error: string } {
  return response.success === false && response.error !== undefined;
}
