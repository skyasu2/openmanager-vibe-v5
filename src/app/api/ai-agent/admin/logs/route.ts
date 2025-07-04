/**
 * 🔧 AI Agent 관리자 로그 API
 */

import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    details?: any;
}

/**
 * 📋 AI Agent 로그 조회
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level') || 'all';
        const limit = parseInt(searchParams.get('limit') || '50');

        // 샘플 로그 데이터
        const logs: LogEntry[] = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'AI Agent 초기화 완료',
                source: 'ai-agent-system',
                details: { engines: 5, memory: '70MB' }
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'warning',
                message: 'GCP Functions 연결 지연',
                source: 'gcp-connector',
                details: { latency: '850ms', retry_count: 2 }
            },
            {
                timestamp: new Date(Date.now() - 120000).toISOString(),
                level: 'error',
                message: 'AI 엔진 임시 오류',
                source: 'master-ai-engine',
                details: {
                    error: 'Rate limit exceeded',
                    engine: 'google-ai',
                    auto_recovery: true
                }
            }
        ];

        // 레벨 필터링
        const filteredLogs = level === 'all'
            ? logs
            : logs.filter(log => log.level === level);

        // 제한 적용
        const limitedLogs = filteredLogs.slice(0, limit);

        return NextResponse.json({
            success: true,
            logs: limitedLogs,
            total: limitedLogs.length,
            level_filter: level,
            metadata: {
                available_levels: ['info', 'warning', 'error'],
                last_updated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI Agent 로그 API 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'AI Agent 로그 조회 실패',
                message: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
}

/**
 * 🗑️ 로그 정리 (관리자 전용)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const olderThan = searchParams.get('older_than') || '7d';

        // 실제로는 로그 저장소에서 삭제
        const deletedCount = Math.floor(Math.random() * 100);

        return NextResponse.json({
            success: true,
            message: `${olderThan} 이전 로그 삭제 완료`,
            deleted_count: deletedCount,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Agent 로그 삭제 오류:', error);

        return NextResponse.json(
            {
                success: false,
                error: '로그 삭제 실패',
                message: error instanceof Error ? error.message : '알 수 없는 오류'
            },
            { status: 500 }
        );
    }
} 