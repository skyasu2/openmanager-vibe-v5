/**
 * 🔍 환경변수 진단 API
 * 
 * Vercel 프로덕션 환경에서 AI API 실패 문제 해결을 위한
 * 환경변수 상태 진단 엔드포인트
 * 
 * GET /api/debug/env
 */

import { NextResponse } from 'next/server';
import { env, features, isProduction, isVercelProduction } from '@/utils/env';

export async function GET() {
  try {
    // 프로덕션에서는 민감한 정보 숨김
    const sanitizedEnv = {
      NODE_ENV: env.NODE_ENV,
      VERCEL_ENV: env.VERCEL_ENV,
      
      // 필수 환경변수 존재 여부만 확인
      hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseProjectId: !!env.SUPABASE_PROJECT_ID,
      
      hasGoogleAiKey: !!env.GOOGLE_AI_API_KEY,
      hasTavilyKey: !!env.TAVILY_API_KEY,
      hasGithubOAuth: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
      hasGithubToken: !!env.GITHUB_TOKEN,
      hasGcpProjectId: !!env.GCP_PROJECT_ID,
      
      // 개발 환경에서만 실제 값 표시 (앞 10자만)
      ...(isProduction ? {} : {
        supabaseUrlPreview: env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        googleAiKeyPreview: env.GOOGLE_AI_API_KEY?.substring(0, 10) + '...',
        gcpProjectId: env.GCP_PROJECT_ID,
      }),
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
        localAiReady: features.supabase, // 로컬 AI는 Supabase 기반
        googleAiReady: features.ai, // Google AI는 API 키 필요
        searchReady: features.search, // 검색은 Tavily 기반
        overallReady: features.supabase && (features.ai || features.search),
      },
      
      missingCritical: [
        ...(!features.supabase ? ['Supabase Database Connection'] : []),
        ...(!features.ai && !features.search ? ['AI Service (Google AI or Tavily)'] : []),
      ],
      
      timestamp: new Date().toISOString(),
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
        'Cache-Control': 'no-store', // 환경변수 상태는 캐시하지 않음
        'X-Environment': isProduction ? 'production' : 'development',
        'X-AI-Ready': hasAnyAiService ? 'true' : 'false',
      }
    });

  } catch (error) {
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