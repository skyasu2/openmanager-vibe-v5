import { NextResponse } from 'next/server';

const generateMockInsights = () => {
    const insights = [
        {
            id: 'insight-001',
            type: 'prediction' as const,
            title: 'CPU 사용률 급증 예상',
            description: 'Seoul-WEB-01 서버의 CPU 사용률이 다음 30분 내에 80%를 초과할 것으로 예측됩니다.',
            confidence: 0.87,
            severity: 'medium' as const,
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
        },
        {
            id: 'insight-002',
            type: 'anomaly' as const,
            title: '비정상적인 메모리 패턴 감지',
            description: 'Tokyo-WEB-03 서버에서 평소와 다른 메모리 사용 패턴이 감지되었습니다.',
            confidence: 0.73,
            severity: 'low' as const,
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15분 전
        },
        {
            id: 'insight-003',
            type: 'recommendation' as const,
            title: '로드 밸런싱 개선 권장',
            description: 'Singapore 리전의 서버들 간 부하 분산을 최적화하면 전체 성능이 23% 향상될 것으로 분석됩니다.',
            confidence: 0.91,
            severity: 'high' as const,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        },
        {
            id: 'insight-004',
            type: 'prediction' as const,
            title: '디스크 공간 부족 위험',
            description: 'Frankfurt-WEB-02 서버의 디스크 사용률이 현재 추세로 3일 내에 95%에 도달할 예정입니다.',
            confidence: 0.95,
            severity: 'high' as const,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
        },
        {
            id: 'insight-005',
            type: 'anomaly' as const,
            title: '네트워크 트래픽 이상',
            description: 'Oregon-WEB-01에서 평소보다 300% 높은 아웃바운드 트래픽이 감지되었습니다.',
            confidence: 0.82,
            severity: 'medium' as const,
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45분 전
        },
    ];

    return insights;
};

export async function GET() {
    try {
        // 실제 AI 분석 결과를 시뮬레이션
        const insights = generateMockInsights();

        // 최신 순으로 정렬
        insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(insights, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });

    } catch (error) {
        console.error('❌ Failed to fetch AI insights:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch AI insights',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 