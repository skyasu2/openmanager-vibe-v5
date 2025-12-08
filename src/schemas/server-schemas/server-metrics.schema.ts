import { z } from 'zod';
import { IdSchema, PercentageSchema, TimestampSchema } from '../common.schema';

/**
 * 📊 서버 메트릭 스키마
 *
 * 서버의 성능 메트릭 및 상태 정보 정의
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
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ===== 타입 내보내기 =====

export type NetworkMetrics = z.infer<typeof NetworkMetricsSchema>;
export type ServerMetrics = z.infer<typeof ServerMetricsSchema>;
export type ServerStatus = z.infer<typeof ServerStatusSchema>;
