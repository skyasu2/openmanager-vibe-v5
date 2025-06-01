/**
 * 🔗 AI 에이전트 통합 엔드포인트
 * 
 * ✅ 서버 데이터와 AI 분석 연결
 * ✅ 실시간 모니터링 데이터 처리
 * ✅ 통합 대시보드 데이터 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { SimulationEngine } from '../../../../services/simulationEngine';
import { unifiedAISystem } from '../../../../core/ai/unified-ai-system';

const simulationEngine = new SimulationEngine();

interface IntegratedData {
  servers: any[];
  metrics: any[];
  alerts: any[];
  aiAnalysis: any;
  timestamp: number;
}

/**
 * 🔗 통합 데이터 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const includeAI = searchParams.get('includeAI') !== 'false';
    const timeRange = searchParams.get('timeRange') || '1h';

    // 서버 데이터 수집
    const servers: any[] = simulationEngine.getServers();
    
    // 메트릭 데이터 생성
    const currentTime = Date.now();
    const metrics = servers.map((server: any) => ({
      serverId: server.id,
      serverName: server.name || `Server-${server.id}`,
      cpu: Math.round(Math.random() * 100),
      memory: Math.round(Math.random() * 100),
      disk: Math.round(Math.random() * 100),
      network: {
        in: Math.round(Math.random() * 1000),
        out: Math.round(Math.random() * 2000)
      },
      responseTime: Math.round(100 + Math.random() * 400),
      timestamp: currentTime,
      status: server.status
    }));

    // 알림 생성
    const criticalServers = servers.filter((s: any) => s.status === 'critical');
    const warningServers = servers.filter((s: any) => s.status === 'warning');
    
    const alerts = [
      ...criticalServers.map((server: any) => ({
        id: `alert-critical-${server.id}`,
        type: 'critical',
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        message: `${server.name || server.id} 서버가 심각한 상태입니다`,
        description: 'CPU 사용률 90% 이상, 메모리 부족 상태',
        timestamp: currentTime,
        resolved: false
      })),
      ...warningServers.map((server: any) => ({
        id: `alert-warning-${server.id}`,
        type: 'warning',
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        message: `${server.name || server.id} 서버에 경고가 발생했습니다`,
        description: '리소스 사용률이 임계값을 초과했습니다',
        timestamp: currentTime,
        resolved: false
      }))
    ];

    // AI 분석 (선택적)
    let aiAnalysis = null;
    if (includeAI) {
      try {
        await unifiedAISystem.initialize();
        
        const analysisQuery = {
          id: `integrated_analysis_${currentTime}`,
          text: `현재 ${servers.length}개 서버 중 ${criticalServers.length}개가 심각한 상태, ${warningServers.length}개가 경고 상태입니다. 시스템 전체 상황을 분석하고 권장사항을 제시해주세요.`,
          context: {
            servers: servers.length,
            critical: criticalServers.length,
            warning: warningServers.length,
            healthy: servers.length - criticalServers.length - warningServers.length
          }
        };

        const analysis = await unifiedAISystem.processQuery(analysisQuery);
        
        aiAnalysis = {
          id: analysis.id,
          summary: analysis.answer,
          confidence: analysis.confidence,
          recommendations: analysis.recommendations,
          patterns: (analysis.analysis as any)?.patterns || [],
          riskLevel: criticalServers.length > 0 ? 'high' : warningServers.length > 3 ? 'medium' : 'low',
          priority: criticalServers.length > 0 ? 'urgent' : 'normal',
          nextActions: analysis.actions || [],
          generatedAt: currentTime
        };
      } catch (error) {
        console.warn('⚠️ AI 분석 실패, 기본 분석 제공:', error);
        aiAnalysis = {
          id: `fallback_${currentTime}`,
          summary: `전체 ${servers.length}개 서버 중 ${criticalServers.length + warningServers.length}개 서버에서 이슈가 감지되었습니다.`,
          confidence: 0.7,
          recommendations: ['심각한 상태 서버 우선 점검', '리소스 사용률 모니터링 강화'],
          patterns: [],
          riskLevel: criticalServers.length > 0 ? 'high' : 'medium',
          priority: 'normal',
          nextActions: [],
          generatedAt: currentTime
        };
      }
    }

    const integratedData: IntegratedData = {
      servers: servers.map((server: any) => ({
        ...server,
        name: server.name || `Server-${server.id}`,
        metrics: metrics.find(m => m.serverId === server.id),
        alerts: alerts.filter(a => a.serverId === server.id)
      })),
      metrics,
      alerts,
      aiAnalysis,
      timestamp: currentTime
    };

    return NextResponse.json({
      success: true,
      data: integratedData,
      summary: {
        totalServers: servers.length,
        criticalServers: criticalServers.length,
        warningServers: warningServers.length,
        healthyServers: servers.length - criticalServers.length - warningServers.length,
        totalAlerts: alerts.length,
        aiAnalysisIncluded: includeAI,
        lastUpdated: currentTime
      },
      timestamp: currentTime
    });

  } catch (error) {
    console.error('❌ [Integrated] 통합 데이터 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: '통합 데이터 조회에 실패했습니다',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
}

/**
 * 🎯 특정 서버 AI 분석
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { serverId, action, context } = body;

    if (!serverId) {
      return NextResponse.json({
        success: false,
        error: 'serverId가 필요합니다',
        timestamp: Date.now()
      }, { status: 400 });
    }

    // 서버 정보 조회
    const servers: any[] = simulationEngine.getServers();
    const targetServer = servers.find((s: any) => s.id === serverId);

    if (!targetServer) {
      return NextResponse.json({
        success: false,
        error: '서버를 찾을 수 없습니다',
        timestamp: Date.now()
      }, { status: 404 });
    }

    // AI 분석 실행
    let analysisResult = null;
    if (action === 'analyze') {
      try {
        await unifiedAISystem.initialize();
        
        const query = {
          id: `server_analysis_${serverId}_${Date.now()}`,
          text: `${targetServer.name || targetServer.id} 서버 (상태: ${targetServer.status})에 대한 상세 분석을 해주세요. 현재 문제점과 개선방안을 제시해주세요.`,
          context: {
            server: targetServer,
            action,
            ...context
          }
        };

        const analysis = await unifiedAISystem.processQuery(query);
        analysisResult = {
          serverId,
          serverName: targetServer.name || targetServer.id,
          analysis: analysis.answer,
          confidence: analysis.confidence,
          recommendations: analysis.recommendations,
          actions: analysis.actions,
          generatedAt: Date.now()
        };
      } catch (error) {
        console.warn('⚠️ 서버 AI 분석 실패:', error);
        analysisResult = {
          serverId,
          serverName: targetServer.name || targetServer.id,
          analysis: `${targetServer.name || targetServer.id} 서버의 현재 상태는 ${targetServer.status}입니다. 상세 분석에 일시적인 문제가 있습니다.`,
          confidence: 0.5,
          recommendations: ['서버 상태 재확인', '로그 분석'],
          actions: [],
          generatedAt: Date.now()
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        server: {
          ...targetServer,
          name: targetServer.name || targetServer.id
        },
        analysis: analysisResult,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ [Integrated] 서버 분석 실패:', error);
    return NextResponse.json({
      success: false,
      error: '서버 분석에 실패했습니다',
      details: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 