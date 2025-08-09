import { z } from 'zod';
import {
  HealthStatusSchema,
  TimestampSchema,
} from './common.schema';

/**
 * 🏥 API 헬스체크 스키마
 * 
 * 시스템 상태 확인, 서비스 헬스체크, 업타임 모니터링
 */

// ===== 헬스체크 서비스 =====

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

// ===== 타입 내보내기 =====

export type HealthCheckService = z.infer<typeof HealthCheckServiceSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;