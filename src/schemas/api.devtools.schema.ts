import { z } from 'zod';

/**
 * 🛠️ 개발도구 키 관리자 스키마
 *
 * 환경변수 키 관리, 유효성 검사, 자동 설정, 개발 환경 설정
 */

// ===== Dev Key Manager 액션 =====

export const DevKeyManagerActionSchema = z.enum([
  'status',
  'report',
  'generate-env',
  'quick-setup',
]);

// ===== 서비스 세부정보 =====

export const DevKeyManagerServiceDetailSchema = z.object({
  name: z.string(),
  key: z.string(),
  configured: z.boolean(),
  valid: z.boolean(),
  value: z.string().optional(),
  message: z.string().optional(),
  required: z.boolean().optional(),
});

// ===== 유효성 검사 결과 =====

export const DevKeyManagerValidationSchema = z.object({
  valid: z.number(),
  invalid: z.number(),
  missing: z.number(),
  details: z.array(DevKeyManagerServiceDetailSchema),
});

// ===== 상태 응답 =====

export const DevKeyManagerStatusResponseSchema = z.object({
  timestamp: z.string(),
  environment: z.string(),
  summary: z.object({
    total: z.number(),
    valid: z.number(),
    invalid: z.number(),
    missing: z.number(),
    successRate: z.number(),
  }),
  services: z.array(DevKeyManagerServiceDetailSchema),
});

// ===== 보고서 응답 =====

export const DevKeyManagerReportResponseSchema = z.object({
  timestamp: z.string(),
  report: z.string(),
});

// ===== 환경변수 생성 응답 =====

export const DevKeyManagerEnvResponseSchema = z.object({
  timestamp: z.string(),
  success: z.boolean(),
  path: z.string().optional(),
  message: z.string().optional(),
  generatedKeys: z.number().optional(),
});

// ===== 빠른 설정 응답 =====

export const DevKeyManagerSetupResponseSchema = z.object({
  timestamp: z.string(),
  success: z.boolean(),
  message: z.string(),
  details: z
    .object({
      envFileCreated: z.boolean().optional(),
      keysGenerated: z.number().optional(),
      warnings: z.array(z.string()).optional(),
    })
    .optional(),
});

// ===== 기본 응답 =====

export const DevKeyManagerDefaultResponseSchema = z.object({
  timestamp: z.string(),
  environment: z.string(),
  keyManager: z.string(),
  summary: z.object({
    total: z.number(),
    valid: z.number(),
    invalid: z.number(),
    missing: z.number(),
    successRate: z.number(),
  }),
  availableActions: z.array(z.string()),
});

// ===== 에러 응답 =====

export const DevKeyManagerErrorResponseSchema = z.object({
  timestamp: z.string(),
  error: z.string(),
  keyManager: z.string(),
});

// ===== 에러 리포트 스키마 =====

export const ErrorReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']),
  category: z.string(),
  affectedSystems: z.array(z.string()),
  reportedBy: z.string(),
  assignedTo: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
});

export const ErrorReportRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1),
  affectedSystems: z.array(z.string()).optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
});

export const ErrorReportQuerySchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const ErrorReportListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ErrorReportSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const ErrorReportCreateResponseSchema = z.object({
  success: z.boolean(),
  data: ErrorReportSchema,
  message: z.string().optional(),
});

// ===== 시스템 최적화 스키마 =====

export const SystemOptimizeRequestSchema = z.object({
  action: z.enum(['analyze', 'optimize', 'cleanup', 'reset']),
  targetSystems: z.array(z.string()).optional(),
  aggressive: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  options: z
    .object({
      clearCache: z.boolean().optional(),
      restartServices: z.boolean().optional(),
      updateConfigs: z.boolean().optional(),
      generateReport: z.boolean().optional(),
    })
    .optional(),
});

export const SystemOptimizeResponseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  results: z.object({
    systemsAnalyzed: z.number(),
    issuesFound: z.number(),
    issuesResolved: z.number(),
    performanceGain: z.number().optional(),
    details: z.array(z.string()),
  }),
  recommendations: z.array(z.string()).optional(),
  timestamp: z.string().datetime(),
  metadata: z
    .object({
      processingTime: z.number().optional(),
      affectedSystems: z.array(z.string()).optional(),
    })
    .optional(),
});

// ===== 타입 내보내기 =====

export type DevKeyManagerAction = z.infer<typeof DevKeyManagerActionSchema>;
export type DevKeyManagerServiceDetail = z.infer<
  typeof DevKeyManagerServiceDetailSchema
>;
export type DevKeyManagerValidation = z.infer<
  typeof DevKeyManagerValidationSchema
>;
export type DevKeyManagerStatusResponse = z.infer<
  typeof DevKeyManagerStatusResponseSchema
>;
export type DevKeyManagerReportResponse = z.infer<
  typeof DevKeyManagerReportResponseSchema
>;
export type DevKeyManagerEnvResponse = z.infer<
  typeof DevKeyManagerEnvResponseSchema
>;
export type DevKeyManagerSetupResponse = z.infer<
  typeof DevKeyManagerSetupResponseSchema
>;
export type DevKeyManagerDefaultResponse = z.infer<
  typeof DevKeyManagerDefaultResponseSchema
>;
export type DevKeyManagerErrorResponse = z.infer<
  typeof DevKeyManagerErrorResponseSchema
>;

// Error Report Types
export type ErrorSeverity = z.infer<typeof ErrorReportSchema>['severity']; // 추가: ErrorSeverity 타입
export type ErrorReport = z.infer<typeof ErrorReportSchema>;
export type ErrorReportRequest = z.infer<typeof ErrorReportRequestSchema>;
export type ErrorReportQuery = z.infer<typeof ErrorReportQuerySchema>;
export type ErrorReportListResponse = z.infer<
  typeof ErrorReportListResponseSchema
>;
export type ErrorReportCreateResponse = z.infer<
  typeof ErrorReportCreateResponseSchema
>;

// System Optimization Types
export type SystemOptimizeRequest = z.infer<typeof SystemOptimizeRequestSchema>;
export type SystemOptimizeResponse = z.infer<
  typeof SystemOptimizeResponseSchema
>;
