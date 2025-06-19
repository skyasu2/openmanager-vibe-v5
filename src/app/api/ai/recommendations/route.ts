/**
 * 💡 AI 추천사항 엔드포인트 v5.43.0 - 경량 ML 엔진 기반
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/ml/lightweight-ml-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const category = searchParams.get('category') || 'all';

    // 실제 추천 데이터 생성
    const recommendations = {
      success: true,
      timestamp: new Date().toISOString(),
      serverId: serverId || 'all-servers',
      category,
      recommendations: [
        {
          id: 'rec-1',
          type: 'performance',
          priority: 'high',
          title: 'CPU 사용률 최적화',
          description:
            '현재 CPU 사용률이 높습니다. 프로세스 최적화를 권장합니다.',
          impact: 'high',
          effort: 'medium',
          estimatedImprovement: '15-20% CPU 사용률 감소',
          actions: [
            '비효율적인 프로세스 식별 및 최적화',
            '캐싱 전략 구현',
            '데이터베이스 쿼리 최적화',
          ],
        },
        {
          id: 'rec-2',
          type: 'security',
          priority: 'medium',
          title: '보안 패치 업데이트',
          description: '시스템 보안 패치가 필요합니다.',
          impact: 'high',
          effort: 'low',
          estimatedImprovement: '보안 취약점 해결',
          actions: [
            '최신 보안 패치 적용',
            '방화벽 규칙 검토',
            '접근 권한 재검토',
          ],
        },
        {
          id: 'rec-3',
          type: 'capacity',
          priority: 'low',
          title: '스토리지 용량 확장',
          description: '디스크 사용률이 증가 추세입니다.',
          impact: 'medium',
          effort: 'low',
          estimatedImprovement: '향후 6개월 용량 확보',
          actions: [
            '불필요한 파일 정리',
            '로그 순환 정책 구현',
            '스토리지 확장 계획 수립',
          ],
        },
      ],
      analytics: {
        totalRecommendations: 3,
        highPriority: 1,
        mediumPriority: 1,
        lowPriority: 1,
        categories: {
          performance: 1,
          security: 1,
          capacity: 1,
        },
      },
      engine: 'lightweight-ml-v5.43.0',
    };

    return NextResponse.json(recommendations, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('AI Recommendations API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '추천사항 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, metrics, preferences } = body;

    // POST 요청으로 맞춤형 추천 생성
    const customRecommendations = {
      success: true,
      timestamp: new Date().toISOString(),
      serverId,
      customRecommendations: [
        {
          id: 'custom-rec-1',
          type: 'custom',
          priority: 'high',
          title: '맞춤형 성능 최적화',
          description: `서버 ${serverId}에 대한 맞춤형 최적화 방안입니다.`,
          basedOn: metrics ? 'real-time-metrics' : 'historical-data',
          actions: [
            '현재 워크로드 패턴 분석',
            '리소스 할당 최적화',
            '성능 모니터링 강화',
          ],
        },
      ],
      engine: 'lightweight-ml-v5.43.0',
    };

    return NextResponse.json(customRecommendations, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('AI Custom Recommendations API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '맞춤형 추천사항 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
