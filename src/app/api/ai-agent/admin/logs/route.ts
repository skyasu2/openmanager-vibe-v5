import { NextRequest, NextResponse } from "next/server";

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source: string;
    metadata?: Record<string, any>;
}

// 모의 로그 데이터 생성
function generateMockLogs(count: number = 50): LogEntry[] {
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
    const sources = ['ai-engine', 'data-processor', 'api-gateway', 'cache-manager'];
    const messages = [
        'AI 엔진 초기화 완료',
        '데이터 처리 시작',
        'API 요청 처리 중',
        '캐시 업데이트 완료',
        '경고: 높은 메모리 사용량',
        '오류: 연결 시간 초과',
        '디버그: 성능 메트릭 수집'
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: `log_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        metadata: {
            requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
            duration: Math.floor(Math.random() * 1000),
            userId: `user_${Math.floor(Math.random() * 100)}`
        }
    }));
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level');
        const source = searchParams.get('source');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let logs = generateMockLogs(200); // 더 많은 로그 생성

        // 필터링 적용
        if (level) {
            logs = logs.filter(log => log.level === level);
        }

        if (source) {
            logs = logs.filter(log => log.source === source);
        }

        if (startDate) {
            const start = new Date(startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedLogs = logs.slice(startIndex, endIndex);

        // 통계 정보
        const stats = {
            total: logs.length,
            byLevel: {
                info: logs.filter(l => l.level === 'info').length,
                warn: logs.filter(l => l.level === 'warn').length,
                error: logs.filter(l => l.level === 'error').length,
                debug: logs.filter(l => l.level === 'debug').length
            },
            bySource: logs.reduce((acc, log) => {
                acc[log.source] = (acc[log.source] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return NextResponse.json({
            logs: paginatedLogs,
            pagination: {
                page,
                limit,
                total: logs.length,
                totalPages: Math.ceil(logs.length / limit)
            },
            stats,
            filters: {
                level,
                source,
                startDate,
                endDate
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI 에이전트 로그 조회 오류:', error);
        return NextResponse.json(
            { error: 'AI 에이전트 로그를 조회할 수 없습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, logIds, exportFormat } = body;

        switch (action) {
            case 'export':
                const logs = generateMockLogs(100);
                const selectedLogs = logIds
                    ? logs.filter(log => logIds.includes(log.id))
                    : logs;

                if (exportFormat === 'csv') {
                    const csvContent = [
                        'ID,Timestamp,Level,Message,Source',
                        ...selectedLogs.map(log =>
                            `${log.id},${log.timestamp},${log.level},${log.message},${log.source}`
                        )
                    ].join('\n');

                    return new NextResponse(csvContent, {
                        headers: {
                            'Content-Type': 'text/csv',
                            'Content-Disposition': 'attachment; filename="ai-agent-logs.csv"'
                        }
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: '로그 내보내기가 완료되었습니다.',
                    logs: selectedLogs,
                    format: exportFormat || 'json',
                    timestamp: new Date().toISOString()
                });

            case 'clear':
                return NextResponse.json({
                    success: true,
                    message: '로그가 성공적으로 삭제되었습니다.',
                    clearedCount: logIds?.length || 0,
                    timestamp: new Date().toISOString()
                });

            case 'archive':
                return NextResponse.json({
                    success: true,
                    message: '로그가 성공적으로 아카이브되었습니다.',
                    archivedCount: logIds?.length || 0,
                    archiveId: `archive_${Date.now()}`,
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json(
                    { error: '지원하지 않는 액션입니다.' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('AI 에이전트 로그 관리 오류:', error);
        return NextResponse.json(
            { error: 'AI 에이전트 로그 관리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
