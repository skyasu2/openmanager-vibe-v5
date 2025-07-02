/**
 * 📝 AI Sessions Management API v1.0
 *
 * ✅ AI 세션 조회 및 관리
 * ✅ 저장된 AI 응답 히스토리
 * ✅ Supabase 저장소 상태 모니터링
 * ✅ Edge Runtime 최적화
 */

export const runtime = 'edge';

import { getAISessionStorage } from '@/lib/ai-session-storage';
import { EdgeLogger } from '@/lib/edge-runtime-utils';
import { NextRequest, NextResponse } from 'next/server';

const logger = EdgeLogger.getInstance();

/**
 * 🔍 GET: AI 세션 조회 및 목록
 *
 * Query Parameters:
 * - sessionId: 특정 세션 조회
 * - limit: 목록 제한 (기본값: 10)
 * - userId: 사용자별 조회 (미래 구현)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    const storage = getAISessionStorage();

    // 특정 세션 조회
    if (sessionId) {
      logger.info('🔍 AI 세션 조회 요청', { sessionId });

      const session = await storage.getSession(sessionId);

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: '세션을 찾을 수 없거나 만료되었습니다.',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          session,
          retrieved_at: new Date().toISOString(),
        },
        metadata: {
          response_time: Date.now() - startTime,
          source: 'supabase',
          cache_status: 'fresh',
        },
      });
    }

    // 세션 목록 조회
    logger.info('📝 AI 세션 목록 조회 요청', { limit, userId });

    const sessions = await storage.getUserSessions(userId || undefined, limit);
    const storageStats = await storage.getStorageStats();

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total_count: sessions.length,
        storage_stats: storageStats,
      },
      metadata: {
        response_time: Date.now() - startTime,
        source: 'supabase',
        limit_applied: limit,
        health_status: storageStats.storage_health,
      },
    });
  } catch (error) {
    logger.error('AI 세션 조회 API 오류', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SESSION_API_ERROR',
          message: '세션 조회 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          response_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🧹 DELETE: 만료된 세션 정리
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('🧹 만료된 AI 세션 정리 요청');

    const storage = getAISessionStorage();
    const cleanedCount = await storage.cleanupExpiredSessions();

    return NextResponse.json({
      success: true,
      data: {
        cleaned_sessions: cleanedCount,
        cleanup_completed_at: new Date().toISOString(),
      },
      metadata: {
        response_time: Date.now() - startTime,
        operation: 'cleanup_expired_sessions',
      },
    });
  } catch (error) {
    logger.error('AI 세션 정리 API 오류', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: '세션 정리 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          response_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 POST: 저장소 상태 조회 및 건강성 검사
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { action } = await request.json();

    const storage = getAISessionStorage();

    switch (action) {
      case 'health_check':
        logger.info('📊 AI 세션 저장소 건강성 검사');

        const stats = await storage.getStorageStats();

        return NextResponse.json({
          success: true,
          data: {
            health_status: stats.storage_health,
            storage_stats: stats,
            connection_info: {
              supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
                ? 'configured'
                : 'missing',
              supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? 'configured'
                : 'missing',
              edge_runtime: true,
              vercel_deployment: process.env.VERCEL_URL || 'local',
            },
            recommendations: generateHealthRecommendations(stats),
          },
          metadata: {
            response_time: Date.now() - startTime,
            check_timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: '지원하지 않는 액션입니다.',
              supported_actions: ['health_check'],
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('AI 세션 상태 API 오류', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_API_ERROR',
          message: '저장소 상태 조회 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          response_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 💡 건강성 개선 권장사항 생성
 */
function generateHealthRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  if (stats.storage_health === 'unavailable') {
    recommendations.push('Supabase 연결을 확인하고 환경변수를 점검하세요.');
  }

  if (stats.storage_health === 'degraded') {
    recommendations.push(
      'Supabase 데이터베이스 성능을 확인하고 인덱스를 최적화하세요.'
    );
  }

  if (stats.total_sessions > 1000) {
    recommendations.push('만료된 세션 정리를 실행하여 저장 공간을 확보하세요.');
  }

  if (stats.active_sessions > 100) {
    recommendations.push(
      '활성 세션이 많습니다. 세션 TTL을 줄이는 것을 고려하세요.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('AI 세션 저장소가 정상적으로 작동하고 있습니다.');
  }

  return recommendations;
}
