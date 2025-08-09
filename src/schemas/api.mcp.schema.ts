import { z } from 'zod';
import { IdSchema, TimestampSchema } from './common.schema';

/**
 * 🔌 MCP (Model Context Protocol) 스키마
 *
 * AI 쿼리 요청/응답, 컨텍스트 관리, MCP 서버 통신
 */

// ===== MCP 쿼리 요청 =====

export const MCPQueryRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.record(z.string()).optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      stream: z.boolean().optional(),
    })
    .optional(),
});

// ===== MCP 쿼리 응답 =====

export const MCPQueryResponseSchema = z.object({
  id: IdSchema,
  queryId: IdSchema,
  response: z.string(),
  relatedServers: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  timestamp: TimestampSchema,
  sources: z.array(z.string()),
  actionable: z.boolean(),
  metadata: z
    .object({
      model: z.string().optional(),
      processingTime: z.number().optional(),
      tokensUsed: z.number().optional(),
    })
    .optional(),
});
// ===== MCP Context Integration 스키마 =====

export const MCPContextIntegrationRequestSchema = z.object({
  action: z.enum(['sync', 'query', 'update']),
  data: z.record(z.union([z.string(), z.number(), z.boolean(), z.object({}).passthrough()])),
  sessionId: z.string().optional(),
  timestamp: TimestampSchema,
});

export const MCPContextIntegrationResponseSchema = z.object({
  success: z.boolean(),
  action: z.enum(['sync', 'query', 'update']),
  result: z.record(z.union([z.string(), z.number(), z.boolean(), z.object({}).passthrough()])).optional(),
  message: z.string().optional(),
  timestamp: TimestampSchema,
});

export const MCPIntegrationStatusResponseSchema = z.object({
  status: z.enum(['active', 'inactive', 'error']),
  connectedServers: z.array(z.string()),
  lastSync: TimestampSchema.optional(),
  version: z.string(),
});

// ===== MCP Sync 스키마 =====

export const MCPSyncRequestSchema = z.object({
  targetServers: z.array(z.string()).optional(),
  fullSync: z.boolean().optional(),
  dataTypes: z.array(z.enum(['context', 'memory', 'cache'])).optional(),
});

export const MCPSyncResponseSchema = z.object({
  success: z.boolean(),
  syncedItems: z.number(),
  failedItems: z.number(),
  details: z.array(
    z.object({
      server: z.string(),
      status: z.enum(['success', 'failed', 'skipped']),
      items: z.number(),
      error: z.string().optional(),
    })
  ),
  timestamp: TimestampSchema,
});

export const MCPSyncStatusResponseSchema = z.object({
  isSyncing: z.boolean(),
  lastSync: TimestampSchema.optional(),
  nextSync: TimestampSchema.optional(),
  syncInterval: z.number(),
  pendingItems: z.number(),
});

// ===== 타입 내보내기 =====

export type MCPQueryRequest = z.infer<typeof MCPQueryRequestSchema>;
export type MCPQueryResponse = z.infer<typeof MCPQueryResponseSchema>;
