/**
 * 📋 Supervisor Request Schemas (Zod Validation)
 *
 * AI SDK v5 UIMessage 'parts' 포맷 및 레거시 'content' 포맷 모두 지원
 *
 * @created 2026-01-10 (route.ts에서 분리)
 */

import { z } from 'zod';

// AI SDK v5 UIMessage 'parts' 포맷
const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// AI SDK v5+ 호환성: 알려진 타입 + unknown 타입 fallback
const knownPartTypes = z.discriminatedUnion('type', [
  textPartSchema,
  z.object({ type: z.literal('tool-invocation') }).passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('file') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
]);

// Unknown part 타입 허용 (향후 AI SDK 업데이트 호환성)
const unknownPartSchema = z.object({ type: z.string() }).passthrough();

const partSchema = z.union([knownPartTypes, unknownPartSchema]);

// 하이브리드 메시지 스키마: AI SDK v5 (parts) + 레거시 (content) 모두 지원
export const messageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    // AI SDK v5: parts 배열 (UIMessage 포맷)
    parts: z.array(partSchema).optional(),
    // 레거시: content 문자열
    content: z.string().optional(),
    // 추가 메타데이터 허용
    createdAt: z.union([z.string(), z.date()]).optional(),
  })
  .refine(
    (msg) =>
      (Array.isArray(msg.parts) && msg.parts.length > 0) ||
      (typeof msg.content === 'string' && msg.content.trim().length > 0),
    { message: 'Message must include non-empty parts array or content string' }
  );

export const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().optional(),
});

// Export types for external use
export type MessageSchema = z.infer<typeof messageSchema>;
export type RequestSchema = z.infer<typeof requestSchema>;
