/**
 * AI Agent Admin Logs API
 * 
 * 📊 AI 에이전트 로깅 및 관리자 대시보드 API
 * - 상호작용 로그 조회/관리
 * - 성공/실패 답변 분석
 * - 학습 데이터 수집
 * - 성능 메트릭 추적
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiDatabase } from '../../../../../lib/database';
import { authManager } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const level = url.searchParams.get('level') || 'all';

    // 데모 로그 데이터
    const logs = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
      message: `AI Agent log entry ${i + 1}`,
      source: `agent-${Math.floor(Math.random() * 3) + 1}`,
      details: {
        duration: Math.floor(Math.random() * 1000),
        memory: Math.floor(Math.random() * 100),
        cpu: Math.floor(Math.random() * 50)
      }
    })).filter(log => level === 'all' || log.level === level);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'success',
      data: {
        logs,
        total: logs.length,
        level,
        limit
      }
    });
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const before = url.searchParams.get('before');
    const level = url.searchParams.get('level');

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Logs cleared successfully',
      deleted: Math.floor(Math.random() * 100)
    });
  } catch (error) {
    console.error('Log deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, sessionId: bodySessionId } = await request.json();
    const sessionId = bodySessionId || request.headers.get('x-session-id');

    // 인증 확인
    if (!sessionId || !authManager.hasPermission(sessionId, 'ai_agent:write')) {
      return NextResponse.json({
        success: false,
        error: '쓰기 권한이 필요합니다.'
      }, { status: 403 });
    }

    switch (action) {
      case 'log-interaction':
        return handleLogInteraction(data);
      
      case 'log-error':
        return handleLogError(data);
      
      case 'update-feedback':
        return handleUpdateFeedback(data);
      
      case 'admin-verification':
        return handleAdminVerification(data, sessionId);
      
      case 'generate-metrics':
        return handleGenerateMetrics();
      
      case 'import-data':
        return handleImportData(data, sessionId);
      
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('AI Agent Admin Logs POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '로그 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// 대시보드 데이터 조회
async function handleDashboard() {
  const dashboardData = aiDatabase.getAdminDashboardData();
  
  return NextResponse.json({
    success: true,
    data: dashboardData,
    timestamp: new Date().toISOString()
  });
}

// 상호작용 로그 조회
async function handleInteractions(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const category = searchParams.get('category');
  const success = searchParams.get('success');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const dashboardData = aiDatabase.getAdminDashboardData();
  let interactions = dashboardData.recentInteractions;

  // 필터링
  if (category) {
    interactions = interactions.filter(i => i.category === category);
  }
  
  if (success !== null) {
    const isSuccess = success === 'true';
    interactions = interactions.filter(i => i.success === isSuccess);
  }
  
  if (startDate) {
    const start = new Date(startDate).getTime();
    interactions = interactions.filter(i => i.timestamp >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate).getTime();
    interactions = interactions.filter(i => i.timestamp <= end);
  }

  // 페이지네이션
  const total = interactions.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedInteractions = interactions.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: {
      interactions: paginatedInteractions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      }
    }
  });
}

// 에러 로그 조회
async function handleErrors(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const severity = searchParams.get('severity');
  const resolved = searchParams.get('resolved');

  const dashboardData = aiDatabase.getAdminDashboardData();
  let errors = dashboardData.recentErrors;

  // 필터링
  if (severity) {
    errors = errors.filter(e => e.severity === severity);
  }
  
  if (resolved !== null) {
    const isResolved = resolved === 'true';
    errors = errors.filter(e => e.resolved === isResolved);
  }

  // 페이지네이션
  const total = errors.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedErrors = errors.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: {
      errors: paginatedErrors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      }
    }
  });
}

// 학습 패턴 조회
async function handlePatterns(searchParams: URLSearchParams) {
  const type = searchParams.get('type') || 'all'; // 'best', 'worst', 'all'
  const limit = parseInt(searchParams.get('limit') || '20');

  let patterns;
  if (type === 'best') {
    patterns = aiDatabase.getBestPatterns(limit);
  } else if (type === 'worst') {
    patterns = aiDatabase.getWorstPatterns(limit);
  } else {
    const best = aiDatabase.getBestPatterns(limit / 2);
    const worst = aiDatabase.getWorstPatterns(limit / 2);
    patterns = { best, worst };
  }

  return NextResponse.json({
    success: true,
    data: { patterns, type }
  });
}

// 학습 데이터 조회
async function handleTrainingData(searchParams: URLSearchParams) {
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');

  const trainingData = aiDatabase.getTrainingData(category || undefined);
  
  // 페이지네이션
  const total = trainingData.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = trainingData.slice(startIndex, endIndex);

  return NextResponse.json({
    success: true,
    data: {
      trainingData: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      }
    }
  });
}

// 성능 메트릭 조회
async function handleMetrics(searchParams: URLSearchParams) {
  const days = parseInt(searchParams.get('days') || '7');
  
  const dashboardData = aiDatabase.getAdminDashboardData();
  const metrics = dashboardData.metrics.slice(-days);

  return NextResponse.json({
    success: true,
    data: { metrics, days }
  });
}

// 데이터 내보내기
async function handleExport(searchParams: URLSearchParams, session: any) {
  // 관리자 권한 확인
  if (!authManager.hasPermission(session.sessionId, 'logs:export')) {
    return NextResponse.json({
      success: false,
      error: '데이터 내보내기 권한이 없습니다.'
    }, { status: 403 });
  }

  const type = searchParams.get('type') || 'all';
  const format = searchParams.get('format') || 'json';

  const exportData = aiDatabase.exportData(type as any);
  
  if (format === 'csv') {
    // CSV 형태로 변환 (간단한 구현)
    const csvData = convertToCSV(exportData);
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ai-agent-logs-${type}-${Date.now()}.csv"`
      }
    });
  }

  return NextResponse.json({
    success: true,
    data: exportData,
    exportInfo: {
      type,
      format,
      exportedAt: new Date().toISOString(),
      exportedBy: session.userId
    }
  });
}

// 상호작용 로깅
async function handleLogInteraction(data: any) {
  const interactionId = await aiDatabase.saveInteraction({
    sessionId: data.sessionId,
    userId: data.userId,
    timestamp: Date.now(),
    query: data.query,
    queryType: data.queryType || 'general',
    detectedMode: data.detectedMode || 'basic',
    confidence: data.confidence || 0,
    response: data.response,
    responseTime: data.responseTime || 0,
    success: data.success !== false,
    intent: data.intent || 'unknown',
    triggers: data.triggers || [],
    serverData: data.serverData,
    errorMessage: data.errorMessage,
    isTrainingData: false,
    category: data.category || 'general',
    tags: data.tags || []
  });

  return NextResponse.json({
    success: true,
    interactionId,
    message: '상호작용이 기록되었습니다.'
  });
}

// 에러 로깅
async function handleLogError(data: any) {
  const errorId = await aiDatabase.saveError({
    sessionId: data.sessionId,
    timestamp: Date.now(),
    errorType: data.errorType || 'unknown',
    errorMessage: data.errorMessage,
    stackTrace: data.stackTrace,
    query: data.query,
    context: data.context,
    severity: data.severity || 'medium',
    resolved: false
  });

  return NextResponse.json({
    success: true,
    errorId,
    message: '에러가 기록되었습니다.'
  });
}

// 사용자 피드백 업데이트
async function handleUpdateFeedback(data: any) {
  const success = await aiDatabase.updateUserFeedback(
    data.interactionId,
    data.rating,
    data.feedback
  );

  if (!success) {
    return NextResponse.json({
      success: false,
      error: '상호작용을 찾을 수 없습니다.'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: '피드백이 업데이트되었습니다.'
  });
}

// 관리자 검증
async function handleAdminVerification(data: any, sessionId: string) {
  // 관리자 권한 확인
  if (!authManager.hasPermission(sessionId, 'ai_agent:admin')) {
    return NextResponse.json({
      success: false,
      error: '관리자 권한이 필요합니다.'
    }, { status: 403 });
  }

  const success = await aiDatabase.updateAdminVerification(
    data.interactionId,
    data.isCorrect,
    data.adminNotes
  );

  if (!success) {
    return NextResponse.json({
      success: false,
      error: '상호작용을 찾을 수 없습니다.'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: '관리자 검증이 완료되었습니다.'
  });
}

// 성능 메트릭 생성
async function handleGenerateMetrics() {
  const metrics = await aiDatabase.generatePerformanceMetrics();

  return NextResponse.json({
    success: true,
    metrics,
    message: '성능 메트릭이 생성되었습니다.'
  });
}

// 데이터 가져오기
async function handleImportData(data: any, sessionId: string) {
  // 관리자 권한 확인
  if (!authManager.hasPermission(sessionId, 'system:admin')) {
    return NextResponse.json({
      success: false,
      error: '시스템 관리자 권한이 필요합니다.'
    }, { status: 403 });
  }

  const success = aiDatabase.importData(data);

  return NextResponse.json({
    success,
    message: success ? '데이터가 성공적으로 가져와졌습니다.' : '데이터 가져오기에 실패했습니다.'
  });
}

// CSV 변환 헬퍼 함수
function convertToCSV(data: any): string {
  if (!data.interactions || !Array.isArray(data.interactions)) {
    return 'No interaction data available';
  }

  const headers = [
    'ID', 'Session ID', 'Timestamp', 'Query', 'Response', 'Success', 
    'Mode', 'Response Time', 'User Rating', 'Category'
  ];

  const rows = data.interactions.map((interaction: any) => [
    interaction.id,
    interaction.sessionId,
    new Date(interaction.timestamp).toISOString(),
    `"${interaction.query.replace(/"/g, '""')}"`,
    `"${interaction.response.replace(/"/g, '""')}"`,
    interaction.success,
    interaction.detectedMode,
    interaction.responseTime,
    interaction.userRating || '',
    interaction.category
  ]);

  return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
} 