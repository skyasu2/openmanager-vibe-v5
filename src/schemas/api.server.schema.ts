import { z } from 'zod';
import {
  IdSchema,
  PercentageSchema,
  TimestampSchema,
} from './common.schema';

/**
 * 🖥️ 서버 메트릭 및 상태 스키마
 * 
 * 서버 상태, 성능 지표, 네트워크 메트릭, 시스템 모니터링
 */

// ===== 네트워크 메트릭 =====

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

// ===== 서버 메트릭 =====

export const ServerMetricsSchema = z.object({
  cpu: PercentageSchema,
  memory: PercentageSchema,
  disk: PercentageSchema,
  network: NetworkMetricsSchema,
  processes: z.number().nonnegative(),
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
  temperature: z.number().optional(),
});

// ===== 서버 상태 =====

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
// ===== 서버 페이지네이션 스키마 =====

export const ServerPaginationQuerySchema = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(20),
  sortBy: z.enum(['name', 'status', 'cpu', 'memory', 'lastUpdate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['online', 'offline', 'warning', 'error', 'maintenance']).optional(),
  search: z.string().optional(),
});

export const ServerPaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ServerStatusSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  timestamp: TimestampSchema,
});

// ===== 서버 배치 작업 스키마 =====

export const ServerBatchRequestSchema = z.object({
  serverIds: z.array(IdSchema),
  action: z.enum(['restart', 'stop', 'start', 'update', 'delete']),
  options: z.record(z.any()).optional(),
});

export const ServerBatchResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(z.object({
    serverId: IdSchema,
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
  })),
  summary: z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number(),
  }),
  timestamp: TimestampSchema,
});

// ===== 타입 내보내기 =====

export type NetworkMetrics = z.infer<typeof NetworkMetricsSchema>;
export type ServerMetrics = z.infer<typeof ServerMetricsSchema>;
export type ServerStatus = z.infer<typeof ServerStatusSchema>;