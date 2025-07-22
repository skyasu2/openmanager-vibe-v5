/**
 * API 라우트 인증 미들웨어
 *
 * Admin API 엔드포인트 보호를 위한 Next.js API 미들웨어
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authManager } from '../auth';

export interface AuthenticatedRequest extends NextRequest {
  authInfo?: {
    sessionId: string;
    userId: string;
    userRole: 'admin' | 'viewer' | 'demo';
    permissions: string[];
  };
}

/**
 * Admin API 인증 미들웨어
 *
 * @param handler - 보호할 API 핸들러
 * @param requiredPermission - 필요한 권한 (기본값: system:admin)
 * @returns 인증된 요청만 처리하는 핸들러
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>,
  requiredPermission: string = 'system:admin'
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authorization header missing or invalid',
            message: '인증이 필요합니다.',
          },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // 'Bearer ' 제거

      // 브라우저 토큰 검증
      const session = authManager.validateBrowserToken(token);
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired token',
            message: '토큰이 유효하지 않거나 만료되었습니다.',
          },
          { status: 401 }
        );
      }

      // 권한 확인
      if (!authManager.hasPermission(session.sessionId, requiredPermission)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient permissions',
            message: '이 작업을 수행할 권한이 없습니다.',
          },
          { status: 403 }
        );
      }

      // 인증 정보를 요청에 추가
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.authInfo = {
        sessionId: session.sessionId,
        userId: session.userId,
        userRole: session.userRole,
        permissions: session.permissions,
      };

      // 원래 핸들러 실행
      return await handler(authenticatedReq);
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: '인증 처리 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * API 키 기반 인증 미들웨어 (서비스 간 통신용)
 */
export function withApiKeyAuth(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const apiKey = req.headers.get('x-api-key');
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'API key missing',
            message: 'API 키가 필요합니다.',
          },
          { status: 401 }
        );
      }

      // API 키 검증 (환경 변수에서)
      const validApiKey = process.env.ADMIN_API_KEY;
      if (!validApiKey || apiKey !== validApiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid API key',
            message: '유효하지 않은 API 키입니다.',
          },
          { status: 401 }
        );
      }

      return await handler(req);
    } catch (error) {
      console.error('❌ API key auth error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: 'API 키 인증 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 조건부 인증 미들웨어 (읽기는 허용, 쓰기는 인증 필요)
 */
export function withConditionalAuth(
  readHandler: (req: NextRequest) => Promise<Response>,
  writeHandler: (req: AuthenticatedRequest) => Promise<Response>,
  requiredPermission: string = 'system:admin'
) {
  return async (req: NextRequest): Promise<Response> => {
    // GET 요청은 인증 없이 허용
    if (req.method === 'GET') {
      return await readHandler(req);
    }

    // POST, PUT, DELETE 등은 인증 필요
    return await withAdminAuth(writeHandler, requiredPermission)(req);
  };
}

/**
 * 속도 제한 미들웨어 (선택적)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  limit: number = 100,
  windowMs: number = 60000 // 1분
) {
  return async (req: NextRequest): Promise<Response> => {
    const clientId =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const clientData = requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else if (clientData.count >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 429 }
      );
    } else {
      clientData.count++;
    }

    return await handler(req);
  };
}
