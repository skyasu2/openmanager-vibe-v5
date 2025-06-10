import { NextRequest, NextResponse } from 'next/server';
import { makeAIRequest } from '@/utils/aiEngineConfig';

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
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();

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
  } catch (error) {
    console.error('AI 분석 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 상태 확인
export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'AI Engine 연결 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
