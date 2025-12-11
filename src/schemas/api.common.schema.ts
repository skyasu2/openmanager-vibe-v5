import * as z from 'zod';
import { BaseResponseSchema, ErrorResponseSchema } from './common.schema';

/**
 * 🔗 API 공통 스키마
 *
 * API 요청/응답에서 공통으로 사용되는 래퍼와 배치 작업 스키마들
 */

// ===== API 응답 래퍼 =====

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
    metadata: z.record(z.string(), z.string()).optional(),
  });

export const ApiErrorResponseSchema = ErrorResponseSchema.extend({
  statusCode: z.number().optional(),
  path: z.string().optional(),
  method: z.string().optional(),
});

// ===== 배치 작업 =====

export const BatchRequestSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema).min(1).max(100),
    options: z
      .object({
        parallel: z.boolean().default(false),
        continueOnError: z.boolean().default(false),
        timeout: z.number().positive().optional(),
      })
      .optional(),
  });

export const BatchResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.array(itemSchema),
    failed: z.array(
      z.object({
        item: z.unknown(),
        error: z.string(),
        index: z.number(),
      })
    ),
    total: z.number(),
    successCount: z.number(),
    failedCount: z.number(),
  });

// ===== 타입 내보내기 =====

export type BatchRequest<T> = {
  items: T[];
  options?: {
    parallel?: boolean;
    continueOnError?: boolean;
    timeout?: number;
  };
};
