/**
 * 🔍 AI 로깅 관리 API
 * GET /api/ai/logging - 로그 조회
 * POST /api/ai/logging - 새 로그 생성
 * DELETE /api/ai/logging - 로그 정리
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  aiLogger,
  LogLevel,
  LogCategory,
} from '@/services/ai/logging/AILogger';

export const runtime = 'nodejs'; // Winston/Pino 지원을 위해 Node.js runtime 사용

/**
 * 🔍 AI 로그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '100');
    const engine = searchParams.get('engine');
    const category = searchParams.get('category') as LogCategory;
    const level = searchParams.get('level') as LogLevel;
    const query = searchParams.get('query');

    let logs;
    let metadata: any = {};

    switch (type) {
      case 'recent':
        logs = aiLogger.getRecentLogs(limit);
        break;

      case 'engine':
        if (!engine) {
          return NextResponse.json(
            { success: false, error: 'engine 파라미터가 필요합니다' },
            { status: 400 }
          );
        }
        logs = aiLogger.getLogsByEngine(engine, limit);
        break;

      case 'category':
        if (!category) {
          return NextResponse.json(
            { success: false, error: 'category 파라미터가 필요합니다' },
            { status: 400 }
          );
        }
        logs = aiLogger.getLogsByCategory(category, limit);
        break;

      case 'errors':
        logs = aiLogger.getErrorLogs(limit);
        break;

      case 'thinking':
        logs = aiLogger.getThinkingLogs(limit);
        break;

      case 'search':
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'query 파라미터가 필요합니다' },
            { status: 400 }
          );
        }
        logs = aiLogger.searchLogs(query, {
          engine: engine ? [engine] : undefined,
          category: category ? [category] : undefined,
          level: level ? [level] : undefined,
          since: searchParams.get('dateFrom') || undefined,
          until: searchParams.get('dateTo') || undefined,
        });
        break;

      case 'metrics':
        const performanceMetrics = aiLogger.getPerformanceMetrics();
        return NextResponse.json({
          success: true,
          data: {
            metrics: Array.from(performanceMetrics.entries()).map(
              ([key, value]) => ({
                key,
                ...value,
              })
            ),
            summary: {
              totalEngines: performanceMetrics.size,
              totalLogs: aiLogger.getRecentLogs(10000).length,
            },
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 type입니다' },
          { status: 400 }
        );
    }

    // 통계 계산
    if (logs) {
      metadata = {
        total: logs.length,
        byLevel: logs.reduce(
          (acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        byCategory: logs.reduce(
          (acc, log) => {
            acc[log.category] = (acc[log.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        byEngine: logs.reduce(
          (acc, log) => {
            acc[log.engine] = (acc[log.engine] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        timeRange:
          logs.length > 0
            ? {
                start: logs[0]?.timestamp,
                end: logs[logs.length - 1]?.timestamp,
              }
            : null,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        metadata,
        filters: {
          type,
          limit,
          engine,
          category,
          level,
          query,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 로그 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '로그 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 새 AI 로그 생성 (외부에서 로그 추가)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      level,
      category,
      engine,
      message,
      data,
      metadata,
      thinking,
      performance,
      context,
    } = body;

    if (!engine || !message) {
      return NextResponse.json(
        { success: false, error: 'engine과 message는 필수입니다' },
        { status: 400 }
      );
    }

    // AI 로거에 로그 추가
    await aiLogger.logAI({
      level: level || LogLevel.INFO,
      category: category || LogCategory.AI_ENGINE,
      engine,
      message,
      data,
      metadata: {
        ...metadata,
        source: 'api',
        userAgent: request.headers.get('user-agent'),
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
      },
      thinking,
      performance,
      context,
    });

    return NextResponse.json({
      success: true,
      message: '로그가 성공적으로 기록되었습니다',
      logId: `${engine}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 로그 생성 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '로그 생성 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🧹 로그 정리
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'clear';

    switch (action) {
      case 'clear':
        aiLogger.clearLogs();
        return NextResponse.json({
          success: true,
          message: '모든 로그가 정리되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'flush':
        await aiLogger.flushLogs();
        return NextResponse.json({
          success: true,
          message: '로그가 플러시되었습니다',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 action입니다' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 로그 정리 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '로그 정리 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
