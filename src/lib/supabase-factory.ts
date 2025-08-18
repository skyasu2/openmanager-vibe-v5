/**
 * 🏭 Supabase Client Factory
 *
 * 중복 코드 제거를 위한 통합 팩토리
 * 기존 singleton 분리 구조를 존중하면서 일관된 접근점 제공
 *
 * 사용 케이스별 분리:
 * - Client: 브라우저/클라이언트 사이드 (getSupabaseClient)
 * - Admin: 서버 사이드 admin (getSupabaseAdmin)
 * - Middleware: 미들웨어 쿠키 기반 (createMiddlewareSupabaseClient)
 * - Script: 스크립트용 admin (getSupabaseForScript)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';

// 기존 singleton들 import (의도적 분리 존중)
import { getSupabaseClient } from './supabase-singleton';
import { supabaseAdmin } from './supabase-server';
import { createMiddlewareSupabaseClient } from './supabase-middleware';

// 환경 타입 정의
export type SupabaseEnvironment = 'client' | 'server' | 'middleware' | 'script';

export interface SupabaseFactoryOptions {
  environment: SupabaseEnvironment;
  serviceRoleKey?: string;
  request?: NextRequest;
  response?: NextResponse;
}

/**
 * 🎯 메인 팩토리 함수 - 환경에 따른 적절한 클라이언트 반환
 */
export function createSupabaseClient(
  options: SupabaseFactoryOptions
): SupabaseClient {
  switch (options.environment) {
    case 'client':
      return getSupabaseClient();

    case 'server':
      return supabaseAdmin;

    case 'middleware':
      if (!options.request || !options.response) {
        throw new Error(
          'Middleware environment requires request and response objects'
        );
      }
      return createMiddlewareSupabaseClient(options.request, options.response);

    case 'script':
      return getSupabaseForScript(options.serviceRoleKey);

    default:
      throw new Error(`Unknown Supabase environment: ${options.environment}`);
  }
}

/**
 * 📜 스크립트용 Supabase 클라이언트 (Node.js 환경)
 */
function getSupabaseForScript(serviceRoleKey?: string): SupabaseClient {
  // 스크립트 전용 캐싱 (프로세스당 1회만 생성)
  if (global.__supabaseScriptInstance) {
    return global.__supabaseScriptInstance;
  }

  const { createClient } = require('@supabase/supabase-js');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for scripts'
    );
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-openmanager-version': 'v5.0-script',
      },
    },
  });

  // 전역 캐싱
  global.__supabaseScriptInstance = client;

  console.log('✅ Supabase Script 클라이언트 생성 완료');
  return client;
}

// 편의 함수들 - 기존 코드 호환성 유지

/**
 * 🌐 클라이언트 사이드용 (기존 singleton 사용)
 */
export function getClientSupabase(): SupabaseClient {
  return createSupabaseClient({ environment: 'client' });
}

/**
 * 🔐 서버 사이드 admin용 (기존 singleton 사용)
 */
export function getServerSupabase(): SupabaseClient {
  return createSupabaseClient({ environment: 'server' });
}

/**
 * 📜 스크립트용 (새로운 singleton)
 */
export function getScriptSupabase(serviceRoleKey?: string): SupabaseClient {
  return createSupabaseClient({
    environment: 'script',
    serviceRoleKey,
  });
}

/**
 * 🍪 미들웨어용 (매번 새로 생성 - 쿠키 의존적)
 */
export function getMiddlewareSupabase(
  request: NextRequest,
  response: NextResponse
): SupabaseClient {
  return createSupabaseClient({
    environment: 'middleware',
    request,
    response,
  });
}

// TypeScript 글로벌 타입 확장
declare global {
  var __supabaseScriptInstance: SupabaseClient | undefined;
}

// 사용 가이드를 위한 타입 export
export type { SupabaseEnvironment, SupabaseFactoryOptions };

// 기존 클라이언트들도 re-export (호환성)
export {
  getSupabaseClient, // from supabase-singleton
  supabaseAdmin, // from supabase-server
  createMiddlewareSupabaseClient, // from supabase-middleware
};
