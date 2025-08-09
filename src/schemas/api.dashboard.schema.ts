import { z } from 'zod';
import { TimestampSchema } from './common.schema';
import { ServerStatusSchema } from './api.server.schema';
import { AlertSchema } from './api.alert.schema';

/**
 * 📊 대시보드 데이터 스키마
 * 
 * 시스템 개요, 대시보드 데이터 구조, 전체 현황
 */

// ===== 시스템 개요 =====

export const SystemOverviewSchema = z.object({
  totalServers: z.number().nonnegative(),
  onlineServers: z.number().nonnegative(),
  criticalAlerts: z.number().nonnegative(),
  averageResponseTime: z.number().nonnegative(),
  systemHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  lastUpdated: TimestampSchema,
});

// ===== 대시보드 전체 데이터 =====

export const DashboardOverviewDataSchema = z.object({
  servers: z.array(ServerStatusSchema),
  alerts: z.array(AlertSchema),
  systemOverview: SystemOverviewSchema,
  timestamp: TimestampSchema,
});

// ===== 대시보드 통계 스키마 =====

export const DashboardStatsSchema = z.object({
  totalServers: z.number().nonnegative(),
  onlineServers: z.number().nonnegative(),
  warningServers: z.number().nonnegative(),
  criticalServers: z.number().nonnegative(),
  avgCpu: z.number().min(0).max(100),
  avgMemory: z.number().min(0).max(100),
  avgDisk: z.number().min(0).max(100),
  totalAlerts: z.number().nonnegative(),
  criticalAlerts: z.number().nonnegative(),
  responseTime: z.number().nonnegative(),
});

// ===== 대시보드 데이터 스키마 =====

export const DashboardDataSchema = z.object({
  stats: DashboardStatsSchema,
  servers: z.record(z.any()), // Server data as key-value pairs
  recentAlerts: z.array(AlertSchema),
  systemHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  timestamp: TimestampSchema,
});

// ===== 대시보드 응답 스키마 =====

export const DashboardResponseSchema = z.object({
  success: z.boolean(),
  data: DashboardDataSchema,
  timestamp: TimestampSchema,
  metadata: z.object({
    cacheHit: z.boolean().optional(),
    processingTime: z.number().optional(),
    dataSource: z.string().optional(),
  }).optional(),
});

// ===== 대시보드 서버 스키마 =====

export const DashboardServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  status: z.enum(['online', 'offline', 'critical', 'healthy', 'warning']),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  location: z.string(),
  environment: z.string().optional(),
  metrics: z.object({
    cpu: z.union([
      z.number(),
      z.object({ usage: z.number(), cores: z.number().optional(), temperature: z.number().optional() })
    ]).optional(),
    memory: z.union([
      z.number(),
      z.object({ used: z.number(), total: z.number(), usage: z.number() })
    ]).optional(),
    disk: z.union([
      z.number(),
      z.object({ used: z.number(), total: z.number(), usage: z.number() })
    ]).optional(),
    network: z.object({
      rx: z.number().optional(),
      tx: z.number().optional(),
      bytesIn: z.number().optional(),
      bytesOut: z.number().optional(),
    }).optional(),
  }).optional(),
});

// ===== 대시보드 액션 요청 스키마 =====

export const DashboardActionRequestSchema = z.object({
  action: z.enum(['refresh', 'reset', 'export', 'import']),
  targetId: z.string().optional(),
  data: z.any().optional(),
  options: z.object({
    force: z.boolean().optional(),
    includeMetrics: z.boolean().optional(),
    timeRange: z.string().optional(),
  }).optional(),
});

// ===== 대시보드 액션 응답 스키마 =====

export const DashboardActionResponseSchema = z.object({
  success: z.boolean(),
  action: z.enum(['refresh', 'reset', 'export', 'import']),
  message: z.string().optional(),
  data: z.any().optional(),
  timestamp: TimestampSchema,
});

// ===== 타입 내보내기 =====

export type SystemOverview = z.infer<typeof SystemOverviewSchema>;
export type DashboardOverviewData = z.infer<typeof DashboardOverviewDataSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardData = z.infer<typeof DashboardDataSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardServer = z.infer<typeof DashboardServerSchema>;
export type DashboardActionRequest = z.infer<typeof DashboardActionRequestSchema>;
export type DashboardActionResponse = z.infer<typeof DashboardActionResponseSchema>;