/**
 * 📊 Google AI 서비스 상태 API (Cloud Run Proxy)
 *
 * GET /api/ai/google-ai/status
 *
 * v5.84.0: Cloud Run 프록시 전환 (Vercel Diet)
 * - 직접 Google AI API 호출 제거
 * - Cloud Run /health 엔드포인트 프록시
 * - 서버 측 5분 캐시 적용 (과도한 호출 방지)
 */

import { NextResponse } from 'next/server';
import type { GoogleAIStatus } from '@/hooks/api/useGoogleAIStatus';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';

// 서버 측 캐시 (5분 TTL)
let cachedStatus: GoogleAIStatus | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

// 🛡️ 기본 Google AI 상태 (fallback)
const getDefaultGoogleAIStatus = (): GoogleAIStatus => ({
  isEnabled: false,
  isConnected: false,
  apiKeyStatus: { primary: 'missing', secondary: 'missing' },
  primaryKeyConnected: false,
  secondaryKeyConnected: false,
  quotaStatus: {
    daily: { used: 0, limit: 1000, remaining: 1000 },
    perMinute: { used: 0, limit: 60, remaining: 60 },
  },
  lastHealthCheck: new Date().toISOString(),
  healthCheckStatus: 'unhealthy',
  model: process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash',
  features: { chat: false, embedding: false, vision: false },
  performance: { averageResponseTime: 0, successRate: 0, errorRate: 100 },
  activeKeySource: 'none',
});

export async function GET() {
  const now = Date.now();

  // 1. 캐시 확인 (5분 이내면 캐시 반환)
  if (cachedStatus && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cachedStatus,
      _cached: true,
      _cacheAge: Math.round((now - cacheTimestamp) / 1000),
    });
  }

  // 2. Cloud Run 비활성화 시 기본값 반환
  if (!isCloudRunEnabled()) {
    const defaultStatus = getDefaultGoogleAIStatus();
    return NextResponse.json({
      ...defaultStatus,
      _source: 'default (Cloud Run disabled)',
    });
  }

  // 3. Cloud Run /health 엔드포인트 프록시
  try {
    const startTime = Date.now();

    const healthResult = await proxyToCloudRun({
      path: '/health',
      method: 'GET',
      timeout: 5000, // 5초 타임아웃
    });

    const responseTime = Date.now() - startTime;
    const healthData = healthResult.data as { status?: string } | undefined;
    const isHealthy = healthResult.success && healthData?.status === 'ok';

    // 4. 상태 구성
    const status: GoogleAIStatus = {
      isEnabled: true,
      isConnected: isHealthy,
      apiKeyStatus: {
        primary: isHealthy ? 'valid' : 'missing',
        secondary: 'missing', // Cloud Run이 관리하므로 개별 키 상태 불명
      },
      primaryKeyConnected: isHealthy,
      secondaryKeyConnected: false,
      quotaStatus: {
        daily: { used: 0, limit: 1500, remaining: 1500 }, // Cloud Run 관리
        perMinute: { used: 0, limit: 60, remaining: 60 },
      },
      lastHealthCheck: new Date().toISOString(),
      healthCheckStatus: isHealthy ? 'healthy' : 'unhealthy',
      model: 'gemini-2.5-flash-lite', // Supervisor model
      features: {
        chat: isHealthy,
        embedding: isHealthy,
        vision: false,
      },
      performance: {
        averageResponseTime: responseTime,
        successRate: isHealthy ? 100 : 0,
        errorRate: isHealthy ? 0 : 100,
      },
      activeKeySource: isHealthy ? 'primary' : 'none',
    };

    // 5. 캐시 저장
    cachedStatus = status;
    cacheTimestamp = now;

    return NextResponse.json({
      ...status,
      _source: 'Cloud Run /health',
      _responseTime: responseTime,
    });
  } catch (error) {
    console.error('[google-ai-status] Cloud Run health check failed:', error);

    const fallbackStatus = getDefaultGoogleAIStatus();
    fallbackStatus.healthCheckStatus = 'unhealthy';

    return NextResponse.json(
      {
        ...fallbackStatus,
        _source: 'fallback (Cloud Run error)',
        _error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
