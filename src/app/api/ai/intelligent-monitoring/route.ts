/**
 * 🧠 지능형 모니터링 API
 *
 * Phase 3: Intelligent Monitoring Backend (Cloud Run Proxy)
 * - Vercel: Thin Proxy Layer
 * - Cloud Run: Trend Prediction & Anomaly Detection (Rust/LangGraph)
 *
 * 🔄 v5.84.0: Local Fallback Removed (Pure Proxy)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

/**
 * POST handler - Proxy to Cloud Run
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId } = body;

    // 1. Cloud Run 활성화 확인
    if (!isCloudRunEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloud Run AI Engine is not enabled',
          message: '지능형 모니터링 서비스가 활성화되지 않았습니다.',
        },
        { status: 503 }
      );
    }

    // 2. Cloud Run 프록시 호출
    // analyze_server, predict, forecast 등 모든 액션을 Cloud Run으로 위임
    let cloudRunPath = '/api/ai/analyze-server'; // 기본 엔드포인트

    // 액션별 경로 매핑 (필요 시 확장)
    if (action === 'predict') cloudRunPath = '/api/ai/analyze-server';
    if (action === 'forecast_anomalies')
      cloudRunPath = '/api/ai/analyze-server';

    debug.info(
      `[intelligent-monitoring] Proxying action '${action}' for ${serverId} to Cloud Run...`
    );

    const cloudRunResult = await proxyToCloudRun({
      path: cloudRunPath,
      method: 'POST',
      body: {
        ...body,
        analysisType: body.analysisDepth || 'full', // Cloud Run 포맷 호환
      },
      timeout: 15000,
    });

    if (cloudRunResult.success && cloudRunResult.data) {
      debug.info('[intelligent-monitoring] Cloud Run success');

      // Cloud Run 응답 그대로 반환 (프론트엔드가 Cloud Run 응답 구조를 처리하도록 맞춰져 있어야 함)
      // 기존 route.ts에서는 Cloud Run 응답을 Vercel 포맷으로 매핑해주었음.
      // 호환성을 위해 최소한의 구조는 맞춰줄 수 있음.

      return NextResponse.json({
        success: true,
        data: cloudRunResult.data, // Cloud Run raw data (or mapped if needed)
        _source: 'Cloud Run LangGraph',
      });
    }

    // 3. Fallback 없음 -> 에러 반환
    debug.error(
      '[intelligent-monitoring] Cloud Run failed:',
      cloudRunResult.error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'AI Analysis Failed',
        message: '분석 요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
        details: cloudRunResult.error,
      },
      { status: 503 }
    );
  } catch (error) {
    debug.error('Intelligent monitoring proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
