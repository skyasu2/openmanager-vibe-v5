import { z } from 'zod';

/**
 * 📊 AI 성능 모니터링 API 스키마
 *
 * AI 엔진의 성능 메트릭, 벤치마크, 최적화 상태 등을 정의
 */

// ===== AI 성능 메트릭 =====

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

// ===== AI 성능 통계 응답 =====

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

// ===== 벤치마크 =====

export const AIBenchmarkRequestSchema = z.object({
  mode: z.enum(['comparison', 'load']).default('comparison'),
  queries: z
    .array(z.string())
    .default(['서버 상태', 'CPU 사용률', '메모리 상태']),
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

// ===== 비교 벤치마크 =====

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

// ===== 부하 벤치마크 =====

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

// ===== 캐시 관리 =====

export const CacheClearResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
});

// ===== 타입 내보내기 =====

export type AIPerformanceMetrics = z.infer<typeof AIPerformanceMetricsSchema>;
export type AIOptimizationStatus = z.infer<typeof AIOptimizationStatusSchema>;
export type AIEngineHealth = z.infer<typeof AIEngineHealthSchema>;
export type AIPerformanceStatsResponse = z.infer<
  typeof AIPerformanceStatsResponseSchema
>;
export type AIBenchmarkRequest = z.infer<typeof AIBenchmarkRequestSchema>;
export type BenchmarkResponseItem = z.infer<typeof BenchmarkResponseItemSchema>;
export type ComparisonBenchmarkResponse = z.infer<
  typeof ComparisonBenchmarkResponseSchema
>;
export type LoadBenchmarkResponse = z.infer<typeof LoadBenchmarkResponseSchema>;
export type CacheClearResponse = z.infer<typeof CacheClearResponseSchema>;
