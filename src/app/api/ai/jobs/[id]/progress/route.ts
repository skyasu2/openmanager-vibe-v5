/**
 * AI Job Progress API - Worker 전용 진행률 업데이트
 *
 * PATCH /api/ai/jobs/:id/progress - 진행률 업데이트 (Cloud Run Worker 전용)
 *
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import type { JobCompletionUpdate, JobProgressUpdate } from '@/types/ai-jobs';

// Worker 인증 토큰 (환경 변수에서)
const WORKER_SECRET = process.env.AI_WORKER_SECRET;

// Supabase 클라이언트 생성
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Worker 인증 검증
 */
function verifyWorkerAuth(request: NextRequest): boolean {
  // 개발 환경에서는 인증 스킵 가능
  if (process.env.NODE_ENV === 'development' && !WORKER_SECRET) {
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === WORKER_SECRET;
}

// ============================================
// PATCH /api/ai/jobs/:id/progress - 진행률 업데이트
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Worker 인증 확인
    if (!verifyWorkerAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    const body = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 업데이트 유형 판별
    const isCompletion =
      body.status === 'completed' || body.status === 'failed';

    if (isCompletion) {
      // 완료/실패 업데이트
      const completion = body as JobCompletionUpdate;
      const updateData: Record<string, unknown> = {
        status: completion.status,
        completed_at: new Date().toISOString(),
        progress: 100,
      };

      if (completion.status === 'completed' && completion.result) {
        updateData.result = completion.result;
      }
      if (completion.status === 'failed' && completion.error) {
        updateData.error = completion.error;
      }

      const { error } = await supabase
        .from('ai_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        console.error('[AI Jobs] Failed to update job completion:', error);
        return NextResponse.json(
          { error: 'Failed to update job' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Job completion updated',
        jobId,
        status: completion.status,
      });
    } else {
      // 진행률 업데이트
      const progress = body as JobProgressUpdate;
      const updateData: Record<string, unknown> = {
        status: progress.status || 'processing',
        progress: progress.progress,
      };

      if (progress.currentStep) {
        updateData.current_step = progress.currentStep;
      }

      // 처음 processing으로 변경 시 started_at 설정
      if (progress.status === 'processing') {
        const { data: job } = await supabase
          .from('ai_jobs')
          .select('started_at')
          .eq('id', jobId)
          .single();

        if (job && !job.started_at) {
          updateData.started_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('ai_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        console.error('[AI Jobs] Failed to update job progress:', error);
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Progress updated',
        jobId,
        progress: progress.progress,
      });
    }
  } catch (error) {
    console.error('[AI Jobs] Error updating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
