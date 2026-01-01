/**
 * 🚨 자동 장애 보고서 API
 *
 * Phase 2: Auto Incident Report Backend (Cloud Run Proxy)
 * - Vercel: Thin Proxy Layer
 * - Cloud Run: AI Analysis & Report Generation
 *
 * 🔄 v5.84.0: Local Fallback Removed (Cloud Run dependency enforced)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
 * POST handler - Proxy to Cloud Run with Circuit Breaker + Fallback
 *
 * @updated 2025-12-30 - Circuit Breaker 및 Fallback 적용
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Cloud Run 활성화 확인
    if (!isCloudRunEnabled()) {
      // Cloud Run 비활성화 시 폴백 응답 반환
      const fallback = createFallbackResponse('incident-report');
      return NextResponse.json(fallback);
    }

    // 2. Cloud Run 프록시 호출 (Circuit Breaker + Fallback)
    debug.info(`[incident-report] Proxying action '${action}' to Cloud Run...`);

    const result = await executeWithCircuitBreakerAndFallback<
      Record<string, unknown>
    >(
      'incident-report',
      // Primary: Cloud Run 호출
      async () => {
        const cloudRunResult = await proxyToCloudRun({
          path: '/api/ai/incident-report',
          method: 'POST',
          body,
          timeout: 30000,
        });

        if (!cloudRunResult.success || !cloudRunResult.data) {
          throw new Error(cloudRunResult.error ?? 'Cloud Run request failed');
        }

        const reportData = cloudRunResult.data as IncidentReport;

        // generate 액션인 경우 DB 저장 시도
        if (action === 'generate' && reportData.id) {
          try {
            const { error } = await supabaseAdmin
              .from('incident_reports')
              .insert({
                id: reportData.id,
                title: reportData.title,
                severity: reportData.severity,
                affected_servers: reportData.affected_servers || [],
                anomalies: reportData.anomalies || [],
                root_cause_analysis: reportData.root_cause_analysis || {},
                recommendations: reportData.recommendations || [],
                timeline: reportData.timeline || [],
                pattern: reportData.pattern || 'unknown',
                system_summary: reportData.system_summary || null,
                created_at: reportData.created_at || new Date().toISOString(),
              });

            if (error) {
              debug.error('DB save error (Cloud Run data):', error);
            }
          } catch (dbError) {
            debug.error('DB connection error:', dbError);
          }
        }

        return {
          success: true,
          report: {
            ...cloudRunResult.data,
            _source: 'Cloud Run AI Engine',
          },
        };
      },
      // Fallback: 로컬 폴백 응답
      () => createFallbackResponse('incident-report') as Record<string, unknown>
    );

    // 3. 응답 반환
    if (result.source === 'fallback') {
      debug.info('[incident-report] Using fallback response');
      return NextResponse.json(result.data, {
        headers: {
          'X-Fallback-Response': 'true',
          'X-Retry-After': '30000',
        },
      });
    }

    debug.info('[incident-report] Cloud Run success');
    return NextResponse.json(result.data);
  } catch (error) {
    debug.error('Incident report proxy error:', error);

    // 예상치 못한 에러 시에도 폴백 반환
    const fallback = createFallbackResponse('incident-report');
    return NextResponse.json(fallback, {
      headers: {
        'X-Fallback-Response': 'true',
        'X-Error': error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * GET handler - Read Only (DB or Proxy)
 */
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 특정 보고서 조회
      const { data, error } = await supabaseAdmin
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
      const { data: reports, error } = await supabaseAdmin
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
