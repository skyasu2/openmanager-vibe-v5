/**
 * 🤖 스마트 모니터링 AI 에이전트 API v3.0
 *
 * 기능:
 * - 통합 AI 엔진 기반 모니터링
 * - 실시간 알럿 조회
 * - AI 인사이트 제공
 * - 시스템 상태 모니터링
 */

import { NextRequest, NextResponse } from 'next/server';
import { integratedAIEngine } from '@/services/ai/integrated-ai-engine';

// 모의 데이터 생성 함수들
const generateMockAlerts = () => [
  {
    id: 'alert-001',
    severity: 'critical',
    type: 'system',
    message: 'CPU 사용률이 90%를 초과했습니다',
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-002',
    severity: 'high',
    type: 'memory',
    message: '메모리 사용률이 80%를 초과했습니다',
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
];

const generateMockInsights = () => [
  {
    id: 'insight-001',
    type: 'performance',
    title: 'CPU 최적화 필요',
    description: 'AI 분석 결과 CPU 집약적 프로세스가 감지되었습니다',
    impact: 'high',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'insight-002',
    type: 'cost',
    title: '리소스 최적화 기회',
    description: '메모리 사용량을 30% 줄일 수 있는 최적화 방법을 발견했습니다',
    impact: 'medium',
    timestamp: new Date().toISOString(),
  },
];

const generateMockRules = () => [
  {
    id: 'rule-001',
    name: 'CPU 임계값 모니터링',
    condition: 'cpu_usage > 80',
    enabled: true,
    severity: 'high',
  },
  {
    id: 'rule-002',
    name: '메모리 사용률 체크',
    condition: 'memory_usage > 85',
    enabled: true,
    severity: 'critical',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';
    const limit = parseInt(searchParams.get('limit') || '10');
    const alertId = searchParams.get('alertId');
    const ruleId = searchParams.get('ruleId');

    switch (type) {
      case 'status':
        const engineStatus = await integratedAIEngine.getEngineStatus();
        return NextResponse.json({
          success: true,
          data: {
            ai_engine: engineStatus,
            monitoring_active: true,
            last_check: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });

      case 'alerts':
        if (alertId) {
          return NextResponse.json(
            { success: false, error: '특정 알럿 조회는 지원되지 않습니다' },
            { status: 400 }
          );
        } else {
          const alerts = generateMockAlerts();
          return NextResponse.json({
            success: true,
            data: alerts.slice(0, limit),
            count: alerts.length,
            timestamp: new Date().toISOString(),
          });
        }

      case 'insights':
        const insights = generateMockInsights();
        return NextResponse.json({
          success: true,
          data: insights.slice(0, limit),
          count: insights.length,
          timestamp: new Date().toISOString(),
        });

      case 'rules':
        if (ruleId) {
          const rules = generateMockRules();
          const rule = rules.find(r => r.id === ruleId);
          if (!rule) {
            return NextResponse.json(
              { success: false, error: '룰을 찾을 수 없습니다' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: rule,
            timestamp: new Date().toISOString(),
          });
        } else {
          const rules = generateMockRules();
          return NextResponse.json({
            success: true,
            data: rules,
            count: rules.length,
            timestamp: new Date().toISOString(),
          });
        }

      case 'dashboard':
        // 대시보드용 종합 데이터
        const dashboardAlerts = generateMockAlerts();
        const dashboardInsights = generateMockInsights();
        const dashboardRules = generateMockRules();
        const dashboardEngineStatus =
          await integratedAIEngine.getEngineStatus();

        return NextResponse.json({
          success: true,
          data: {
            alerts: {
              total: dashboardAlerts.length,
              critical: dashboardAlerts.filter(
                (a: any) => a.severity === 'critical'
              ).length,
              high: dashboardAlerts.filter((a: any) => a.severity === 'high')
                .length,
              medium: dashboardAlerts.filter(
                (a: any) => a.severity === 'medium'
              ).length,
              low: dashboardAlerts.filter((a: any) => a.severity === 'low')
                .length,
              recent: dashboardAlerts.slice(0, 5),
            },
            insights: {
              total: dashboardInsights.length,
              performance: dashboardInsights.filter(
                (i: any) => i.type === 'performance'
              ).length,
              cost: dashboardInsights.filter((i: any) => i.type === 'cost')
                .length,
              security: dashboardInsights.filter(
                (i: any) => i.type === 'security'
              ).length,
              recent: dashboardInsights,
            },
            rules: {
              total: dashboardRules.length,
              enabled: dashboardRules.filter((r: any) => r.enabled).length,
              disabled: dashboardRules.filter((r: any) => !r.enabled).length,
            },
            ai_engine: dashboardEngineStatus,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 타입입니다' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 스마트 모니터링 에이전트 GET API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '모니터링 에이전트 조회 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, ruleId } = body;

    switch (action) {
      case 'start-monitoring':
        return NextResponse.json({
          success: true,
          message: '통합 AI 엔진 모니터링이 시작되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'stop-monitoring':
        return NextResponse.json({
          success: true,
          message: '통합 AI 엔진 모니터링이 중지되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'acknowledge-alert':
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: 'alertId가 필요합니다' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '알럿이 확인되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: 'alertId가 필요합니다' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '알럿이 해결되었습니다',
          timestamp: new Date().toISOString(),
        });

      case 'ai-analyze':
        // AI 엔진을 통한 분석 요청
        try {
          await integratedAIEngine.initialize();
          const result = await integratedAIEngine.processQuery({
            query: body.query || '시스템 상태를 분석해주세요',
            context: {
              language: 'ko',
              include_predictions: true,
            },
          });

          return NextResponse.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
          });
        } catch (aiError) {
          return NextResponse.json(
            { success: false, error: 'AI 분석 실패', details: aiError },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 스마트 모니터링 에이전트 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '모니터링 에이전트 액션 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
