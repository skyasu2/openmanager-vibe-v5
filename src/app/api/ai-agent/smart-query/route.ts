/**
 * 🤖 AI 에이전트 스마트 쿼리 API
 *
 * ✅ 추천 질문 생성
 * ✅ 컨텍스트 기반 질의 제안
 * ✅ 실시간 시스템 상태 기반 질문 자동 생성
 */

import { NextRequest, NextResponse } from 'next/server';
// import { SimulationEngine } from '@/services/simulationEngine'; // 🗑️ UnifiedMetricsManager로 대체
import { unifiedMetricsManager } from '@/services/UnifiedMetricsManager';

// const simulationEngine = new SimulationEngine(); // 🗑️ 제거

interface SmartQuery {
  id: string;
  question: string;
  category: 'performance' | 'security' | 'prediction' | 'analysis';
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  expectedResponseTime: number;
  isAIGenerated: boolean;
}

/**
 * 📊 스마트 쿼리 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 현재 시스템 상태 기반으로 추천 질문 생성
    const servers = unifiedMetricsManager.getServers();
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const totalServers = servers.length;

    const smartQueries: SmartQuery[] = [];

    // 상황별 추천 질문 생성
    if (criticalServers > 0) {
      smartQueries.push({
        id: 'critical-analysis-1',
        question: `${criticalServers}개의 심각한 상태 서버가 있습니다. 즉시 조치가 필요한 서버를 우선순위별로 분석해주세요.`,
        category: 'analysis',
        priority: 'critical',
        context: `${criticalServers}개 심각, ${warningServers}개 경고, 총 ${totalServers}개 서버`,
        expectedResponseTime: 3000,
        isAIGenerated: true,
      });
    }

    if (warningServers > totalServers * 0.3) {
      smartQueries.push({
        id: 'warning-prediction-1',
        question: `경고 상태 서버가 ${warningServers}개로 전체의 ${Math.round((warningServers / totalServers) * 100)}%입니다. 심각한 상태로 전환될 가능성이 있는 서버를 예측해주세요.`,
        category: 'prediction',
        priority: 'high',
        context: `경고율 ${Math.round((warningServers / totalServers) * 100)}%`,
        expectedResponseTime: 2500,
        isAIGenerated: true,
      });
    }

    // 일반적인 추천 질문들
    const defaultQueries: SmartQuery[] = [
      {
        id: 'perf-overview',
        question: '현재 시스템의 전반적인 성능 상태는 어떤가요?',
        category: 'performance',
        priority: 'medium',
        context: '전체 시스템 개요',
        expectedResponseTime: 2000,
        isAIGenerated: false,
      },
      {
        id: 'security-check',
        question: '보안상 위험한 패턴이나 비정상적인 활동이 감지되나요?',
        category: 'security',
        priority: 'medium',
        context: '보안 모니터링',
        expectedResponseTime: 3500,
        isAIGenerated: false,
      },
      {
        id: 'prediction-1h',
        question: '향후 1시간 내 장애 가능성이 있는 서버는 어디인가요?',
        category: 'prediction',
        priority: 'high',
        context: '단기 예측',
        expectedResponseTime: 4000,
        isAIGenerated: false,
      },
      {
        id: 'optimization',
        question: '비용 절감을 위한 최적화 방안을 제안해주세요',
        category: 'analysis',
        priority: 'low',
        context: '비용 최적화',
        expectedResponseTime: 5000,
        isAIGenerated: false,
      },
      {
        id: 'cpu-analysis',
        question: 'CPU 사용률이 높은 서버들을 분석하고 원인을 찾아주세요',
        category: 'performance',
        priority: 'medium',
        context: 'CPU 모니터링',
        expectedResponseTime: 2800,
        isAIGenerated: false,
      },
      {
        id: 'memory-trend',
        question: '메모리 사용량 트렌드를 분석하고 향후 이슈를 예측해주세요',
        category: 'prediction',
        priority: 'medium',
        context: '메모리 분석',
        expectedResponseTime: 3200,
        isAIGenerated: false,
      },
    ];

    // AI 생성 질문과 기본 질문 결합
    const allQueries = [...smartQueries, ...defaultQueries];

    // 필터링
    let filteredQueries = allQueries;
    if (category) {
      filteredQueries = filteredQueries.filter(q => q.category === category);
    }
    if (priority) {
      filteredQueries = filteredQueries.filter(q => q.priority === priority);
    }

    // 우선순위별 정렬 및 제한
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredQueries.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );
    filteredQueries = filteredQueries.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        queries: filteredQueries,
        totalCount: filteredQueries.length,
        systemContext: {
          totalServers,
          criticalServers,
          warningServers,
          healthyServers: totalServers - criticalServers - warningServers,
          timestamp: Date.now(),
        },
        metadata: {
          generatedQueries: smartQueries.length,
          defaultQueries: defaultQueries.length,
          isRealTimeGenerated: true,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ [SmartQuery] 스마트 쿼리 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '스마트 쿼리 생성에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 사용자 맞춤형 쿼리 생성
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { userId, preferences, context } = body;

    // 사용자 선호도 기반 쿼리 생성
    const customQueries: SmartQuery[] = [
      {
        id: `custom-${userId}-1`,
        question: '내가 관심있어하는 영역에서 주의할 점이 있나요?',
        category: preferences?.preferredCategory || 'performance',
        priority: 'medium',
        context: `사용자 ${userId} 맞춤형`,
        expectedResponseTime: 2500,
        isAIGenerated: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        queries: customQueries,
        userId,
        preferences,
        generatedAt: Date.now(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ [SmartQuery] 맞춤형 쿼리 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '맞춤형 쿼리 생성에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
