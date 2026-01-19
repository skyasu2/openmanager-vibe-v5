import * as z from 'zod';

/**
 * 📄 서버 페이지네이션 API 스키마
 *
 * 서버 목록의 페이지네이션 처리를 위한 스키마
 */

// ===== 페이지네이션 쿼리 =====

export const ServerPaginationQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.string().default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['online', 'warning', 'critical']).optional(),
});

// ===== 페이지네이션된 서버 =====

export const PaginatedServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['online', 'warning', 'critical']),
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

// ===== 페이지네이션 메타데이터 =====

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

// ===== 서버 요약 정보 =====

export const ServerSummarySchema = z.object({
  total: z.number().nonnegative(),
  healthy: z.number().nonnegative(),
  warning: z.number().nonnegative(),
  critical: z.number().nonnegative(),
});

// ===== 페이지네이션 응답 =====

export const ServerPaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    servers: z.array(PaginatedServerSchema),
    pagination: ServerPaginationSchema,
    filters: z.object({
      status: z.enum(['online', 'warning', 'critical']).nullable(),
      sortBy: z.string(),
      order: z.enum(['asc', 'desc']),
    }),
    summary: ServerSummarySchema,
  }),
  timestamp: z.string(),
});

// ===== 배치 작업 =====

export const ServerBatchActionSchema = z.enum([
  'batch-restart',
  'batch-update',
  'batch-configure',
  'health-check',
]);

export const ServerBatchRequestSchema = z.object({
  action: ServerBatchActionSchema,
  serverIds: z.array(z.string()).min(1),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const ServerBatchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  serverIds: z.array(z.string()).optional(),
  estimatedDuration: z.number().optional(),
  timestamp: z.string(),
  settings: z.record(z.string(), z.unknown()).optional(),
  results: z
    .array(
      z.object({
        serverId: z.string(),
        status: z.enum(['online', 'warning', 'critical']),
        responseTime: z.number(),
        lastCheck: z.string(),
      })
    )
    .optional(),
});

// ===== 타입 내보내기 =====

export type ServerPaginationQuery = z.infer<typeof ServerPaginationQuerySchema>;
export type PaginatedServer = z.infer<typeof PaginatedServerSchema>;
export type ServerPagination = z.infer<typeof ServerPaginationSchema>;
export type ServerSummary = z.infer<typeof ServerSummarySchema>;
export type ServerPaginatedResponse = z.infer<
  typeof ServerPaginatedResponseSchema
>;
export type ServerBatchAction = z.infer<typeof ServerBatchActionSchema>;
export type ServerBatchRequest = z.infer<typeof ServerBatchRequestSchema>;
export type ServerBatchResponse = z.infer<typeof ServerBatchResponseSchema>;
