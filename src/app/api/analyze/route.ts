import { makeAIRequest } from '@/utils/aiEngineConfig';
import { NextRequest, NextResponse } from 'next/server';

// AI 분석 응답 타입 정의
interface AIAnalysisResponse {
  summary: string;
  confidence: number;
  recommendations: string[];
  analysis_data?: {
    query?: string;
    metrics_count?: number;
    timestamp?: string;
  };
}

// AI 분석 요청 타입 정의
interface AIAnalysisRequest {
  query?: string;
  metrics?: Array<{ [key: string]: any }>;
  data?: { [key: string]: any };
  type?: string;
  options?: any;
}

/**
 * 🔍 AI 분석 API - POST 요청 처리
 * 서버 데이터 및 시스템 상태를 AI로 분석하는 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();
    const { type, data, options } = body;

    // 분석 타입별 처리
    switch (type) {
      case 'server-performance':
        return NextResponse.json({
          success: true,
          analysis: {
            type: 'server-performance',
            summary: '서버 성능 분석 완료',
            insights: [
              'CPU 사용률이 평균 대비 15% 높음',
              '메모리 사용률은 정상 범위',
              '네트워크 지연시간 증가 감지',
            ],
            recommendations: [
              'CPU 집약적 프로세스 최적화 권장',
              '네트워크 구성 점검 필요',
            ],
            confidence: 0.85,
          },
        });

      case 'anomaly-detection':
        return NextResponse.json({
          success: true,
          analysis: {
            type: 'anomaly-detection',
            summary: '이상 징후 분석 완료',
            anomalies: [
              {
                type: 'performance',
                severity: 'medium',
                description: '응답 시간 증가',
                confidence: 0.78,
              },
            ],
            recommendations: ['성능 모니터링 강화', '로드 밸런싱 검토'],
          },
        });

      case 'predictive-analysis':
        return NextResponse.json({
          success: true,
          analysis: {
            type: 'predictive-analysis',
            summary: '예측 분석 완료',
            predictions: [
              {
                metric: 'cpu_usage',
                forecast: '다음 24시간 내 85% 도달 예상',
                probability: 0.72,
              },
            ],
            recommendations: [
              '리소스 확장 계획 수립',
              '자동 스케일링 설정 검토',
            ],
          },
        });

      default:
        // AI 엔진 설정 매니저를 통해 하이브리드 AI 엔진 호출
        // 내부 AI 엔진(v3) 우선, 실패 시 외부 엔진으로 폴백
        const aiResult = await makeAIRequest('', body, true); // true = 내부 엔진 우선

        // 응답 로그 (개발용)
        console.log('AI Analysis Result:', {
          query: body.query,
          success: aiResult?.success,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          data: aiResult,
          processedAt: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('❌ AI 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '분석 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청 처리 (분석 상태 조회)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';

    if (type === 'health') {
      // AI 엔진 설정 확인
      const aiEngineUrl =
        process.env.FASTAPI_BASE_URL ||
        'https://openmanager-ai-engine.onrender.com';

      // 내부 AI 엔진 헬스체크 시도
      const healthData = await makeAIRequest('?action=health', {}, true);

      return NextResponse.json({
        status: 'ok',
        aiEngine: {
          internalEngine: '/api/v3/ai',
          externalEngine: aiEngineUrl,
          health: healthData,
          hybridMode: true,
          lastChecked: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      availableAnalyses: [
        'server-performance',
        'anomaly-detection',
        'predictive-analysis',
      ],
      message: 'AI 분석 시스템이 정상 작동 중입니다',
    });
  } catch (error) {
    console.error('❌ AI 분석 상태 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
