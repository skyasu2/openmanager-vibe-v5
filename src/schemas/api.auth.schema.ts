import { z } from 'zod';
import { TimestampSchema } from './common.schema';

/**
 * 🔐 인증 및 OAuth 테스트 스키마
 * 
 * Supabase 인증, GitHub OAuth, 환경 설정, 인증 진단
 */

// ===== 인증 테스트 결과 =====

export const AuthTestResultSchema = z.object({
  timestamp: TimestampSchema,
  supabase: z.object({
    url: z.string(),
    connection: z.boolean(),
    connectionError: z.string().nullable(),
  }),
  auth: z.object({
    configured: z.boolean(),
    error: z.string().nullable(),
    session: z.boolean(),
  }),
  githubOAuth: z.object({
    urlGenerated: z.boolean(),
    error: z.string().nullable(),
    redirectUrl: z.string().nullable(),
  }),
  environment: z.object({
    nodeEnv: z.string().optional(),
    vercel: z.boolean(),
    domain: z.string(),
  }),
});

// ===== 인증 테스트 응답 =====

export const AuthTestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AuthTestResultSchema,
  recommendations: z.array(z.string()),
});

// ===== 인증 진단 요청 =====

export const AuthDiagnosticsRequestSchema = z.object({
  testType: z.enum(['full', 'oauth', 'auth']).default('full'),
});

// ===== 인증 진단 결과 =====

export const AuthDiagnosticsSchema = z.object({
  timestamp: TimestampSchema,
  testType: z.enum(['full', 'oauth', 'auth']),
  github: z.object({
    success: z.boolean(),
    url: z.string().optional(),
    error: z.string().optional(),
    provider: z.string().optional(),
    urlAnalysis: z.object({
      domain: z.string(),
      hasClientId: z.boolean(),
      hasRedirectUri: z.boolean(),
      hasScopes: z.boolean(),
      redirectUri: z.string().nullable(),
      scopes: z.string().nullable(),
      state: z.string().nullable(),
    }).optional(),
  }).optional(),
  authSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    canAccessAuthTable: z.boolean(),
  }).optional(),
});

// ===== 인증 진단 응답 =====

export const AuthDiagnosticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  diagnostics: AuthDiagnosticsSchema,
});

// ===== 타입 내보내기 =====

export type AuthTestResult = z.infer<typeof AuthTestResultSchema>;
export type AuthTestResponse = z.infer<typeof AuthTestResponseSchema>;
export type AuthDiagnosticsRequest = z.infer<typeof AuthDiagnosticsRequestSchema>;
export type AuthDiagnostics = z.infer<typeof AuthDiagnosticsSchema>;
export type AuthDiagnosticsResponse = z.infer<typeof AuthDiagnosticsResponseSchema>;