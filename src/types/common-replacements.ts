/**
 * 🎯 any 타입 대체를 위한 공통 타입 정의
 *
 * Phase 1: any 타입 제거를 위한 기본 타입들
 */

// 기본 객체 타입
export type AnyObject = Record<string, unknown>;

// 함수 타입
export type AnyFunction = (...args: unknown[]) => unknown;
export type AsyncAnyFunction = (...args: unknown[]) => Promise<unknown>;

// 배열 타입
export type AnyArray = unknown[];

// 에러 타입
export type UnknownError = unknown;
export type ErrorWithMessage = Error | { message: string };

// API 응답 타입
export interface ApiResponseData {
  [key: string]: unknown;
}

// 설정 타입
export interface ConfigObject {
  [key: string]: string | number | boolean | ConfigObject | undefined;
}

// 서버 관련 타입
export interface ServerMetadata {
  [key: string]: string | number | boolean | undefined;
}

// 진단 정보 타입
export interface DiagnosticsData {
  [key: string]: unknown;
}

// 분석 데이터 타입
export interface AnalysisData {
  metrics?: Record<string, number>;
  status?: string;
  recommendations?: string[];
  [key: string]: unknown;
}

// 타입 가드 함수들
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

// 안전한 타입 변환 함수들
export function toSafeObject(value: unknown): AnyObject {
  if (isRecord(value)) {
    return value;
  }
  return {};
}

export function toSafeArray(value: unknown): AnyArray {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

export function toSafeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}
