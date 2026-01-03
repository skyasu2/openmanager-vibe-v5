/**
 * AI Job Queue API - Job 생성 및 목록 조회
 *
 * POST /api/ai/jobs - 새 Job 생성
 * GET /api/ai/jobs - Job 목록 조회
 *
 * @version 1.2.0 - Rate Limiting 추가 (2026-01-03)
 */

import { createClient } from '@supabase/supabase-js';
import { after, type NextRequest, NextResponse } from 'next/server';
import {
  analyzeQueryComplexity,
  inferJobType,
} from '@/lib/ai/job-queue/complexity-analyzer';
import { redisSet } from '@/lib/redis';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';
import type {
  AIJob,
  CreateJobRequest,
  CreateJobResponse,
  JobListResponse,
  JobStatusResponse,
  TriggerStatus,
} from '@/types/ai-jobs';

// ============================================
// 상수 정의
// ============================================

/** Cloud Run 트리거 타임아웃 (ms) */
const TRIGGER_TIMEOUT_MS = 5000;

// Supabase 클라이언트 생성
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// POST /api/ai/jobs - Job 생성 (Rate Limited)
// ============================================

async function handlePOST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateJobRequest;
    const { query, options } = body;

    // 입력 검증
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 복잡도 분석
    const complexity = analyzeQueryComplexity(query);

    // 간단한 쿼리는 Job Queue 없이 처리 권장 (클라이언트에서 결정)
    // 여기서는 항상 Job 생성 (클라이언트가 이미 결정함)

    // Job 타입 자동 추론 (명시되지 않은 경우)
    const jobType = body.type || inferJobType(query);

    const supabase = getSupabaseClient();

    // Job 생성
    const { data: job, error } = await supabase
      .from('ai_jobs')
      .insert({
        type: jobType,
        query: query.trim(),
        priority: options?.priority || 'normal',
        session_id: options?.sessionId || null,
        status: 'queued',
        progress: 0,
        metadata: {
          complexity: complexity.level,
          estimatedTime: complexity.estimatedTime,
          factors: complexity.factors,
          ...options?.metadata,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[AI Jobs] Failed to create job:', error);
      return NextResponse.json(
        { error: 'Failed to create job', details: error.message },
        { status: 500 }
      );
    }

    // Redis에 초기 상태 저장 (SSE 스트림에서 폴링하기 위함)
    // Redis 장애 시에도 Job 생성은 계속 진행 (Graceful Degradation)
    try {
      await redisSet(
        `job:${job.id}`,
        {
          status: 'pending',
          startedAt: new Date().toISOString(),
        },
        300 // 5분 TTL
      );

      // 초기 진행률 저장
      await redisSet(
        `job:progress:${job.id}`,
        {
          stage: 'initializing',
          progress: 5,
          message: 'AI 에이전트 초기화 중...',
          updatedAt: new Date().toISOString(),
        },
        300
      );
    } catch (redisError) {
      // Redis 장애 시 경고만 남기고 계속 진행
      // SSE 스트림은 폴링 API로 폴백됨
      console.warn(
        '[AI Jobs] Redis initial state failed, SSE may use polling fallback:',
        redisError
      );
    }

    // Cloud Run Worker에 Job 처리 요청 (타임아웃 적용)
    const triggerResult = await triggerWorker(
      job.id,
      query,
      jobType,
      options?.sessionId
    );

    // 비동기 로깅 (응답 차단 안함)
    after(async () => {
      await logJobCreation(
        job.id,
        jobType,
        triggerResult.status,
        complexity.level
      );
    });

    const response: CreateJobResponse = {
      jobId: job.id,
      status: 'queued',
      pollUrl: `/api/ai/jobs/${job.id}`,
      estimatedTime: complexity.estimatedTime,
      triggerStatus: triggerResult.status,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[AI Jobs] Error creating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Rate Limiting 적용
export const POST = withRateLimit(rateLimiters.aiAnalysis, handlePOST);

// ============================================
// GET /api/ai/jobs - Job 목록 조회 (Rate Limited)
// ============================================

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = getSupabaseClient();

    let query = supabase
      .from('ai_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, count, error } = await query;

    if (error) {
      console.error('[AI Jobs] Failed to list jobs:', error);
      return NextResponse.json(
        { error: 'Failed to list jobs' },
        { status: 500 }
      );
    }

    const response: JobListResponse = {
      jobs: (jobs || []).map(mapJobToResponse),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AI Jobs] Error listing jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Rate Limiting 적용
export const GET = withRateLimit(rateLimiters.default, handleGET);

// ============================================
// 헬퍼 함수
// ============================================

/**
 * DB Job 엔티티를 API 응답 형식으로 변환
 */
function mapJobToResponse(job: AIJob): JobStatusResponse {
  return {
    jobId: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    currentStep: job.current_step,
    result: job.result,
    error: job.error,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  };
}

// ============================================
// Worker 트리거 관련
// ============================================

interface TriggerResult {
  status: TriggerStatus;
  responseTime?: number;
  error?: string;
}

/**
 * Cloud Run Worker에 Job 처리 요청 (타임아웃 적용)
 *
 * @description
 * - AbortController로 타임아웃 관리 (기본 5초)
 * - 응답 지연 시 클라이언트는 SSE 폴링으로 폴백
 * - Vercel Serverless에서는 반드시 await 필요 (fire-and-forget 불가)
 */
async function triggerWorker(
  jobId: string,
  query: string,
  type: string,
  sessionId?: string
): Promise<TriggerResult> {
  const cloudRunUrl = process.env.CLOUD_RUN_AI_URL;
  const apiSecret = process.env.CLOUD_RUN_API_SECRET;

  if (!cloudRunUrl) {
    console.warn('[AI Jobs] CLOUD_RUN_AI_URL not configured');
    return { status: 'skipped', error: 'URL not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRIGGER_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const res = await fetch(`${cloudRunUrl}/api/jobs/process`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(apiSecret && { 'X-API-Key': apiSecret }),
      },
      body: JSON.stringify({
        jobId,
        messages: [{ role: 'user', content: query }],
        sessionId,
        type,
      }),
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`[AI Jobs] Worker ${res.status}: ${errorText}`);

      if (res.status === 401) {
        console.error('[AI Jobs] ⚠️ API key issue - check CLOUD_RUN_API_SECRET');
      }

      return { status: 'failed', responseTime, error: `HTTP ${res.status}` };
    }

    console.log(`[AI Jobs] Worker triggered: ${jobId} (${responseTime}ms)`);
    return { status: 'sent', responseTime };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(
        `[AI Jobs] Trigger timeout: ${jobId} (${TRIGGER_TIMEOUT_MS}ms)`
      );
      return { status: 'timeout', responseTime, error: 'Request timeout' };
    }

    console.error('[AI Jobs] Trigger error:', error);
    return {
      status: 'failed',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Job 생성 로깅 (after()에서 호출)
 *
 * @description 응답 후 비동기 실행 - 분석/모니터링용
 */
async function logJobCreation(
  jobId: string,
  jobType: string,
  triggerStatus: TriggerStatus,
  complexityLevel: string
): Promise<void> {
  try {
    // 추후 분석용 로그 (Vercel Logs, Datadog 등)
    console.log(
      `[AI Jobs] Created: ${jobId} | type=${jobType} | trigger=${triggerStatus} | complexity=${complexityLevel}`
    );

    // 트리거 실패 시 Redis에 상태 업데이트 (SSE에서 확인 가능)
    if (triggerStatus !== 'sent') {
      await redisSet(
        `job:trigger:${jobId}`,
        {
          status: triggerStatus,
          timestamp: new Date().toISOString(),
          message:
            triggerStatus === 'timeout'
              ? 'Worker 연결 지연 - 잠시 후 자동 처리됩니다'
              : 'Worker 연결 실패 - 재시도 중입니다',
        },
        60 // 1분 TTL
      );
    }
  } catch (error) {
    // 로깅 실패는 무시 (핵심 기능 아님)
    console.warn('[AI Jobs] Log failed:', error);
  }
}
