/**
 * 🎯 API 응답 TypeScript 타입 정의
 *
 * Zod 스키마에서 자동 생성된 타입 안전한 API 응답 타입들
 * 600+ TypeScript 에러 해결을 위한 핵심 타입 정의
 */

import { z } from 'zod';
import {
  _StatusSchema,
  // 공통 스키마
  BaseResponseSchema,
  ErrorResponseSchema,
  HealthCheckResponseSchema,
  HealthStatusSchema,
  IdSchema,
  // API 스키마
  MCPQueryRequestSchema,
  MCPQueryResponseSchema,
  NetworkInfoSchema,
  PaginationRequestSchema,
  PaginationResponseSchema,
  PercentageSchema,
  ServerMetricsSchema,
  // 서버 스키마 (alias 사용)
  ServerSchema,
  TimestampSchema,
} from '@/schemas';

// ===== Zod 스키마에서 TypeScript 타입 자동 생성 =====

// API 관련 타입
export type MCPQueryRequest = z.infer<typeof MCPQueryRequestSchema>;
export type MCPQueryResponse = z.infer<typeof MCPQueryResponseSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// 서버 관련 타입
export type Server = z.infer<typeof ServerSchema>;
export type ServerMetrics = z.infer<typeof ServerMetricsSchema>;
export type NetworkInfo = z.infer<typeof NetworkInfoSchema>;

// 공통 타입
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse<T> = z.infer<typeof PaginationResponseSchema> & {
  data: T[];
};
export type Status = z.infer<typeof _StatusSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type Id = z.infer<typeof IdSchema>;
export type Percentage = z.infer<typeof PercentageSchema>;

// 서버 타입들 (임시로 간단하게 정의)
export type ServerType = 'web' | 'database' | 'api' | 'cache' | 'worker';
export type CPUInfo = { usage: number; cores: number };
export type MemoryInfo = { usage: number; total: number };
export type DiskInfo = { usage: number; total: number };

// ===== 공통 API 응답 래퍼 타입 =====

/**
 * 표준 API 응답 형식
 * 모든 API 엔드포인트에서 일관된 응답 구조 보장
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * 페이지네이션이 포함된 API 응답
 */
export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===== 특화된 응답 타입들 =====

/**
 * 대시보드 응답 타입
 */
export type DashboardResponse = ApiResponse<{
  servers: Server[];
  metrics: {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    criticalAlerts: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'alert' | 'maintenance' | 'deployment';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}>;

/**
 * 서버 목록 응답 타입
 */
export type ServerListResponse = PaginatedApiResponse<Server>;

/**
 * 서버 상세 정보 응답 타입
 */
export type ServerDetailResponse = ApiResponse<{
  server: Server;
  metrics: ServerMetrics;
  recentLogs: Array<{
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    source: string;
  }>;
}>;

/**
 * AI 분석 결과 응답 타입
 */
export type AIAnalysisResponse = ApiResponse<{
  analysis: {
    summary: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  };
  thinkingSteps?: Array<{
    step: number;
    description: string;
    reasoning: string;
    confidence: number;
  }>;
  metadata: {
    engine: string;
    processingTime: number;
    tokensUsed: number;
  };
}>;

// ===== React 컴포넌트에서 자주 사용되는 타입들 =====

/**
 * React 상태로 자주 사용되는 서버 데이터 타입
 */
export type ServerState = {
  servers: Server[];
  selectedServer: Server | null;
  loading: boolean;
  error: string | null;
};

/**
 * AI 응답 상태 타입
 */
export type AIResponseState = {
  response: MCPQueryResponse | null;
  loading: boolean;
  error: string | null;
  thinkingSteps: Array<{
    step: number;
    description: string;
    reasoning: string;
    confidence: number;
  }>;
};

/**
 * 차트 데이터 타입 (AdminDashboardCharts 등에서 사용)
 */
export type ChartDataPoint = {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
};

export type ChartTooltipPayload = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
};

// ===== 타입 가드 함수들 =====

/**
 * unknown 데이터가 ApiResponse인지 확인하는 타입 가드
 */
export function isApiResponse<T = unknown>(
  data: unknown
): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean' &&
    'data' in data &&
    'timestamp' in data
  );
}

/**
 * unknown 데이터가 Server 타입인지 확인하는 타입 가드
 */
export function isServer(data: unknown): data is Server {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'status' in data &&
    typeof (data as Record<string, unknown>).id === 'string' &&
    typeof (data as Record<string, unknown>).name === 'string'
  );
}

/**
 * unknown 데이터가 MCPQueryResponse인지 확인하는 타입 가드
 */
export function isMCPQueryResponse(data: unknown): data is MCPQueryResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'queryId' in data &&
    'response' in data &&
    typeof (data as Record<string, unknown>).id === 'string'
  );
}

/**
 * 에러 객체에서 안전하게 메시지를 추출하는 유틸리티
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
    try {
      return JSON.stringify(msg ?? '');
    } catch {
      return 'An unknown error occurred';
    }
  }
  return 'An unknown error occurred';
}

/**
 * 배열에서 안전하게 요소에 접근하는 유틸리티
 */
export function safeArrayAccess<T>(
  array: unknown,
  index: number
): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index] as T;
}
