import { z } from 'zod';
import {
  IdSchema,
  PercentageSchema,
  PrioritySchema,
  TimestampSchema,
} from './common.schema';

/**
 * 📊 모니터링 관련 Zod 스키마
 *
 * 시스템 모니터링 및 알림에 사용되는 스키마들
 */

// ===== 모니터링 대상 =====

export const MonitoringTargetTypeSchema = z.enum([
  'server',
  'service',
  'database',
  'api',
  'website',
  'container',
  'network',
  'custom',
]);

export const MonitoringTargetSchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: MonitoringTargetTypeSchema,
  endpoint: z.string().optional(),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  config: z.record(z.unknown()).optional(),
});

// ===== 모니터링 메트릭 =====

export const MetricTypeSchema = z.enum([
  'gauge',
  'counter',
  'histogram',
  'summary',
]);

export const MetricUnitSchema = z.enum([
  'percent',
  'bytes',
  'milliseconds',
  'seconds',
  'count',
  'requests_per_second',
  'bytes_per_second',
  'celsius',
]);

export const MetricDefinitionSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  unit: MetricUnitSchema,
  description: z.string().optional(),
  labels: z.array(z.string()).default([]),
  aggregations: z
    .array(z.enum(['min', 'max', 'avg', 'sum', 'count']))
    .optional(),
});

export const MetricValueSchema = z.object({
  timestamp: TimestampSchema,
  value: z.number(),
  labels: z.record(z.string()).optional(),
});

export const MetricDataSchema = z.object({
  metric: MetricDefinitionSchema,
  values: z.array(MetricValueSchema),
  aggregated: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      avg: z.number().optional(),
      sum: z.number().optional(),
      count: z.number().optional(),
      p50: z.number().optional(),
      p90: z.number().optional(),
      p95: z.number().optional(),
      p99: z.number().optional(),
    })
    .optional(),
});

// ===== 알림 규칙 =====

export const AlertConditionOperatorSchema = z.enum([
  'gt', // greater than
  'gte', // greater than or equal
  'lt', // less than
  'lte', // less than or equal
  'eq', // equal
  'neq', // not equal
  'contains',
  'not_contains',
  'matches_regex',
]);

export const AlertConditionSchema = z.object({
  metric: z.string(),
  operator: AlertConditionOperatorSchema,
  threshold: z.union([z.number(), z.string()]),
  duration: z.number().positive().optional(), // seconds
  aggregation: z.enum(['min', 'max', 'avg', 'sum']).optional(),
});

export const AlertRuleSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  targetId: IdSchema,
  conditions: z.array(AlertConditionSchema),
  logic: z.enum(['all', 'any']).default('all'),
  severity: PrioritySchema,
  cooldown: z.number().nonnegative().default(300), // seconds
  annotations: z.record(z.string()).optional(),
  actions: z.array(
    z.object({
      type: z.enum(['email', 'sms', 'webhook', 'slack', 'pagerduty']),
      config: z.record(z.unknown()),
    })
  ),
});

// ===== 알림 인스턴스 =====

export const AlertStateSchema = z.enum([
  'pending',
  'firing',
  'resolved',
  'silenced',
]);

export const AlertInstanceSchema = z.object({
  id: IdSchema,
  ruleId: IdSchema,
  targetId: IdSchema,
  state: AlertStateSchema,
  severity: PrioritySchema,
  title: z.string(),
  description: z.string(),
  firedAt: TimestampSchema,
  resolvedAt: TimestampSchema.optional(),
  lastNotifiedAt: TimestampSchema.optional(),
  notificationCount: z.number().nonnegative().default(0),
  values: z.record(z.number()),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
  silencedUntil: TimestampSchema.optional(),
});

// ===== 대시보드 =====

export const VisualizationTypeSchema = z.enum([
  'line_chart',
  'area_chart',
  'bar_chart',
  'pie_chart',
  'gauge',
  'number',
  'table',
  'heatmap',
  'map',
]);

export const DashboardPanelSchema = z.object({
  id: IdSchema,
  title: z.string(),
  type: VisualizationTypeSchema,
  position: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  queries: z.array(
    z.object({
      metric: z.string(),
      targetId: IdSchema.optional(),
      filters: z.record(z.string()).optional(),
      aggregation: z.string().optional(),
      groupBy: z.array(z.string()).optional(),
    })
  ),
  options: z.record(z.unknown()).optional(),
  refreshInterval: z.number().positive().optional(), // seconds
});

export const DashboardSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  panels: z.array(DashboardPanelSchema),
  variables: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['query', 'custom', 'constant']),
        value: z.union([z.string(), z.array(z.string())]),
        options: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  timeRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  refreshInterval: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

// ===== 로그 =====

export const LogLevelSchema = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

export const LogEntrySchema = z.object({
  timestamp: TimestampSchema,
  level: LogLevelSchema,
  message: z.string(),
  source: z.object({
    service: z.string(),
    host: z.string().optional(),
    file: z.string().optional(),
    line: z.number().optional(),
  }),
  context: z.record(z.unknown()).optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  userId: z.string().optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
});

// ===== SLA =====

export const SLATargetSchema = z.object({
  metric: z.string(),
  target: z.number(),
  unit: MetricUnitSchema,
  description: z.string().optional(),
});

export const SLASchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  targets: z.array(SLATargetSchema),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  penalties: z
    .array(
      z.object({
        threshold: PercentageSchema,
        penalty: z.string(),
      })
    )
    .optional(),
  exclusions: z
    .array(
      z.object({
        type: z.enum(['maintenance', 'force_majeure', 'customer_fault']),
        description: z.string(),
      })
    )
    .optional(),
});

// ===== 타입 내보내기 =====
export type MonitoringTarget = z.infer<typeof MonitoringTargetSchema>;
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;
export type MetricData = z.infer<typeof MetricDataSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type AlertInstance = z.infer<typeof AlertInstanceSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type SLA = z.infer<typeof SLASchema>;
