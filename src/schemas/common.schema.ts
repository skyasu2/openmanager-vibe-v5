import { z } from 'zod';

/**
 * 🌐 공통 Zod 스키마 정의
 *
 * 프로젝트 전체에서 재사용되는 기본 스키마들
 */

// ===== 기본 타입 스키마 =====

// ID 관련
export const IdSchema = z.string().min(1);
export const UuidSchema = z.string().uuid();
export const SlugSchema = z.string().regex(/^[a-z0-9-]+$/);

// 타임스탬프
export const TimestampSchema = z.string().datetime();
export const DateSchema = z.string().date();
export const TimeSchema = z.string().time();

// 숫자 범위
export const PercentageSchema = z.number().min(0).max(100);
export const PositiveNumberSchema = z.number().positive();
export const NonNegativeNumberSchema = z.number().nonnegative();
export const PortSchema = z.number().int().min(1).max(65535);

// 문자열 패턴
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const IpAddressSchema = z.string().ip();
export const JsonSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid JSON string',
    });
    return z.NEVER;
  }
});

// ===== 공통 구조 스키마 =====

// 페이지네이션
export const PaginationRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const PaginationResponseSchema = z.object({
  items: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// API 응답
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  timestamp: TimestampSchema,
  requestId: z.string().optional(),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  errorCode: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

// 메타데이터
export const MetadataSchema = z.object({
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  version: z.number().int().positive().default(1),
  tags: z.array(z.string()).default([]),
});

// 설정
export const ConfigurationSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().min(1),
  description: z.string().optional(),
  settings: z.record(z.unknown()).default({}),
});

// 상태
export const StatusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const HealthStatusSchema = z.enum([
  'healthy',
  'degraded',
  'unhealthy',
  'unknown',
]);

// 우선순위
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// 환경
export const EnvironmentSchema = z.enum([
  'development',
  'staging',
  'production',
  'test',
]);

// ===== 유틸리티 스키마 =====

// 선택적 필드를 null로 변환
export const NullableSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

// 빈 문자열을 undefined로 변환
export const EmptyStringToUndefined = z
  .string()
  .transform((val) => (val === '' ? undefined : val));

// 문자열을 숫자로 변환
export const StringToNumber = z.string().transform((val, ctx) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid number string',
    });
    return z.NEVER;
  }
  return parsed;
});

// 문자열을 불린으로 변환
export const StringToBoolean = z
  .string()
  .transform((val) => {
    const lower = val.toLowerCase();
    if (
      lower === 'true' ||
      lower === '1' ||
      lower === 'yes' ||
      lower === 'on'
    ) {
      return true;
    }
    if (
      lower === 'false' ||
      lower === '0' ||
      lower === 'no' ||
      lower === 'off'
    ) {
      return false;
    }
    return null;
  })
  .pipe(z.boolean());

// 안전한 JSON 파싱
export const SafeJsonSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([z.string(), z.record(z.unknown())])
    .transform((val, ctx) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON string',
          });
          return z.NEVER;
        }
      }
      return val;
    })
    .pipe(schema);

// ===== 타입 내보내기 =====
export type Id = z.infer<typeof IdSchema>;
export type Uuid = z.infer<typeof UuidSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type Percentage = z.infer<typeof PercentageSchema>;
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type Configuration = z.infer<typeof ConfigurationSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
