/**
 * 🗄️ AI 자연어 질의 로그 API
 *
 * - AI 질의 로그 조회
 * - 사용 통계 확인
 * - 세션별 로그 조회
 *
 * GET /api/ai-logs - 로그 조회
 * GET /api/ai-logs/stats - 사용 통계
 * GET /api/ai-logs/sessions - 세션별 통계
 */

import { supabaseAILogger } from '@/services/ai/logging/SupabaseAILogger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'logs';

    switch (action) {
      case 'logs':
        return await getLogs(searchParams);
      case 'stats':
        return await getStats();
      case 'sessions':
        return await getSessions(searchParams);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ AI 로그 API 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 📊 AI 질의 로그 조회
 */
async function getLogs(searchParams: URLSearchParams) {
  const filter = {
    session_id: searchParams.get('session_id') || undefined,
    engine_used: searchParams.get('engine') || undefined,
    category: searchParams.get('category') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
  };

  const logs = await supabaseAILogger.getLogs(filter);

  return NextResponse.json({
    success: true,
    data: logs,
    count: logs.length,
    filter: filter,
  });
}

/**
 * 📈 AI 사용 통계 조회
 */
async function getStats() {
  const stats = await supabaseAILogger.getStatistics();

  return NextResponse.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 🔍 세션별 로그 조회
 */
async function getSessions(searchParams: URLSearchParams) {
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id parameter is required' },
      { status: 400 }
    );
  }

  const logs = await supabaseAILogger.getLogs({ session_id: sessionId });

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    data: logs,
    count: logs.length,
  });
}

/**
 * 🧹 오래된 로그 정리 (POST 요청)
 */
export async function POST(request: NextRequest) {
  try {
    const { action, retention_days } = await request.json();

    if (action === 'cleanup') {
      await supabaseAILogger.cleanupOldLogs(retention_days || 30);
      return NextResponse.json({
        success: true,
        message: `${retention_days || 30}일 이전 로그 정리 완료`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ AI 로그 정리 API 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
