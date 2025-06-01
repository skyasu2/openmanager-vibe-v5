/**
 * 🤖 스마트 모니터링 AI 에이전트 API
 * 
 * 기능:
 * - 모니터링 룰 관리
 * - 실시간 알럿 조회
 * - AI 인사이트 제공
 * - 에이전트 제어
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartMonitoringAgent } from '@/services/ai-agent/SmartMonitoringAgent';

// 에이전트 초기화 (한 번만)
let isInitialized = false;
const initializeAgent = async () => {
  if (!isInitialized) {
    await smartMonitoringAgent.initialize();
    isInitialized = true;
  }
};

export async function GET(request: NextRequest) {
  try {
    // 에이전트 초기화
    await initializeAgent();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';
    const limit = parseInt(searchParams.get('limit') || '10');
    const alertId = searchParams.get('alertId');
    const ruleId = searchParams.get('ruleId');

    switch (type) {
      case 'status':
        const healthData = await smartMonitoringAgent.healthCheck();
        return NextResponse.json({
          success: true,
          data: healthData,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        if (alertId) {
          // 특정 알럿 조회는 구현하지 않음 (현재 구조상)
          return NextResponse.json(
            { success: false, error: '특정 알럿 조회는 지원되지 않습니다' },
            { status: 400 }
          );
        } else {
          const alerts = smartMonitoringAgent.getActiveAlerts();
          return NextResponse.json({
            success: true,
            data: alerts.slice(0, limit),
            count: alerts.length,
            timestamp: new Date().toISOString()
          });
        }

      case 'insights':
        const insights = smartMonitoringAgent.getRecentInsights(limit);
        return NextResponse.json({
          success: true,
          data: insights,
          count: insights.length,
          timestamp: new Date().toISOString()
        });

      case 'rules':
        if (ruleId) {
          const rules = smartMonitoringAgent.getMonitoringRules();
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
            timestamp: new Date().toISOString()
          });
        } else {
          const rules = smartMonitoringAgent.getMonitoringRules();
          return NextResponse.json({
            success: true,
            data: rules,
            count: rules.length,
            timestamp: new Date().toISOString()
          });
        }

      case 'dashboard':
        // 대시보드용 종합 데이터
        const [dashboardAlerts, dashboardInsights, dashboardRules, dashboardHealth] = await Promise.all([
          smartMonitoringAgent.getActiveAlerts(),
          smartMonitoringAgent.getRecentInsights(5),
          smartMonitoringAgent.getMonitoringRules(),
          smartMonitoringAgent.healthCheck()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            alerts: {
              total: dashboardAlerts.length,
              critical: dashboardAlerts.filter(a => a.severity === 'critical').length,
              high: dashboardAlerts.filter(a => a.severity === 'high').length,
              medium: dashboardAlerts.filter(a => a.severity === 'medium').length,
              low: dashboardAlerts.filter(a => a.severity === 'low').length,
              recent: dashboardAlerts.slice(0, 5)
            },
            insights: {
              total: dashboardInsights.length,
              performance: dashboardInsights.filter(i => i.type === 'performance').length,
              cost: dashboardInsights.filter(i => i.type === 'cost').length,
              security: dashboardInsights.filter(i => i.type === 'security').length,
              recent: dashboardInsights
            },
            rules: {
              total: dashboardRules.length,
              enabled: dashboardRules.filter(r => r.enabled).length,
              disabled: dashboardRules.filter(r => !r.enabled).length
            },
            health: dashboardHealth
          },
          timestamp: new Date().toISOString()
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeAgent();
    
    const body = await request.json();
    const { action, alertId, ruleId, rule, updates } = body;

    switch (action) {
      case 'start-monitoring':
        smartMonitoringAgent.startMonitoring();
        return NextResponse.json({
          success: true,
          message: '스마트 모니터링이 시작되었습니다',
          timestamp: new Date().toISOString()
        });

      case 'stop-monitoring':
        smartMonitoringAgent.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: '스마트 모니터링이 중지되었습니다',
          timestamp: new Date().toISOString()
        });

      case 'acknowledge-alert':
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: 'alertId가 필요합니다' },
            { status: 400 }
          );
        }
        
        const ackResult = smartMonitoringAgent.acknowledgeAlert(alertId);
        if (ackResult) {
          return NextResponse.json({
            success: true,
            message: '알럿이 확인되었습니다',
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json(
            { success: false, error: '알럿을 찾을 수 없습니다' },
            { status: 404 }
          );
        }

      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: 'alertId가 필요합니다' },
            { status: 400 }
          );
        }
        
        const resolveResult = smartMonitoringAgent.resolveAlert(alertId);
        if (resolveResult) {
          return NextResponse.json({
            success: true,
            message: '알럿이 해결되었습니다',
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json(
            { success: false, error: '알럿을 찾을 수 없습니다' },
            { status: 404 }
          );
        }

      case 'add-rule':
        if (!rule) {
          return NextResponse.json(
            { success: false, error: 'rule 데이터가 필요합니다' },
            { status: 400 }
          );
        }
        
        // 기본값 설정
        const newRule = {
          id: `rule-${Date.now()}`,
          enabled: true,
          cooldown: 300000, // 5분
          ...rule
        };
        
        smartMonitoringAgent.addRule(newRule);
        return NextResponse.json({
          success: true,
          message: '새 모니터링 룰이 추가되었습니다',
          data: newRule,
          timestamp: new Date().toISOString()
        });

      case 'update-rule':
        if (!ruleId || !updates) {
          return NextResponse.json(
            { success: false, error: 'ruleId와 updates가 필요합니다' },
            { status: 400 }
          );
        }
        
        const updateResult = smartMonitoringAgent.updateRule(ruleId, updates);
        if (updateResult) {
          return NextResponse.json({
            success: true,
            message: '모니터링 룰이 업데이트되었습니다',
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json(
            { success: false, error: '룰을 찾을 수 없습니다' },
            { status: 404 }
          );
        }

      case 'remove-rule':
        if (!ruleId) {
          return NextResponse.json(
            { success: false, error: 'ruleId가 필요합니다' },
            { status: 400 }
          );
        }
        
        const removeResult = smartMonitoringAgent.removeRule(ruleId);
        if (removeResult) {
          return NextResponse.json({
            success: true,
            message: '모니터링 룰이 제거되었습니다',
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json(
            { success: false, error: '룰을 찾을 수 없습니다' },
            { status: 404 }
          );
        }

      case 'toggle-rule':
        if (!ruleId) {
          return NextResponse.json(
            { success: false, error: 'ruleId가 필요합니다' },
            { status: 400 }
          );
        }
        
        const rules = smartMonitoringAgent.getMonitoringRules();
        const targetRule = rules.find(r => r.id === ruleId);
        
        if (!targetRule) {
          return NextResponse.json(
            { success: false, error: '룰을 찾을 수 없습니다' },
            { status: 404 }
          );
        }
        
        const toggleResult = smartMonitoringAgent.updateRule(ruleId, { enabled: !targetRule.enabled });
        if (toggleResult) {
          return NextResponse.json({
            success: true,
            message: `모니터링 룰이 ${!targetRule.enabled ? '활성화' : '비활성화'}되었습니다`,
            data: { enabled: !targetRule.enabled },
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json(
            { success: false, error: '룰 토글 실패' },
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
        error: 'POST 요청 처리에 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 