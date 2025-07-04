/**
 * 📊 데이터 생성기 상태 조회 API - GCP Functions 버전
 *
 * GCP Functions 기반 메트릭 생성기 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';

// 🎯 GCP Functions 설정
const GCP_FUNCTIONS_BASE_URL =
  process.env.GCP_FUNCTIONS_BASE_URL ||
  'https://us-central1-openmanager-vibe-v5.cloudfunctions.net';
const ENTERPRISE_METRICS_ENDPOINT = `${GCP_FUNCTIONS_BASE_URL}/enterprise-metrics`;

/**
 * 🌐 GCP Functions 상태 확인
 */
async function checkGCPFunctionsStatus(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  metricsCount: number;
}> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${ENTERPRISE_METRICS_ENDPOINT}?action=health`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const result = await response.json();
      return {
        isHealthy: true,
        responseTime,
        metricsCount: result.data?.metrics?.length || 0,
      };
    } else {
      return {
        isHealthy: false,
        responseTime,
        metricsCount: 0,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.warn('⚠️ GCP Functions 상태 확인 실패:', error);
    return {
      isHealthy: false,
      responseTime,
      metricsCount: 0,
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 🚀 GCP Functions 상태 확인
    const gcpStatus = await checkGCPFunctionsStatus();
    const responseTime = Date.now() - startTime;

    // 🚀 최적화된 응답 구조
    const optimizedResponse = {
      success: true,
      data: {
        isInitialized: true, // GCP Functions는 항상 초기화 상태
        isRunning: gcpStatus.isHealthy,
        serverCount: gcpStatus.metricsCount,
        lastUpdate: new Date().toISOString(),
        uptime: 'always_on', // 서버리스는 항상 가동
        dataSource: 'gcp_functions',
        endpoint: ENTERPRISE_METRICS_ENDPOINT,
        // 🔥 성능 메트릭
        performance: {
          responseTime,
          gcpResponseTime: gcpStatus.responseTime,
          healthy: gcpStatus.isHealthy,
          quickLoad: responseTime < 100, // 100ms 이하면 빠른 로드
        },
      },
      timestamp: new Date().toISOString(),
      responseTime,
    };

    console.log(`📊 GCP Functions 상태 조회 완료 (${responseTime}ms)`);

    return NextResponse.json(optimizedResponse);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ GCP Functions 상태 조회 실패:', error);

    // 🚀 에러 시에도 기본 상태 반환 (폴백)
    return NextResponse.json(
      {
        success: false,
        data: {
          isInitialized: true,
          isRunning: false,
          serverCount: 0,
          lastUpdate: new Date().toISOString(),
          uptime: 'unknown',
          dataSource: 'gcp_functions_error',
          endpoint: ENTERPRISE_METRICS_ENDPOINT,
          performance: {
            responseTime,
            gcpResponseTime: 0,
            healthy: false,
            quickLoad: false,
          },
        },
        error:
          error instanceof Error
            ? error.message
            : 'GCP Functions 상태 조회 실패',
        timestamp: new Date().toISOString(),
        responseTime,
      },
      { status: 200 }
    ); // 🚀 에러여도 200 응답으로 폴백 처리
  }
}
