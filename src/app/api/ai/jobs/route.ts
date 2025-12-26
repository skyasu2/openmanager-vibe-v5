/**
 * AI Job Queue API - Job 생성 및 목록 조회
 *
 * POST /api/ai/jobs - 새 Job 생성
 * GET /api/ai/jobs - Job 목록 조회
 *
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import {
  analyzeQueryComplexity,
  inferJobType,
} from '@/lib/ai/job-queue/complexity-analyzer';
import type {
  AIJob,
  CreateJobRequest,
  CreateJobResponse,
  JobListResponse,
  JobStatusResponse,
} from '@/types/ai-jobs';

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
// POST /api/ai/jobs - Job 생성
// ============================================

export async function POST(request: NextRequest) {
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

    // Cloud Run Worker에 Job 처리 요청
    await triggerWorker(job.id, query, jobType, options?.sessionId);

    const response: CreateJobResponse = {
      jobId: job.id,
      status: 'queued',
      pollUrl: `/api/ai/jobs/${job.id}`,
      estimatedTime: complexity.estimatedTime,
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

// ============================================
// GET /api/ai/jobs - Job 목록 조회
// ============================================

export async function GET(request: NextRequest) {
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

/**
 * Cloud Run Worker에 Job 처리 요청
 *
 * 비동기 Job 처리를 위해 Cloud Run에 메시지를 전송합니다.
 * Cloud Run은 결과를 Redis에 저장하고, Vercel SSE가 이를 클라이언트에 전달합니다.
 */
async function triggerWorker(
  jobId: string,
  query: string,
  type: string,
  sessionId?: string
): Promise<void> {
  const cloudRunUrl = process.env.CLOUD_RUN_AI_URL;
  const apiSecret = process.env.CLOUD_RUN_API_SECRET;

  if (!cloudRunUrl) {
    console.warn(
      '[AI Jobs] CLOUD_RUN_AI_URL not configured, skipping worker trigger'
    );
    return;
  }

  try {
    // 비동기로 Worker 호출 (응답을 기다리지 않음)
    fetch(`${cloudRunUrl}/api/jobs/process`, {
      method: 'POST',
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
    }).catch((err) => {
      console.error('[AI Jobs] Failed to trigger worker:', err);
    });
  } catch (error) {
    console.error('[AI Jobs] Error triggering worker:', error);
  }
}
