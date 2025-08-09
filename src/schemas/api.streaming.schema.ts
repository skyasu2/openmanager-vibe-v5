import { z } from 'zod';
import { AlertSeveritySchema } from './api.alert.schema';

/**
 * 🔄 실시간 스트리밍 및 SSE 스키마
 * 
 * 서버-송신 이벤트(SSE), 실시간 알림, 스트리밍 데이터
 */

// ===== 알림 스트림 타입 =====

export const AlertTypeSchema = z.enum(['info', 'warning', 'error', 'success']);

// ===== 알림 이벤트 =====

export const AlertEventSchema = z.object({
  id: z.string(),
  type: AlertTypeSchema,
  title: z.string(),
  message: z.string(),
  severity: AlertSeveritySchema,
  timestamp: z.number(),
});

// ===== SSE 핑 이벤트 =====

export const SSEPingEventSchema = z.object({
  event: z.literal('ping'),
  data: z.literal('connected'),
});

// ===== SSE 이벤트 유니온 =====

export const SSEEventSchema = z.union([
  z.object({
    event: z.literal('alert'),
    data: AlertEventSchema,
  }),
  SSEPingEventSchema,
  z.object({
    event: z.literal('message'),
    data: z.string(),
  }),
  z.object({
    event: z.literal('error'),
    data: z.object({
      message: z.string(),
      timestamp: z.number(),
    }),
  }),
]);

// ===== 스트리밍 상태 =====

export const StreamStatusSchema = z.object({
  connected: z.boolean(),
  startTime: z.number(),
  messageCount: z.number(),
  lastMessage: z.number().optional(),
});

// ===== 스트림 설정 =====

export const StreamConfigSchema = z.object({
  enabled: z.boolean(),
  heartbeatInterval: z.number().min(1000).max(60000).default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
  bufferSize: z.number().min(1).max(1000).default(100),
});

// ===== 타입 내보내기 =====

export type AlertType = z.infer<typeof AlertTypeSchema>;
export type AlertEvent = z.infer<typeof AlertEventSchema>;
export type SSEPingEvent = z.infer<typeof SSEPingEventSchema>;
export type SSEEvent = z.infer<typeof SSEEventSchema>;
export type StreamStatus = z.infer<typeof StreamStatusSchema>;
export type StreamConfig = z.infer<typeof StreamConfigSchema>;