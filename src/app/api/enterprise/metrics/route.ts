/**
 * 🏢 엔터프라이즈 메트릭 API v3.0 - GCP Functions 프록시
 *
 * Vercel → GCP Functions 완전 전환
 * 25개 핵심 메트릭을 GCP Functions에서 생성하고 프록시 역할만 수행
 */

import { GCP_FUNCTIONS_CONFIG } from '@/config/gcp-functions';
import { NextRequest, NextResponse } from 'next/server';

// 🎯 GCP Functions 설정
const ENTERPRISE_METRICS_ENDPOINT = GCP_FUNCTIONS_CONFIG.ENTERPRISE_METRICS;

// 🔧 HTTP 요청 타임아웃 설정
const REQUEST_TIMEOUT = 15000; // 15초

/**
 * 🌐 GCP Functions 요청 헬퍼
 */
async function callGCPFunction(
  method: 'GET' | 'POST',
  searchParams?: URLSearchParams,
  body?: any
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = searchParams
      ? `${ENTERPRISE_METRICS_ENDPOINT}?${searchParams.toString()}`
      : ENTERPRISE_METRICS_ENDPOINT;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-Vibe-v5/3.0',
        'X-Forwarded-For': 'vercel-proxy',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `GCP Functions 응답 오류: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('GCP Functions 요청 타임아웃');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 🎯 GET /api/enterprise/metrics
 * GCP Functions 프록시 - 메트릭 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 모든 쿼리 파라미터를 GCP Functions로 전달
    const gcpResponse = await callGCPFunction('GET', searchParams);

    // GCP Functions 응답에 프록시 정보 추가
    return NextResponse.json({
      ...gcpResponse,
      proxy: {
        source: 'vercel-proxy',
        target: 'gcp-functions',
        version: '3.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GCP Functions 프록시 오류 (GET):', error);

    // 🚨 GCP Functions 장애 시 폴백 응답
    return NextResponse.json(
      {
        success: false,
        error: 'GCP Functions 연결 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        fallback: {
          message: 'GCP Functions가 일시적으로 사용할 수 없습니다',
          action: 'retry',
          retryAfter: 30,
        },
        proxy: {
          source: 'vercel-proxy',
          target: 'gcp-functions',
          version: '3.0',
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}

/**
 * 🎯 POST /api/enterprise/metrics
 * GCP Functions 프록시 - 메트릭 생성기 제어
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // POST 요청을 GCP Functions로 전달
    const gcpResponse = await callGCPFunction('POST', undefined, body);

    // GCP Functions 응답에 프록시 정보 추가
    return NextResponse.json({
      ...gcpResponse,
      proxy: {
        source: 'vercel-proxy',
        target: 'gcp-functions',
        version: '3.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GCP Functions 프록시 오류 (POST):', error);

    // 🚨 GCP Functions 장애 시 폴백 응답
    return NextResponse.json(
      {
        success: false,
        error: 'GCP Functions 연결 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        fallback: {
          message: 'GCP Functions가 일시적으로 사용할 수 없습니다',
          action: 'retry',
          retryAfter: 30,
        },
        proxy: {
          source: 'vercel-proxy',
          target: 'gcp-functions',
          version: '3.0',
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}

/**
 * 🎯 OPTIONS /api/enterprise/metrics
 * CORS 헤더 처리
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}
