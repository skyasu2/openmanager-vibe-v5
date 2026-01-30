/**
 * 클라이언트 안전 환경변수 상수
 *
 * ⚠️ 'use client' 컴포넌트에서는 이 파일을 import하세요.
 * @/env는 Zod를 사용하므로 클라이언트 번들에서 크래시를 유발합니다.
 */

const nodeEnv = process.env.NODE_ENV || 'development';
export const isDevelopment = nodeEnv === 'development';
export const isProduction = nodeEnv === 'production';
export const isTest = nodeEnv === 'test';
export const isVercel = !!process.env.VERCEL;
export const isVercelProduction = process.env.VERCEL_ENV === 'production';
export const isDebugEnabled =
  isDevelopment || process.env.NEXT_PUBLIC_DEBUG === 'true';
