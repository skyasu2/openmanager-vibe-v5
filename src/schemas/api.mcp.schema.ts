import { z } from 'zod';
import {
  IdSchema,
  TimestampSchema,
} from './common.schema';

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
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    stream: z.boolean().optional(),
  }).optional(),
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
  metadata: z.object({
    model: z.string().optional(),
    processingTime: z.number().optional(),
    tokensUsed: z.number().optional(),
  }).optional(),
});

// ===== 타입 내보내기 =====

export type MCPQueryRequest = z.infer<typeof MCPQueryRequestSchema>;
export type MCPQueryResponse = z.infer<typeof MCPQueryResponseSchema>;