import { z } from 'zod';
import {
  IdSchema,
  TimestampSchema,
  PercentageSchema,
  MetadataSchema,
  _StatusSchema,
  HealthStatusSchema,
} from './common.schema';

/**
 * 🖥️ 서버 관련 Zod 스키마
 *
 * 서버 모니터링 및 관리에 사용되는 스키마들
 */

// ===== 서버 유형 =====

export const ServerTypeSchema = z.enum([
  'web',
  'database',
  'api',
  'cache',
  'storage',
  'compute',
  'load-balancer',
  'proxy',
  'monitoring',
  'backup',
  'kubernetes-master',
  'kubernetes-worker',
]);

export const ServerEnvironmentSchema = z.enum([
  'production',
  'staging',
  'development',
  'test',
  'disaster-recovery',
]);

// ===== 서버 리소스 =====

export const CPUInfoSchema = z.object({
  cores: z.number().positive(),
  model: z.string(),
  speed: z.number().positive(), // MHz
  temperature: z.number().optional(),
  usage: PercentageSchema,
  loadAverage: z.tuple([z.number(), z.number(), z.number()]),
});

export const MemoryInfoSchema = z.object({
  total: z.number().positive(), // bytes
  used: z.number().nonnegative(),
  free: z.number().nonnegative(),
  available: z.number().nonnegative(),
  usage: PercentageSchema,
  swapTotal: z.number().nonnegative().optional(),
  swapUsed: z.number().nonnegative().optional(),
});

export const DiskInfoSchema = z.object({
  device: z.string(),
  mountPoint: z.string(),
  total: z.number().positive(),
  used: z.number().nonnegative(),
  free: z.number().nonnegative(),
  usage: PercentageSchema,
  type: z.string().optional(),
});

export const NetworkInterfaceSchema = z.object({
  name: z.string(),
  ip: z.string().ip().optional(),
  mac: z.string().optional(),
  speed: z.number().optional(), // Mbps
  bytesIn: z.number().nonnegative(),
  bytesOut: z.number().nonnegative(),
  packetsIn: z.number().nonnegative(),
  packetsOut: z.number().nonnegative(),
  errors: z.number().nonnegative(),
  dropped: z.number().nonnegative(),
});

// ===== 서버 프로세스 =====

export const ProcessSchema = z.object({
  pid: z.number().positive(),
  name: z.string(),
  command: z.string(),
  cpu: PercentageSchema,
  memory: PercentageSchema,
  memoryBytes: z.number().nonnegative(),
  threads: z.number().positive(),
  user: z.string(),
  startTime: TimestampSchema,
  status: z.enum(['running', 'sleeping', 'stopped', 'zombie']),
});

// ===== 서버 설정 =====

export const ServerConfigSchema = z.object({
  hostname: z.string(),
  domain: z.string().optional(),
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535).optional(),
  ssl: z.boolean().default(false),
  sslPort: z.number().int().min(1).max(65535).optional(),
  maxConnections: z.number().positive().optional(),
  timeout: z.number().positive().optional(), // seconds
  keepAlive: z.boolean().default(true),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().positive().default(60), // seconds
    retention: z.number().positive().default(30), // days
  }),
});

// ===== 서버 상세 정보 =====

export const ServerDetailsSchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: ServerTypeSchema,
  environment: ServerEnvironmentSchema,
  status: z.enum(['online', 'offline', 'warning', 'error', 'maintenance']),
  health: HealthStatusSchema,
  location: z.object({
    datacenter: z.string(),
    rack: z.string().optional(),
    zone: z.string().optional(),
    region: z.string().optional(),
  }),
  hardware: z.object({
    cpu: CPUInfoSchema,
    memory: MemoryInfoSchema,
    disks: z.array(DiskInfoSchema),
    network: z.array(NetworkInterfaceSchema),
  }),
  os: z.object({
    name: z.string(),
    version: z.string(),
    kernel: z.string().optional(),
    uptime: z.number().nonnegative(), // seconds
  }),
  config: ServerConfigSchema,
  metadata: MetadataSchema,
});

// ===== 서버 이벤트 =====

export const ServerEventTypeSchema = z.enum([
  'start',
  'stop',
  'restart',
  'crash',
  'maintenance_start',
  'maintenance_end',
  'config_change',
  'resource_alert',
  'security_alert',
  'backup_complete',
  'update_complete',
]);

export const ServerEventSchema = z.object({
  id: IdSchema,
  serverId: IdSchema,
  type: ServerEventTypeSchema,
  timestamp: TimestampSchema,
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  user: z.string().optional(),
  automated: z.boolean().default(false),
});

// ===== 서버 그룹 =====

export const ServerGroupSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['cluster', 'pool', 'region', 'custom']),
  servers: z.array(IdSchema),
  metadata: MetadataSchema,
  policies: z
    .object({
      autoScaling: z.boolean().default(false),
      loadBalancing: z.boolean().default(false),
      healthCheck: z.object({
        enabled: z.boolean().default(true),
        interval: z.number().positive().default(30),
        timeout: z.number().positive().default(5),
        retries: z.number().nonnegative().default(3),
      }),
    })
    .optional(),
});

// ===== 서버 메트릭 히스토리 =====

export const MetricPointSchema = z.object({
  timestamp: TimestampSchema,
  value: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export const ServerMetricsHistorySchema = z.object({
  serverId: IdSchema,
  metric: z.enum(['cpu', 'memory', 'disk', 'network', 'temperature']),
  period: z.enum(['1h', '6h', '24h', '7d', '30d']),
  points: z.array(MetricPointSchema),
  aggregation: z.object({
    min: z.number(),
    max: z.number(),
    avg: z.number(),
    p50: z.number(),
    p95: z.number(),
    p99: z.number(),
  }),
});

// ===== 타입 내보내기 =====
export type ServerType = z.infer<typeof ServerTypeSchema>;
export type ServerEnvironment = z.infer<typeof ServerEnvironmentSchema>;
export type CPUInfo = z.infer<typeof CPUInfoSchema>;
export type MemoryInfo = z.infer<typeof MemoryInfoSchema>;
export type DiskInfo = z.infer<typeof DiskInfoSchema>;
export type NetworkInterface = z.infer<typeof NetworkInterfaceSchema>;
export type Process = z.infer<typeof ProcessSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type ServerDetails = z.infer<typeof ServerDetailsSchema>;
export type ServerEvent = z.infer<typeof ServerEventSchema>;
export type ServerGroup = z.infer<typeof ServerGroupSchema>;
export type ServerMetricsHistory = z.infer<typeof ServerMetricsHistorySchema>;
