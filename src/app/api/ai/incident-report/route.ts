/**
 * 🚨 자동 장애 보고서 API
 *
 * Phase 2: Auto Incident Report Backend (Cloud Run Proxy)
 * - Vercel: Thin Proxy Layer
 * - Cloud Run: AI Analysis & Report Generation
 *
 * 🔄 v5.84.0: Local Fallback Removed (Cloud Run dependency enforced)
 * 🔄 v5.84.1: withAICache 추가 (중복 호출 방지, 1시간 TTL)
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  type CacheableAIResponse,
  withAICache,
} from '@/lib/ai/cache/ai-response-cache';
import { executeWithCircuitBreakerAndFallback } from '@/lib/ai/circuit-breaker';
import { createFallbackResponse } from '@/lib/ai/fallback/ai-fallback-handler';
import { isCloudRunEnabled, proxyToCloudRun } from '@/lib/ai-proxy/proxy';
import { withAuth } from '@/lib/auth/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import debug from '@/utils/debug';

export const runtime = 'nodejs';

// Allow responses up to 60 seconds (Vercel Hobby: max 60s)
// Cloud Run handles AI processing, Vercel just proxies
export const maxDuration = 60;

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
 * POST handler - Proxy to Cloud Run with Circuit Breaker + Fallback + Cache
 *
 * @updated 2025-12-30 - Circuit Breaker 및 Fallback 적용
 * @updated 2026-01-04 - withAICache 추가 (1시간 TTL)
 */
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId } = body;
    const sessionId = body.sessionId ?? `incident_${serverId ?? 'system'}`;
    const cacheQuery = `${action}:${serverId ?? 'all'}:${body.severity ?? 'any'}`;

    // 1. Cloud Run 활성화 확인
    if (!isCloudRunEnabled()) {
      const fallback = createFallbackResponse('incident-report');
      return NextResponse.json(fallback);
    }

    // 2. 캐시를 통한 Cloud Run 프록시 호출 (Circuit Breaker + Fallback + Cache)
    debug.info(`[incident-report] Proxying action '${action}' to Cloud Run...`);

    const cacheResult = await withAICache<CacheableAIResponse>(
      sessionId,
      cacheQuery,
      // Fetcher: Circuit Breaker + Fallback 적용
      async () => {
        const result = await executeWithCircuitBreakerAndFallback<
          Record<string, unknown>
        >(
          'incident-report',
          async () => {
            const cloudRunResult = await proxyToCloudRun({
              path: '/api/ai/incident-report',
              method: 'POST',
              body,
              timeout: 30000,
            });

            if (!cloudRunResult.success || !cloudRunResult.data) {
              throw new Error(
                cloudRunResult.error ?? 'Cloud Run request failed'
              );
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
                    created_at:
                      reportData.created_at || new Date().toISOString(),
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
          () =>
            createFallbackResponse('incident-report') as Record<string, unknown>
        );

        return {
          success: true,
          ...result.data,
          _fallback: result.source === 'fallback',
        } as CacheableAIResponse;
      },
      'incident-report'
    );

    // 3. 응답 반환
    const responseData = cacheResult.data;
    const isFallback = (responseData as Record<string, unknown>)._fallback;

    if (cacheResult.cached) {
      debug.info('[incident-report] Cache HIT');
      return NextResponse.json(responseData, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    if (isFallback) {
      debug.info('[incident-report] Using fallback response');
      return NextResponse.json(
        {
          success: false,
          report: null,
          message:
            (responseData as Record<string, unknown>).message ||
            '보고서 생성 서비스가 일시적으로 불안정합니다.',
          source: 'fallback',
          retryAfter: 30000,
        },
        {
          headers: {
            'X-Fallback-Response': 'true',
            'X-Retry-After': '30000',
          },
        }
      );
    }

    debug.info('[incident-report] Cloud Run success');
    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    debug.error('Incident report proxy error:', error);

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
