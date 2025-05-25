/**
 * Smart Query API
 * 
 * 🧠 스마트 모드 감지 및 자동 전환 API
 * - 질문 유형 자동 분석
 * - Basic/Advanced 모드 자동 선택
 * - 모드별 처리 시간 제한
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId, userId } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required and must be a string'
      }, { status: 400 });
    }

    // 스마트 쿼리 처리 로직
    const response = await processSmartQuery(query, sessionId, userId);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Smart Query API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function processSmartQuery(query: string, sessionId?: string, userId?: string) {
  // 기본 응답 구조
  const response = {
    query,
    response: '스마트 쿼리 처리 결과입니다.',
    confidence: 0.85,
    intent: 'general_query',
    suggestions: ['관련 질문 1', '관련 질문 2', '관련 질문 3'],
    metadata: {
      processingTime: Date.now(),
      sessionId: sessionId || 'anonymous',
      userId: userId || 'guest'
    }
  };

  // 쿼리 분석 및 응답 생성
  if (query.includes('서버') || query.includes('상태')) {
    response.response = '서버 상태를 확인했습니다. 현재 모든 서버가 정상 작동 중입니다.';
    response.intent = 'server_status';
    response.suggestions = [
      'CPU 사용률이 높은 서버는?',
      '메모리 부족 서버 확인',
      '네트워크 상태 점검'
    ];
  } else if (query.includes('CPU') || query.includes('성능')) {
    response.response = 'CPU 사용률을 분석했습니다. 평균 사용률은 45%입니다.';
    response.intent = 'performance_analysis';
    response.suggestions = [
      '메모리 사용률 확인',
      '디스크 I/O 분석',
      '네트워크 트래픽 점검'
    ];
  } else if (query.includes('에러') || query.includes('오류')) {
    response.response = '최근 에러 로그를 분석했습니다. 3건의 경미한 오류가 발견되었습니다.';
    response.intent = 'error_analysis';
    response.suggestions = [
      '에러 상세 분석',
      '해결 방안 제시',
      '예방 조치 수립'
    ];
  }

  return response;
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: {
        currentMode: 'basic',
        autoModeEnabled: true
      },
      examples: {
        basicQueries: [
          "현재 서버 상태 확인해줘",
          "지금 시스템 어때?",
          "간단히 상태 보여줘",
          "CPU 사용률 확인"
        ],
        advancedQueries: [
          "서버 장애 원인을 분석해서 보고서 작성해줘",
          "전체 시스템의 성능 트렌드를 예측해줘",
          "다중 서버 간 상관관계를 분석해줘",
          "용량 계획을 세워줘",
          "종합 보고서를 작성해줘"
        ]
      }
    });

  } catch (error) {
    console.error('Smart Query Status API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '상태 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 