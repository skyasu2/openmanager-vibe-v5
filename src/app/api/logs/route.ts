/**
 * 📝 로깅 시스템 API v1.0
 * 
 * ✅ 로그 조회 및 검색
 * ✅ 로그 통계
 * ✅ 로그 내보내기
 * ✅ 로그 설정 관리
 */

import { UnifiedLogger, type LogCategory, type LogLevel, type LogQuery } from '@/services/ai/UnifiedLogger';
import { NextRequest, NextResponse } from 'next/server';

const logger = UnifiedLogger.getInstance();

/**
 * 📝 GET - 로그 조회 및 검색
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const query: LogQuery = {};

    // 레벨 필터
    const levels = searchParams.get('levels');
    if (levels) {
      query.level = levels.split(',') as LogLevel[];
    }

    // 카테고리 필터
    const categories = searchParams.get('categories');
    if (categories) {
      query.category = categories.split(',') as LogCategory[];
    }

    // 소스 필터
    const source = searchParams.get('source');
    if (source) {
      query.source = source;
    }

    // 시간 범위 필터
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    if (startTime && endTime) {
      query.timeRange = {
        start: startTime,
        end: endTime
      };
    }

    // 제한
    const limit = searchParams.get('limit');
    if (limit) {
      query.limit = parseInt(limit);
    }

    // 태그 필터
    const tags = searchParams.get('tags');
    if (tags) {
      query.tags = tags.split(',');
    }

    // 텍스트 검색
    const searchText = searchParams.get('search');
    if (searchText) {
      query.searchText = searchText;
    }

    // 특별 요청들
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeStatus = searchParams.get('includeStatus') === 'true';
    const export_format = searchParams.get('export');

    // 로그 조회
    const logs = logger.queryLogs(query);

    const response: any = {
      success: true,
      data: {
        logs,
        count: logs.length,
        query,
        timestamp: new Date().toISOString()
      }
    };

    // 통계 포함
    if (includeStats) {
      response.data.stats = logger.getLogStats();
    }

    // 상태 포함
    if (includeStatus) {
      response.data.status = logger.getRealServerMetrics().then(r => ({ status: r.success ? 'active' : 'error' }));
    }

    // 내보내기 형식
    if (export_format === 'json') {
      const exportData = logger.exportLogs(query);
      return new NextResponse(exportData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    // 로그 조회 기록
    logger.debug(
      'system',
      'LogAPI',
      'Logs retrieved',
      {
        query,
        resultCount: logs.length,
        includeStats,
        includeStatus
      }
    );

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60',
      },
    });

  } catch (error) {
    console.error('❌ 로그 조회 실패:', error);

    logger.error(
      'system',
      'LogAPI',
      'Failed to retrieve logs',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '로그 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 POST - 로그 기록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, category, source, message, data, metadata, tags } = body;

    // 필수 필드 검증
    if (!level || !category || !source || !message) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다. (level, category, source, message)'
        },
        { status: 400 }
      );
    }

    // 로그 기록
    logger.log(level, category, source, message, data, metadata, tags);

    return NextResponse.json({
      success: true,
      message: '로그가 기록되었습니다.'
    });

  } catch (error) {
    console.error('❌ 로그 기록 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '로그 기록에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 PUT - 로그 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'config 필드가 필요합니다.' },
            { status: 400 }
          );
        }
        logger.updateConfig(config);
        break;

      case 'enable':
        logger.enable();
        break;

      case 'disable':
        logger.disable();
        break;

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }

    logger.info(
      'system',
      'LogAPI',
      `Log configuration updated: ${action}`,
      { action, config }
    );

    return NextResponse.json({
      success: true,
      message: `로그 설정이 업데이트되었습니다: ${action}`
    });

  } catch (error) {
    console.error('❌ 로그 설정 업데이트 실패:', error);

    logger.error(
      'system',
      'LogAPI',
      'Failed to update log configuration',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: '로그 설정 업데이트에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 🗑️ DELETE - 로그 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: '로그 삭제를 확인하려면 confirm=true 파라미터를 추가하세요.'
        },
        { status: 400 }
      );
    }

    logger.clearLogs();

    // 시스템 로그로 기록 (로그가 삭제된 후이므로 콘솔에만 출력됨)
    console.log('📝 모든 로그가 삭제되었습니다.');

    return NextResponse.json({
      success: true,
      message: '모든 로그가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 로그 삭제 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '로그 삭제에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
