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
import debug from '@/utils/debug';

// 모의 에러 리포트 데이터 생성
function generateMockErrorReports(count: number = 20): ErrorReport[] {
  const categories = [
    'system_error',
    'api_error',
    'database_error',
    'network_error',
    'validation_error',
  ];
  const affectedSystems = [
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

  const titles = [
    '서버 연결 시간 초과',
    'API 요청 처리 실패',
    '데이터베이스 쿼리 오류',
    '네트워크 연결 끊김',
    '입력 데이터 검증 실패',
    '메모리 부족 오류',
    '파일 시스템 접근 오류',
  ];

  const descriptions = [
    '서버 응답 시간이 30초를 초과했습니다.',
    'API 엔드포인트에서 500 에러가 발생했습니다.',
    'PostgreSQL 연결이 끊어져 쿼리 실행에 실패했습니다.',
    '네트워크 인터페이스가 비정상적으로 종료되었습니다.',
    '입력 파라미터가 스키마 검증에 실패했습니다.',
    '시스템 메모리 사용량이 95%를 초과했습니다.',
    '로그 파일에 접근할 수 없습니다.',
  ];

  const statuses = ['open', 'investigating', 'resolved', 'closed'] as const;

  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const createdAt = new Date(Date.now() - i * 3600000);
    const isResolved = Math.random() > 0.3;
    
    return {
      id: `err_${Date.now()}_${i}`,
      title: titles[Math.floor(Math.random() * titles.length)] ?? 'Unknown error',
      description: descriptions[Math.floor(Math.random() * descriptions.length)] ?? 'No description available',
      severity: severities[Math.floor(Math.random() * severities.length)] ?? 'medium',
      status: statuses[Math.floor(Math.random() * statuses.length)] ?? 'open',
      category: categories[Math.floor(Math.random() * categories.length)] ?? 'system_error',
      affectedSystems: [affectedSystems[Math.floor(Math.random() * affectedSystems.length)] ?? 'unknown'],
      reportedBy: `user_${Math.floor(Math.random() * 1000)}`,
      assignedTo: isResolved ? `admin_${Math.floor(Math.random() * 10)}` : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: now.toISOString(),
      resolvedAt: isResolved ? now.toISOString() : undefined,
      metadata: {
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
        requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };
  });
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
    const { severity, status, category, limit, offset } = context.query;

    let errorReports = generateMockErrorReports(100);

    // 필터링 적용
    if (severity) {
      errorReports = errorReports.filter(
        (report) => report.severity === severity
      );
    }

    if (status) {
      errorReports = errorReports.filter((report) => report.status === status);
    }

    if (category) {
      errorReports = errorReports.filter((report) => report.category === category);
    }

    // 페이지네이션
    const safeLimit = limit ?? 20;
    const safeOffset = offset ?? 0;
    const paginatedReports = errorReports.slice(safeOffset, safeOffset + safeLimit);

    return {
      success: true,
      data: paginatedReports,
      total: errorReports.length,
      limit: safeLimit,
      offset: safeOffset,
    };
  });

export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    debug.error('에러 리포트 조회 오류:', error);
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
      title,
      description,
      severity,
      category,
      affectedSystems = [],
      metadata = {},
    } = context.body;

    const now = new Date();
    const newReport: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      severity,
      status: 'open',
      category,
      affectedSystems,
      reportedBy: 'api-user', // 실제로는 인증된 사용자 ID
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      metadata: {
        ...metadata,
        reportedAt: now.toISOString(),
        autoGenerated: false,
      },
    };

    return {
      success: true,
      data: newReport,
      message: '에러 리포트가 성공적으로 생성되었습니다.',
    };
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    debug.error('에러 리포트 생성 오류:', error);
    return NextResponse.json(
      { 
        error: '에러 리포트를 생성할 수 없습니다.',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
