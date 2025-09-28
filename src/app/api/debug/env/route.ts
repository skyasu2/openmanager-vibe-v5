/**
 * 🔍 환경변수 진단 API
 * 
 * Vercel 프로덕션 환경에서 AI API 실패 문제 해결을 위한
 * 환경변수 상태 진단 엔드포인트
 * 
 * GET /api/debug/env
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env, features, isProduction, isVercelProduction } from '@/utils/env';
import { authManager } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Admin 인증 필수
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: '이 엔드포인트는 관리자 인증이 필요합니다.',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const session = authManager.validateBrowserToken(token);
    if (!session || !authManager.hasPermission(session.sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          message: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    // SECURITY: 민감한 정보 완전 제거 - 존재 여부만 확인
    const sanitizedEnv = {
      NODE_ENV: env.NODE_ENV,
      VERCEL_ENV: env.VERCEL_ENV,
      
      // 필수 환경변수 존재 여부만 확인 (값 노출 금지)
      hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseProjectId: !!env.SUPABASE_PROJECT_ID,
      
      hasGoogleAiKey: !!env.GOOGLE_AI_API_KEY,
      hasTavilyKey: !!env.TAVILY_API_KEY,
      hasGithubOAuth: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
      hasGithubToken: !!env.GITHUB_TOKEN,
      hasGcpProjectId: !!env.GCP_PROJECT_ID,
      
      // SECURITY: 민감한 데이터 미리보기 완전 제거
      // 개발/프로덕션 구분 없이 값 노출 금지
    };

    const diagnostics = {
      environment: {
        isProduction,
        isVercelProduction,
        nodeEnv: env.NODE_ENV,
        vercelEnv: env.VERCEL_ENV,
      },
      
      features,
      
      envStatus: sanitizedEnv,
      
      // AI API 관련 핵심 환경변수 체크
      aiReadiness: {
        localAiReady: features.supabase,
        googleAiReady: features.ai,
        searchReady: features.search,
        overallReady: features.supabase && (features.ai || features.search),
      },
      
      missingCritical: [
        ...(!features.supabase ? ['Supabase Database Connection'] : []),
        ...(!features.ai && !features.search ? ['AI Service (Google AI or Tavily)'] : []),
      ],
      
      timestamp: new Date().toISOString(),
      auditInfo: {
        accessedBy: session.userId,
        sessionId: session.sessionId,
        userRole: session.userRole,
      },
    };

    // 진단 결과에 따른 HTTP 상태 코드
    const hasAnyAiService = features.ai || features.search;
    const status = features.supabase && hasAnyAiService ? 200 : 503;
    
    const response = {
      success: status === 200,
      message: status === 200 
        ? 'All critical environment variables are configured'
        : 'Missing critical environment variables for AI functionality',
      diagnostics,
    };

    return NextResponse.json(response, { 
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Environment': isProduction ? 'production' : 'development',
        'X-AI-Ready': hasAnyAiService ? 'true' : 'false',
        'X-Access-Level': 'admin',
      }
    });

  } catch (error) {
    console.error('❌ Environment diagnostics error:', error);
    return NextResponse.json({
      success: false,
      error: 'Environment diagnostics failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  }
}

/**
 * 보안상의 이유로 POST/PUT/DELETE 방법은 허용하지 않음
 */
export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 });
}