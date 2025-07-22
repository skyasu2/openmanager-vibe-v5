/**
 * 🔍 GitHub OAuth 디버깅 API
 *
 * 현재 설정 상태와 문제점을 진단합니다.
 */

import { supabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 현재 환경 정보
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      urls: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        currentOrigin: request.nextUrl.origin,
      },
      github: {
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
          ? 'SET'
          : 'MISSING',
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      },
      expectedUrls: {
        githubCallback: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        appCallback: `${request.nextUrl.origin}/auth/callback`,
        loginPage: `${request.nextUrl.origin}/login`,
        mainPage: `${request.nextUrl.origin}/main`,
      },
    };

    // Supabase 연결 테스트
    let supabaseStatus = 'unknown';
    try {
      const { data: _data, error } = await supabase.auth.getSession();
      supabaseStatus = error ? `error: ${error.message}` : 'connected';
    } catch (err) {
      supabaseStatus = `connection_failed: ${err}`;
    }

    return NextResponse.json({
      status: 'debug_info',
      supabaseStatus,
      ...debugInfo,
      recommendations: [
        'GitHub OAuth App callback URL should be: ' +
          debugInfo.expectedUrls.githubCallback,
        'Supabase redirect URLs should include: ' +
          debugInfo.expectedUrls.appCallback,
        'Check if all environment variables are properly set',
        'Verify Supabase project URL matches the one in GitHub OAuth settings',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
