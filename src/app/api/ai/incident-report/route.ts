/**
 * 🚨 자동 장애 보고서 API
 *
 * Phase 2: Auto Incident Report Backend (Cloud Run Proxy)
 * - Vercel: Thin Proxy Layer
 * - Cloud Run: AI Analysis & Report Generation (LangGraph)
 *
 * 🔄 v5.84.0: Local Fallback Removed (Cloud Run dependency enforced)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

// Types (Minimal for response typing)
interface IncidentReport {
  id: string;
  title: string;
  severity: string;
  created_at: string;
  affected_servers?: unknown[];
  anomalies?: unknown[];
  root_cause_analysis?: unknown;
  recommendations?: unknown[];
  timeline?: unknown[];
  pattern?: string;
  [key: string]: unknown;
}

/**
 * POST handler - Proxy to Cloud Run
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Cloud Run 활성화 확인
    if (!isCloudRunEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloud Run AI Engine is not enabled',
          message: 'AI 서비스가 활성화되지 않았습니다. 관리자에게 문의하세요.',
        },
        { status: 503 }
      );
    }

    // 2. Cloud Run 프록시 호출 (LangGraph Reporter Agent)
    debug.info(`[incident-report] Proxying action '${action}' to Cloud Run...`);

    const cloudRunResult = await proxyToCloudRun({
      path: '/api/ai/incident-report',
      method: 'POST',
      body, // Pass original body
      timeout: 30000, // 30s timeout for AI analysis
    });

    if (cloudRunResult.success && cloudRunResult.data) {
      debug.info('[incident-report] Cloud Run success');

      // DB 저장 등 추가 작업이 필요한 경우 여기서 처리 (Optionally)
      // 현재는 Cloud Run이 분석 결과만 반환하고 저장은 각자 알아서 하는 구조라면 유지
      // 만약 Cloud Run이 저장까지 안 한다면 Vercel에서 저장해야 할 수도 있음.
      // 기존 로직: Vercel에서 DB 저장했음.
      // 유지보수성을 위해 DB 저장은 유지하되, 분석 데이터는 Cloud Run에서 가져옴.

      const reportData = cloudRunResult.data as IncidentReport;

      // generate 액션인 경우 DB 저장 시도
      if (action === 'generate' && reportData.id) {
        try {
          const supabase = await createClient();
          const { error } = await supabase.from('incident_reports').insert({
            id: reportData.id,
            title: reportData.title,
            severity: reportData.severity,
            affected_servers: reportData.affected_servers || [],
            anomalies: reportData.anomalies || [],
            root_cause_analysis: reportData.root_cause_analysis || {},
            recommendations: reportData.recommendations || [],
            timeline: reportData.timeline || [],
            pattern: reportData.pattern || 'unknown',
            created_at: reportData.created_at || new Date().toISOString(),
          });

          if (error) {
            debug.error('DB save error (Cloud Run data):', error);
            // 에러가 나도 분석 결과는 반환
          }
        } catch (dbError) {
          debug.error('DB connection error:', dbError);
        }
      }

      return NextResponse.json({
        success: true,
        ...cloudRunResult.data,
        _source: 'Cloud Run LangGraph',
      });
    }

    // 3. Cloud Run 실패 시 에러 반환 (No Local Fallback)
    debug.error('[incident-report] Cloud Run failed:', cloudRunResult.error);

    return NextResponse.json(
      {
        success: false,
        error: 'AI Analysis Failed',
        message: 'AI 엔진 응답에 실패했습니다. 잠시 후 다시 시도해주세요.',
        details: cloudRunResult.error,
      },
      { status: 503 }
    );
  } catch (error) {
    debug.error('Incident report proxy error:', error);
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
 * GET handler - Read Only (DB or Proxy)
 */
async function getHandler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 특정 보고서 조회
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        report: data,
        timestamp: new Date().toISOString(),
      });
    } else {
      // 최근 보고서 목록
      const { data: reports, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        reports: reports || [],
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    debug.error('Get incident reports error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve reports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export with authentication
export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
