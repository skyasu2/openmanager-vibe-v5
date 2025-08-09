import { z } from 'zod';
import { TimestampSchema } from './common.schema';

/**
 * 💾 캐시 및 Redis 통계 스키마
 *
 * 캐시 성능 지표, Redis 정보, 메모리 사용량, 캐시 통계
 */

// ===== 캐시 기본 통계 =====

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

// ===== 캐시 성능 평가 =====

export const CachePerformanceSchema = z.object({
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  hitRate: z.number().min(0).max(100),
  errorRate: z.string(),
  issues: z.array(z.string()),
  totalOperations: z.number().nonnegative(),
  recommendations: z.array(z.string()),
});

// ===== Redis 서버 정보 =====

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

// ===== 메모리 사용량 =====

export const MemoryUsageSchema = z.object({
  estimatedMB: z.number().nonnegative(),
  maxMB: z.number().nonnegative(),
  usagePercent: z.number().min(0).max(100),
});

// ===== 캐시 통계 응답 =====

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

// ===== 캐시 최적화 관련 스키마 =====

export const CacheOptimizeRequestSchema = z.object({
  action: z.enum(['warmup', 'invalidate', 'optimize', 'reset-stats']),
  options: z
    .object({
      targets: z.array(z.string()).optional(),
      pattern: z.string().optional(),
    })
    .optional(),
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

// ===== 서버 메트릭 상세 스키마 =====

export const ServerMetricsDetailSchema = z.object({
  cpu: z
    .object({
      usage: z.number().min(0).max(100),
      cores: z.number().positive().optional(),
    })
    .optional(),
  memory: z
    .object({
      usage: z.number().min(0).max(100),
      total: z.number().positive().optional(),
      used: z.number().nonnegative().optional(),
    })
    .optional(),
  disk: z
    .object({
      usage: z.number().min(0).max(100),
      total: z.number().positive().optional(),
      used: z.number().nonnegative().optional(),
    })
    .optional(),
  network: z
    .object({
      in: z.number().nonnegative().optional(),
      out: z.number().nonnegative().optional(),
    })
    .optional(),
});

// ===== 타입 내보내기 =====

export type CacheStats = z.infer<typeof CacheStatsSchema>;
export type CachePerformance = z.infer<typeof CachePerformanceSchema>;
export type RedisInfo = z.infer<typeof RedisInfoSchema>;
export type MemoryUsage = z.infer<typeof MemoryUsageSchema>;
export type CacheStatsResponse = z.infer<typeof CacheStatsResponseSchema>;
export type CacheOptimizeRequest = z.infer<typeof CacheOptimizeRequestSchema>;
export type CacheWarmupResponse = z.infer<typeof CacheWarmupResponseSchema>;
export type CacheInvalidateResponse = z.infer<
  typeof CacheInvalidateResponseSchema
>;
export type CacheOptimizeResponse = z.infer<typeof CacheOptimizeResponseSchema>;
export type CacheResetStatsResponse = z.infer<
  typeof CacheResetStatsResponseSchema
>;
export type ServerMetricsDetail = z.infer<typeof ServerMetricsDetailSchema>;
