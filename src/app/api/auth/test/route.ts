/**
 * 🧪 GitHub OAuth 및 Supabase Auth 테스트 API
 *
 * 활성화된 GitHub OAuth가 올바르게 작동하는지 검증
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // 🚫 개발 환경에서만 접근 허용
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are not available in production' },
      { status: 404 }
    );
  }

  try {
    console.log('🧪 Supabase Auth 설정 테스트 시작...');

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 환경변수가 설정되지 않음',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
          },
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Supabase 연결 테스트
    console.log('📡 Supabase 연결 테스트...');
    const { data: _connectionTest, error: connectionError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1);

    const connectionStatus = !connectionError;
    console.log('📡 연결 상태:', connectionStatus ? '✅ 성공' : '❌ 실패');

    // 2. Auth 설정 확인 (auth.users 테이블 접근 테스트)
    console.log('🔐 Auth 스키마 접근 테스트...');
    const { data: authTest, error: authError } =
      await supabase.auth.getSession();

    // 3. GitHub OAuth URL 생성 테스트
    console.log('🐙 GitHub OAuth URL 생성 테스트...');
    const { data: oauthData, error: oauthError } =
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${request.headers.get('origin') || `https://${request.headers.get('host')}`}/auth/callback`,
          scopes: 'read:user user:email',
        },
      });

    const testResults = {
      timestamp: new Date().toISOString(),
      supabase: {
        url: supabaseUrl,
        connection: connectionStatus,
        connectionError: connectionError?.message || null,
      },
      auth: {
        configured: !authError,
        error: authError?.message || null,
        session: !!authTest.session,
      },
      githubOAuth: {
        urlGenerated: !!oauthData?.url,
        error: oauthError?.message || null,
        redirectUrl: oauthData?.url || null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        domain: request.headers.get('origin') || request.headers.get('host') || '',
      },
    };

    console.log('🧪 테스트 결과:', testResults);

    // 전체 성공 여부 판단
    const allSystemsOperational =
      connectionStatus && !authError && !!oauthData?.url && !oauthError;

    return NextResponse.json({
      success: allSystemsOperational,
      message: allSystemsOperational
        ? '✅ 모든 인증 시스템이 정상 작동합니다!'
        : '⚠️ 일부 시스템에 문제가 발견되었습니다.',
      data: testResults,
      recommendations: !allSystemsOperational
        ? [
            !connectionStatus && '📡 Supabase 연결 확인 필요',
            authError && '🔐 Auth 설정 확인 필요',
            oauthError && '🐙 GitHub OAuth Provider 설정 확인 필요',
          ].filter(Boolean)
        : ['🎉 모든 시스템이 정상입니다!'],
    });
  } catch (error) {
    console.error('💥 Auth 테스트 중 예상치 못한 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Auth 테스트 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 POST: GitHub OAuth 설정 상세 진단
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'full' } = body;

    console.log('🔬 GitHub OAuth 상세 진단 시작...', testType);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      testType,
    };

    // GitHub OAuth 제공자 설정 테스트
    if (testType === 'full' || testType === 'oauth') {
      console.log('🐙 GitHub OAuth 상세 설정 확인...');

      try {
        // OAuth URL 생성 및 검증
        const { data: oauthData, error: oauthError } =
          await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: `${request.headers.get('origin') || `https://${request.headers.get('host')}`}/auth/callback`,
              scopes: 'read:user user:email',
              queryParams: {
                prompt: 'consent',
              },
            },
          });

        diagnostics.github = {
          success: !oauthError,
          url: oauthData?.url,
          error: oauthError?.message,
          provider: oauthData?.provider,
        };

        // URL 구조 분석
        if (oauthData?.url) {
          const url = new URL(oauthData.url);
          diagnostics.github.urlAnalysis = {
            domain: url.hostname,
            hasClientId: url.searchParams.has('client_id'),
            hasRedirectUri: url.searchParams.has('redirect_uri'),
            hasScopes: url.searchParams.has('scope'),
            redirectUri: url.searchParams.get('redirect_uri'),
            scopes: url.searchParams.get('scope'),
            state: url.searchParams.get('state'),
          };
        }
      } catch (oauthTestError) {
        diagnostics.github = {
          success: false,
          error:
            oauthTestError instanceof Error
              ? oauthTestError.message
              : 'Unknown OAuth error',
        };
      }
    }

    // Auth 스키마 및 정책 테스트
    if (testType === 'full' || testType === 'auth') {
      console.log('🔐 Auth 스키마 및 정책 확인...');

      try {
        const { data: _userCount, error: userError } = await supabase
          .from('auth.users')
          .select('count(*)', { count: 'exact' });

        diagnostics.authSchema = {
          success: !userError,
          error: userError?.message,
          canAccessAuthTable: !userError,
        };
      } catch (authSchemaError) {
        diagnostics.authSchema = {
          success: false,
          error:
            authSchemaError instanceof Error
              ? authSchemaError.message
              : 'Auth schema access error',
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: '🔬 GitHub OAuth 상세 진단 완료',
      diagnostics,
    });
  } catch (error) {
    console.error('💥 OAuth 진단 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'OAuth 진단 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
