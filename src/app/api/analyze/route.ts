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
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();
    
    // AI Engine URL 가져오기
    const aiEngineUrl = process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com';
    
    if (!aiEngineUrl) {
      return NextResponse.json(
        { error: 'AI Engine URL이 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    // AI 엔진으로 요청 전송
    const response = await fetch(`${aiEngineUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI Engine 응답 오류: ${response.status}`);
    }

    const aiResult: AIAnalysisResponse = await response.json();

    // 응답 로그 (개발용)
    console.log('AI Analysis Result:', {
      query: body.query,
      summary: aiResult.summary,
      confidence: aiResult.confidence,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: aiResult,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI 분석 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '분석 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 상태 확인
export async function GET() {
  const aiEngineUrl = process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com';
  
  try {
    if (!aiEngineUrl) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'AI Engine URL이 설정되지 않았습니다' 
        },
        { status: 500 }
      );
    }

    // AI 엔진 헬스체크
    const response = await fetch(`${aiEngineUrl}/health`);
    const healthData = await response.json();

    return NextResponse.json({
      status: 'ok',
      aiEngine: {
        url: aiEngineUrl,
        health: healthData,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'AI Engine 연결 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 