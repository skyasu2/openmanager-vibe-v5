/**
 * AI Job Queue API - 개별 Job 상태 조회
 *
 * GET /api/ai/jobs/:id - Job 상태 조회 (폴링)
 * DELETE /api/ai/jobs/:id - Job 취소
 *
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import type { AIJob, JobStatusResponse } from '@/types/ai-jobs';

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
// GET /api/ai/jobs/:id - Job 상태 조회
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('ai_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      console.error('[AI Jobs] Failed to get job:', error);
      return NextResponse.json(
        { error: 'Failed to get job status' },
        { status: 500 }
      );
    }

    const response: JobStatusResponse = mapJobToResponse(job);

    // Cache 헤더 설정 (폴링 최적화)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Job-Status': job.status,
      },
    });
  } catch (error) {
    console.error('[AI Jobs] Error getting job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/ai/jobs/:id - Job 취소
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 현재 Job 상태 확인
    const { data: job, error: fetchError } = await supabase
      .from('ai_jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // 이미 완료된 Job은 취소 불가
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or failed job' },
        { status: 400 }
      );
    }

    // 이미 취소된 Job
    if (job.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Job is already cancelled' },
        { status: 400 }
      );
    }

    // Job 취소 처리
    const { error: updateError } = await supabase
      .from('ai_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('[AI Jobs] Failed to cancel job:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Job cancelled successfully', jobId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Jobs] Error cancelling job:', error);
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
