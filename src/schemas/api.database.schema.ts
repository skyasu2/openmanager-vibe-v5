import { z } from 'zod';

/**
 * 🗄️ 데이터베이스 연결풀 관리 스키마
 * 
 * 연결풀 설정, 상태 관리, 성능 통계, 헬스체크
 */

// ===== 연결풀 설정 =====

export const DatabasePoolConfigSchema = z.object({
  maxConnections: z.number().min(1).max(100).default(20),
  minConnections: z.number().min(1).max(50).default(5),
  acquireTimeout: z.number().min(1000).max(60000).default(30000),
  idleTimeout: z.number().min(60000).max(600000).default(300000),
});

// ===== 연결풀 리셋 요청 =====

export const DatabasePoolResetRequestSchema = z.object({
  force: z.boolean().optional(),
  config: DatabasePoolConfigSchema.optional(),
});

// ===== 연결풀 상태 =====

export const DatabasePoolStatusSchema = z.object({
  total: z.number(),
  active: z.number(),
  idle: z.number(),
  waiting: z.number(),
});

// ===== 연결풀 리셋 응답 =====

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

// ===== 연결풀 상태 응답 =====

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

// ===== 타입 내보내기 =====

export type DatabasePoolConfig = z.infer<typeof DatabasePoolConfigSchema>;
export type DatabasePoolResetRequest = z.infer<typeof DatabasePoolResetRequestSchema>;
export type DatabasePoolStatus = z.infer<typeof DatabasePoolStatusSchema>;
export type DatabasePoolResetResponse = z.infer<typeof DatabasePoolResetResponseSchema>;
export type DatabasePoolStatusResponse = z.infer<typeof DatabasePoolStatusResponseSchema>;