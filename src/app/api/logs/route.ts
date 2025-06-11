import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 로그 엔트리 타입
interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  serverId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// 모의 로그 데이터 생성기
function generateMockLogs(count: number, offset: number = 0): LogEntry[] {
  const levels: LogEntry['level'][] = [
    'debug',
    'info',
    'warning',
    'error',
    'critical',
  ];
  const sources = [
    'api-server',
    'database',
    'cache',
    'auth',
    'websocket',
    'scheduler',
  ];
  const serverIds = [
    'server-001',
    'server-002',
    'server-003',
    'server-004',
    'server-005',
  ];

  const logs: LogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const serverId = serverIds[Math.floor(Math.random() * serverIds.length)];

    logs.push({
      id: `log-${offset + i + 1}`,
      level,
      message: generateLogMessage(level, source),
      source,
      serverId,
      timestamp: new Date(Date.now() - (offset + i) * 60000).toISOString(),
      metadata: {
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        userId:
          level === 'error'
            ? undefined
            : `user-${Math.floor(Math.random() * 1000)}`,
        duration: Math.floor(Math.random() * 1000) + 'ms',
      },
    });
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function generateLogMessage(level: LogEntry['level'], source: string): string {
  const messages: Record<string, string[]> = {
    debug: [
      `${source} 디버그 정보 수집 완료`,
      `${source} 캐시 키 생성: cache_${Math.random().toString(36).substr(2, 8)}`,
      `${source} 연결 풀 상태 확인`,
    ],
    info: [
      `${source} 서비스 정상 시작`,
      `${source} 요청 처리 완료 (${Math.floor(Math.random() * 500)}ms)`,
      `${source} 스케줄러 작업 실행`,
    ],
    warning: [
      `${source} 응답 시간 지연 감지 (${Math.floor(Math.random() * 2000) + 1000}ms)`,
      `${source} 연결 수 임계치 접근 (${Math.floor(Math.random() * 50) + 80}%)`,
      `${source} 메모리 사용량 증가 추세`,
    ],
    error: [
      `${source} 연결 실패: Connection timeout`,
      `${source} 쿼리 실행 실패: Syntax error`,
      `${source} 인증 실패: Invalid token`,
    ],
    critical: [
      `${source} 서비스 다운 감지`,
      `${source} 데이터베이스 연결 완전 실패`,
      `${source} 시스템 리소스 고갈`,
    ],
  };

  const levelMessages = messages[level] || messages.info;
  return levelMessages[Math.floor(Math.random() * levelMessages.length)];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const cursor = parseInt(searchParams.get('cursor') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const level = (searchParams.get('level') as LogEntry['level']) || undefined;
    const source = searchParams.get('source') || undefined;
    const serverId = searchParams.get('serverId') || undefined;
    const search = searchParams.get('search') || undefined;
    const timeRange = searchParams.get('timeRange') || '24h';

    // 전체 로그 생성 (실제로는 DB에서 조회)
    let allLogs = generateMockLogs(1000, cursor);

    // 필터링 적용
    if (level) {
      allLogs = allLogs.filter(log => log.level === level);
    }

    if (source) {
      allLogs = allLogs.filter(log => log.source === source);
    }

    if (serverId) {
      allLogs = allLogs.filter(log => log.serverId === serverId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allLogs = allLogs.filter(
        log =>
          log.message.toLowerCase().includes(searchLower) ||
          log.source.toLowerCase().includes(searchLower)
      );
    }

    // 시간 범위 필터링
    const timeRangeMs = parseTimeRange(timeRange);
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    allLogs = allLogs.filter(log => new Date(log.timestamp) >= cutoffTime);

    // 페이지네이션
    const startIndex = cursor;
    const endIndex = startIndex + limit;
    const paginatedLogs = allLogs.slice(startIndex, endIndex);
    const hasNextPage = endIndex < allLogs.length;
    const nextCursor = hasNextPage ? endIndex : undefined;

    return NextResponse.json({
      data: paginatedLogs,
      nextCursor,
      hasNextPage,
      totalCount: allLogs.length,
      pageSize: limit,
      currentCursor: cursor,
      filters: {
        level,
        source,
        serverId,
        search,
        timeRange,
      },
    });
  } catch (error) {
    console.error('로그 조회 오류:', error);

    return NextResponse.json(
      {
        error: '로그 조회에 실패했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 시간 범위 파싱 (예: '24h', '7d', '30d')
function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)([hmd])$/);
  if (!match) return 24 * 60 * 60 * 1000; // 기본값: 24시간

  const [, value, unit] = match;
  const numValue = parseInt(value);

  switch (unit) {
    case 'h':
      return numValue * 60 * 60 * 1000;
    case 'd':
      return numValue * 24 * 60 * 60 * 1000;
    case 'm':
      return numValue * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

// 최근 로그 조회 (별도 엔드포인트)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10, level } = body;

    const logs = generateMockLogs(limit, 0);
    const filteredLogs = level ? logs.filter(log => log.level === level) : logs;

    return NextResponse.json({
      success: true,
      data: filteredLogs.slice(0, limit),
      total: filteredLogs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '최근 로그 조회 실패',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
