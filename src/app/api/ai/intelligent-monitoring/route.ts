/**
 * 🧠 지능형 모니터링 API
 *
 * Phase 3: Intelligent Monitoring Backend (Cloud Run Proxy)
 * - Vercel: Thin Proxy Layer
 * - Cloud Run: Trend Prediction & Anomaly Detection
 *
 * 🔄 v5.84.0: Local Fallback Removed (Pure Proxy)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

/**
 * POST handler - Proxy to Cloud Run with Circuit Breaker + Fallback
 *
 * @updated 2025-12-30 - Circuit Breaker 및 Fallback 적용
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId } = body;

    // 1. Cloud Run 활성화 확인
    if (!isCloudRunEnabled()) {
      // Cloud Run 비활성화 시 폴백 응답 반환
      const fallback = createFallbackResponse('intelligent-monitoring');
      return NextResponse.json(fallback);
    }

    // 2. Cloud Run 프록시 호출 (Circuit Breaker + Fallback)
    let cloudRunPath = '/api/ai/analyze-server';
    if (action === 'predict') cloudRunPath = '/api/ai/analyze-server';
    if (action === 'forecast_anomalies')
      cloudRunPath = '/api/ai/analyze-server';

    debug.info(
      `[intelligent-monitoring] Proxying action '${action}' for ${serverId} to Cloud Run...`
    );

    const result = await executeWithCircuitBreakerAndFallback<
      Record<string, unknown>
    >(
      'intelligent-monitoring',
      // Primary: Cloud Run 호출
      async () => {
        const cloudRunResult = await proxyToCloudRun({
          path: cloudRunPath,
          method: 'POST',
          body: {
            ...body,
            analysisType: body.analysisDepth || 'full',
          },
          timeout: 15000,
        });

        if (!cloudRunResult.success || !cloudRunResult.data) {
          throw new Error(cloudRunResult.error ?? 'Cloud Run request failed');
        }

        return {
          success: true,
          data: cloudRunResult.data,
          _source: 'Cloud Run AI Engine',
        };
      },
      // Fallback: 로컬 폴백 응답
      () =>
        createFallbackResponse('intelligent-monitoring') as Record<
          string,
          unknown
        >
    );

    // 3. 응답 반환
    if (result.source === 'fallback') {
      debug.info('[intelligent-monitoring] Using fallback response');
      return NextResponse.json(result.data, {
        headers: {
          'X-Fallback-Response': 'true',
          'X-Retry-After': '30000',
        },
      });
    }

    debug.info('[intelligent-monitoring] Cloud Run success');
    return NextResponse.json(result.data);
  } catch (error) {
    debug.error('Intelligent monitoring proxy error:', error);

    // 예상치 못한 에러 시에도 폴백 반환
    const fallback = createFallbackResponse('intelligent-monitoring');
    return NextResponse.json(fallback, {
      headers: {
        'X-Fallback-Response': 'true',
        'X-Error': error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * GET handler - Service Status
 */
async function getHandler(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    status: 'active',
    mode: 'cloud-run-proxy',
    timestamp: new Date().toISOString(),
    service: 'intelligent-monitoring',
    capabilities: {
      predictive_alerts: true,
      anomaly_forecasting: true,
      intelligent_analysis: true,
    },
  });
}

// Export with authentication
export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
