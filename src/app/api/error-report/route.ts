/**
 * 📝 에러 리포트 API
 *
 * 에러 리포트 생성 및 조회
 * Zod 스키마와 타입 안전성 적용
 *
 * GET /api/error-report - 에러 리포트 목록 조회
 * POST /api/error-report - 새 에러 리포트 생성
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  ErrorReportSchema,
  ErrorReportRequestSchema,
  ErrorReportQuerySchema,
  ErrorReportListResponseSchema,
  ErrorReportCreateResponseSchema,
  type ErrorReport,
  type ErrorReportListResponse,
  type ErrorReportCreateResponse,
  type ErrorSeverity,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

// 모의 에러 리포트 데이터 생성
function generateMockErrorReports(count: number = 20): ErrorReport[] {
  const types = [
    'system_error',
    'api_error',
    'database_error',
    'network_error',
    'validation_error',
  ];
  const sources = [
    'server-001',
    'server-002',
    'api-gateway',
    'database',
    'cache-manager',
  ];
  const severities: ErrorSeverity[] = [
    'low',
    'medium',
    'high',
    'critical',
  ];

  const messages = [
    '서버 연결 시간 초과',
    'API 요청 처리 실패',
    '데이터베이스 쿼리 오류',
    '네트워크 연결 끊김',
    '입력 데이터 검증 실패',
    '메모리 부족 오류',
    '파일 시스템 접근 오류',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `err_${Date.now()}_${i}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    severity:
      severities[Math.floor(Math.random() * severities.length)] ?? 'medium',
    type: types[Math.floor(Math.random() * types.length)] ?? 'system_error',
    message:
      messages[Math.floor(Math.random() * messages.length)] ?? 'Unknown error',
    source: sources[Math.floor(Math.random() * sources.length)] ?? 'unknown',
    stackTrace:
      i % 3 === 0
        ? `Error at line ${Math.floor(Math.random() * 100) + 1}`
        : undefined,
    metadata: {
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
      requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    resolved: Math.random() > 0.3,
  }));
}

// GET 핸들러
const getHandler = createApiRoute()
  .query(ErrorReportQuerySchema)
  .response(ErrorReportListResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<ErrorReportListResponse> => {
    const { severity, type, source, resolved, limit, page } = context.query;

    let errorReports = generateMockErrorReports(100);

    // 필터링 적용
    if (severity) {
      errorReports = errorReports.filter(
        (report) => report.severity === severity
      );
    }

    if (type) {
      errorReports = errorReports.filter((report) => report.type === type);
    }

    if (source) {
      errorReports = errorReports.filter((report) => report.source === source);
    }

    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      errorReports = errorReports.filter(
        (report) => report.resolved === isResolved
      );
    }

    // 페이지네이션
    const safePage = page ?? 1;
    const safeLimit = limit ?? 20;
    const startIndex = (safePage - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;
    const paginatedReports = errorReports.slice(startIndex, endIndex);

    return {
      reports: paginatedReports,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: errorReports.length,
        totalPages: Math.ceil(errorReports.length / safeLimit),
      },
      timestamp: new Date().toISOString(),
    };
  });

export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    console.error('에러 리포트 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '에러 리포트를 조회할 수 없습니다.',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(ErrorReportRequestSchema)
  .response(ErrorReportCreateResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<ErrorReportCreateResponse> => {
    const {
      type,
      message,
      severity = 'medium',
      source = 'unknown',
      stackTrace,
      metadata = {},
    } = context.body;

    const newReport: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity,
      type,
      message,
      source,
      stackTrace,
      metadata: {
        ...metadata,
        reportedAt: new Date().toISOString(),
        autoGenerated: false,
      },
      resolved: false,
    };

    return {
      success: true,
      message: '에러 리포트가 성공적으로 생성되었습니다.',
      report: newReport,
      timestamp: new Date().toISOString(),
    };
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('에러 리포트 생성 오류:', error);
    return NextResponse.json(
      { 
        error: '에러 리포트를 생성할 수 없습니다.',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
