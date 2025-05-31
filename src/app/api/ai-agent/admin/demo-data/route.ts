/**
 * Admin Demo Data API
 * 
 * 📊 관리자 대시보드 데모 데이터 생성 API
 * - 시뮬레이션 상호작용 데이터
 * - 가짜 에러 로그
 * - 학습 패턴 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiDatabase } from '../../../../../lib/database';
import { authManager } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 데모 데이터 제공
    const demoData = {
      timestamp: new Date().toISOString(),
      status: 'success',
      data: {
        agents: [
          { id: 1, name: 'AI Agent 1', status: 'active', performance: 95 },
          { id: 2, name: 'AI Agent 2', status: 'active', performance: 87 },
          { id: 3, name: 'AI Agent 3', status: 'inactive', performance: 0 }
        ],
        metrics: {
          totalRequests: 1245,
          successRate: 98.2,
          averageResponseTime: 125
        }
      }
    };

    return NextResponse.json(demoData);
  } catch (error) {
    console.error('Demo data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Demo data updated',
      data: body
    });
  } catch (error) {
    console.error('Demo data update error:', error);
    return NextResponse.json(
      { error: 'Failed to update demo data' },
      { status: 500 }
    );
  }
}

// 상호작용 데이터 생성
async function generateInteractions(count: number) {
  const sampleQueries = [
    '서버 상태를 확인해주세요',
    'CPU 사용률이 높은 서버를 찾아주세요',
    '메모리 부족 경고가 있는 서버는?',
    '네트워크 트래픽 분석 결과를 보여주세요',
    '디스크 용량이 부족한 서버 목록',
    '최근 1시간 동안의 에러 로그 분석',
    '성능이 저하된 서버 진단',
    '보안 이벤트 요약 보고서',
    '백업 상태 확인',
    '시스템 리소스 최적화 제안',
    '장애 보고서 생성',
    '서버 간 상관관계 분석',
    '예측 분석 결과',
    '용량 계획 수립',
    '성능 벤치마크 비교'
  ];

  const categories = ['server_monitoring', 'performance_analysis', 'security', 'backup', 'optimization'];
  const intents = ['server_status', 'performance_check', 'error_analysis', 'security_audit', 'capacity_planning'];

  const interactions = [];

  for (let i = 0; i < count; i++) {
    const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const mode = Math.random() > 0.3 ? 'basic' : 'advanced'; // 70% basic, 30% advanced
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const success = Math.random() > 0.1; // 90% 성공률
    const responseTime = Math.floor(Math.random() * 3000) + 500; // 500-3500ms
    const userRating = success ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1; // 성공시 3-5, 실패시 1-2
    
    const timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // 최근 7일 내

    const interactionId = await aiDatabase.saveInteraction({
      sessionId: `demo_session_${Math.floor(Math.random() * 1000)}`,
      userId: `demo_user_${Math.floor(Math.random() * 50)}`,
      timestamp,
      query,
      queryType: intent,
      detectedMode: mode as 'basic' | 'advanced',
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100% 신뢰도
      response: generateSampleResponse(query, mode, success),
      responseTime,
      success,
      userRating,
      intent,
      triggers: mode === 'advanced' ? ['complex_query', 'analysis_required'] : ['simple_query'],
      serverData: generateSampleServerData(),
      errorMessage: success ? undefined : generateSampleError(),
      isTrainingData: Math.random() > 0.7, // 30% 학습 데이터
      category,
      tags: [category, mode, intent]
    });

    interactions.push(interactionId);
  }

  return NextResponse.json({
    success: true,
    message: `${count}개의 상호작용 데이터가 생성되었습니다.`,
    generatedIds: interactions
  });
}

// 에러 데이터 생성
async function generateErrors(count: number) {
  const errorTypes = ['timeout', 'network_error', 'parsing_error', 'authentication_error', 'server_error'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const sampleErrors = [
    'Connection timeout to server monitoring API',
    'Failed to parse server response JSON',
    'Authentication token expired',
    'Network unreachable: 192.168.1.100',
    'Database connection pool exhausted',
    'Memory allocation failed',
    'Disk space insufficient',
    'SSL certificate validation failed',
    'Rate limit exceeded for API calls',
    'Service unavailable: monitoring service'
  ];

  const errors = [];

  for (let i = 0; i < count; i++) {
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const errorMessage = sampleErrors[Math.floor(Math.random() * sampleErrors.length)];
    const timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
    const resolved = Math.random() > 0.3; // 70% 해결됨

    const errorId = await aiDatabase.saveError({
      sessionId: `demo_session_${Math.floor(Math.random() * 1000)}`,
      timestamp,
      errorType,
      errorMessage,
      stackTrace: generateSampleStackTrace(),
      query: 'Sample query that caused the error',
      context: { userId: `demo_user_${Math.floor(Math.random() * 50)}` },
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      resolved,
      resolution: resolved ? 'Issue resolved by system restart' : undefined
    });

    errors.push(errorId);
  }

  return NextResponse.json({
    success: true,
    message: `${count}개의 에러 데이터가 생성되었습니다.`,
    generatedIds: errors
  });
}

// 모든 데모 데이터 생성
async function generateAllDemoData(count: number) {
  await generateInteractions(count);
  await generateErrors(Math.floor(count / 5)); // 에러는 상호작용의 1/5

  // 성능 메트릭 생성
  await aiDatabase.generatePerformanceMetrics();

  return NextResponse.json({
    success: true,
    message: `전체 데모 데이터가 생성되었습니다.`,
    details: {
      interactions: count,
      errors: Math.floor(count / 5),
      metricsGenerated: true
    }
  });
}

// 헬퍼 함수들
function generateSampleResponse(query: string, mode: string, success: boolean): string {
  if (!success) {
    return '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.';
  }

  const responses = {
    basic: [
      '서버 상태를 확인했습니다. 현재 모든 서버가 정상 작동 중입니다.',
      'CPU 사용률이 높은 서버 2대를 발견했습니다.',
      '메모리 부족 경고가 있는 서버는 현재 없습니다.',
      '네트워크 트래픽이 정상 범위 내에 있습니다.',
      '디스크 용량 부족 서버 1대를 발견했습니다.'
    ],
    advanced: [
      '🔍 **종합 서버 분석 결과**\n\n서버 상태를 상세히 분석한 결과, 전체 10대 중 8대가 정상 작동 중이며, 2대에서 경미한 성능 저하가 감지되었습니다.\n\n**주요 발견사항:**\n- CPU 사용률: 평균 45%, 최대 78%\n- 메모리 사용률: 평균 62%\n- 네트워크 지연시간: 평균 12ms\n\n**권장사항:**\n1. 고사용률 서버 모니터링 강화\n2. 메모리 최적화 검토\n3. 정기 성능 점검 실시',
      '📊 **고급 성능 분석**\n\nCPU 사용률 패턴을 분석한 결과, 피크 시간대(오후 2-4시)에 집중적인 부하가 발생하고 있습니다.\n\n**상세 분석:**\n- 서버 A: 85% (임계치 초과)\n- 서버 B: 72% (주의 필요)\n- 기타 서버: 정상 범위\n\n**최적화 제안:**\n1. 로드 밸런싱 재구성\n2. 스케일링 정책 조정\n3. 캐싱 전략 개선'
    ]
  };

  const modeResponses = responses[mode as keyof typeof responses] || responses.basic;
  return modeResponses[Math.floor(Math.random() * modeResponses.length)];
}

function generateSampleServerData(): any {
  return {
    servers: [
      { id: 'srv-001', status: 'online', cpu: Math.floor(Math.random() * 100), memory: Math.floor(Math.random() * 100) },
      { id: 'srv-002', status: 'warning', cpu: Math.floor(Math.random() * 100), memory: Math.floor(Math.random() * 100) },
      { id: 'srv-003', status: 'online', cpu: Math.floor(Math.random() * 100), memory: Math.floor(Math.random() * 100) }
    ],
    timestamp: Date.now()
  };
}

function generateSampleError(): string {
  const errors = [
    'Network timeout occurred',
    'Database connection failed',
    'Authentication service unavailable',
    'Memory allocation error',
    'Disk I/O error'
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}

function generateSampleStackTrace(): string {
  return `Error: Sample error occurred
    at processQuery (/app/src/modules/ai-agent/core/AIAgentEngine.ts:123:15)
    at async handleRequest (/app/src/app/api/ai-agent/route.ts:45:23)
    at async NextRequestHandler (/app/node_modules/next/dist/server/next-server.ts:89:12)`;
} 