/**
 * 📋 Supervisor Request Schemas (Zod Validation)
 *
 * AI SDK v5 UIMessage 'parts' 포맷 및 레거시 'content' 포맷 모두 지원
 * 파일/이미지 첨부에 대한 상세 검증 포함
 *
 * @created 2026-01-10 (route.ts에서 분리)
 * @updated 2026-01-27 (멀티모달 파일 검증 강화)
 */

import { z } from 'zod';

// ============================================================================
// Part Schemas
// ============================================================================

// AI SDK v5 UIMessage 'parts' 포맷
const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

/**
 * 파일 파트 스키마 (PDF, audio, documents)
 * AI SDK FilePart uses 'mediaType' not 'mimeType'
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#file-parts
 */
const filePartSchema = z.object({
  type: z.literal('file'),
  // Base64 data URL 또는 URL
  data: z.string().max(50 * 1024 * 1024, '파일 크기가 50MB를 초과합니다'),
  // AI SDK uses 'mediaType' for FilePart
  mediaType: z
    .enum([
      'application/pdf',
      'text/plain',
      'text/markdown',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ])
    .optional(),
  // 선택적 메타데이터
  filename: z.string().max(255).optional(),
});

/**
 * 이미지 파트 스키마
 * @see https://ai-sdk.dev/docs/ai-sdk-core/prompts#image-parts
 */
const imagePartSchema = z.object({
  type: z.literal('image'),
  // Base64 data URL 또는 HTTP(S) URL
  image: z.string().max(50 * 1024 * 1024, '이미지 크기가 50MB를 초과합니다'),
  // 선택적 MIME 타입 (이미지는 AI SDK가 자동 감지 가능)
  mimeType: z
    .enum(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
    .optional(),
});

// AI SDK v5+ 호환성: 모든 part 타입 허용 (union으로 유연성 확보)
// discriminatedUnion은 알 수 없는 타입에서 실패하므로 union 사용
const partSchema = z.union([
  textPartSchema,
  filePartSchema,
  imagePartSchema,
  z.object({ type: z.literal('tool-invocation') }).passthrough(),
  z.object({ type: z.literal('tool-result') }).passthrough(),
  z.object({ type: z.literal('reasoning') }).passthrough(),
  z.object({ type: z.literal('source') }).passthrough(),
  z.object({ type: z.literal('step-start') }).passthrough(),
  z.object({ type: z.literal('step-finish') }).passthrough(),
  // Fallback: 알 수 없는 타입도 허용 (AI SDK 업데이트 대응)
  z
    .object({ type: z.string() })
    .passthrough(),
]);

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
