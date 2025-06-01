/**
 * 🔍 Pattern Check API v1.0
 * 
 * OpenManager v5.21.0 - 패턴 매칭 및 이상 탐지
 * GET: 패턴 룰 및 알림 조회
 * POST: 메트릭 분석 및 패턴 매칭 실행
 * PUT: 패턴 룰 관리
 * DELETE: 룰 삭제 또는 알림 확인
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatternMatcherEngine, MetricData } from '@/engines/PatternMatcherEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 📊 패턴 룰 및 알림 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const serverId = searchParams.get('serverId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const engine = getPatternMatcherEngine();

    switch (type) {
      case 'rules':
        const rules = engine.getRules();
        return NextResponse.json({
          success: true,
          data: {
            type: 'rules',
            rules,
            count: rules.length
          }
        });

      case 'alerts':
        const alerts = engine.getAlerts(limit);
        return NextResponse.json({
          success: true,
          data: {
            type: 'alerts',
            alerts,
            count: alerts.length,
            limit
          }
        });

      case 'stats':
        const statistics = engine.getStats();
        return NextResponse.json({
          success: true,
          data: {
            type: 'stats',
            stats: statistics,
            timestamp: Date.now()
          }
        });

      case 'metrics':
        if (!serverId) {
          return NextResponse.json({
            success: false,
            error: 'serverId가 필요합니다'
          }, { status: 400 });
        }
        
        const metrics = engine.getServerMetrics(serverId, limit);
        const baseline = engine.getBaseline(serverId);
        
        return NextResponse.json({
          success: true,
          data: {
            type: 'metrics',
            serverId,
            metrics,
            baseline,
            count: metrics.length
          }
        });

      case 'overview':
      default:
        const overviewStats = engine.getStats();
        const recentAlerts = engine.getAlerts(10);
        const activeRules = engine.getRules().filter(r => r.enabled);

        return NextResponse.json({
          success: true,
          data: {
            type: 'overview',
            stats: overviewStats,
            recentAlerts,
            activeRules: activeRules.length,
            totalRules: activeRules.length + engine.getRules().filter(r => !r.enabled).length
          }
        });
    }

  } catch (error) {
    console.error('❌ 패턴 매칭 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '패턴 매칭 조회 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * 🔍 메트릭 분석 및 패턴 매칭 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, metrics, ruleData } = body;

    const engine = getPatternMatcherEngine();

    switch (action) {
      case 'analyze':
        if (!metrics || !Array.isArray(metrics)) {
          return NextResponse.json({
            success: false,
            error: '유효한 메트릭 데이터가 필요합니다'
          }, { status: 400 });
        }

        const allAlerts = [];
        for (const metric of metrics) {
          // 메트릭 데이터 검증
          const validatedMetric: MetricData = {
            serverId: metric.serverId,
            timestamp: metric.timestamp || Date.now(),
            cpu: Number(metric.cpu) || 0,
            memory: Number(metric.memory) || 0,
            network: Number(metric.network) || 0,
            disk: Number(metric.disk) || 0,
            responseTime: Number(metric.responseTime) || 0,
            errorRate: Number(metric.errorRate) || 0
          };

          const alerts = engine.analyzeMetrics(validatedMetric);
          allAlerts.push(...alerts);
        }

        return NextResponse.json({
          success: true,
          data: {
            action: 'analyze',
            processed: metrics.length,
            alertsGenerated: allAlerts.length,
            alerts: allAlerts,
            timestamp: Date.now()
          }
        });

      case 'add_rule':
        if (!ruleData) {
          return NextResponse.json({
            success: false,
            error: '룰 데이터가 필요합니다'
          }, { status: 400 });
        }

        // 필수 필드 검증
        const requiredFields = ['name', 'description', 'condition', 'severity'];
        for (const field of requiredFields) {
          if (!ruleData[field]) {
            return NextResponse.json({
              success: false,
              error: `${field}가 필요합니다`
            }, { status: 400 });
          }
        }

        const ruleId = engine.addRule({
          name: ruleData.name,
          description: ruleData.description,
          condition: ruleData.condition,
          severity: ruleData.severity,
          enabled: ruleData.enabled !== false,
          cooldown: ruleData.cooldown || 5 * 60 * 1000,
          adaptiveThreshold: ruleData.adaptiveThreshold !== false,
          learned: false
        });

        return NextResponse.json({
          success: true,
          data: {
            action: 'add_rule',
            ruleId,
            message: '새 패턴 룰이 추가되었습니다'
          }
        });

      case 'test_condition':
        if (!ruleData?.condition || !metrics?.[0]) {
          return NextResponse.json({
            success: false,
            error: '조건과 테스트 메트릭이 필요합니다'
          }, { status: 400 });
        }

        try {
          const testMetric = metrics[0];
          const { cpu, memory, network, disk, responseTime, errorRate } = testMetric;
          
          // 조건 테스트용 임시 Function 생성
          const expression = ruleData.condition
            .replace(/\band\b/gi, '&&')
            .replace(/\bor\b/gi, '||')
            .replace(/\bnot\b/gi, '!');

          const testFunction = new Function('cpu', 'memory', 'network', 'disk', 'responseTime', 'errorRate', 
            `return ${expression}`);
          
          const result = testFunction(cpu, memory, network, disk, responseTime, errorRate);

          return NextResponse.json({
            success: true,
            data: {
              action: 'test_condition',
              condition: ruleData.condition,
              testMetric,
              result,
              message: result ? '조건이 참입니다' : '조건이 거짓입니다'
            }
          });

        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `조건 평가 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
          }, { status: 400 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 액션입니다'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 패턴 매칭 실행 오류:', error);
    return NextResponse.json({
      success: false,
      error: '패턴 매칭 실행 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * ✏️ 패턴 룰 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates, alertId } = body;

    const engine = getPatternMatcherEngine();

    // 알림 확인 처리
    if (alertId) {
      const result = engine.acknowledgeAlert(alertId);
      return NextResponse.json({
        success: result,
        data: {
          action: 'acknowledge_alert',
          alertId,
          message: result ? '알림이 확인되었습니다' : '알림을 찾을 수 없습니다'
        }
      });
    }

    // 룰 업데이트
    if (!ruleId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'ruleId와 updates가 필요합니다'
      }, { status: 400 });
    }

    const result = engine.updateRule(ruleId, updates);
    
    return NextResponse.json({
      success: result,
      data: {
        action: 'update_rule',
        ruleId,
        updates,
        message: result ? '룰이 업데이트되었습니다' : '룰을 찾을 수 없습니다'
      }
    });

  } catch (error) {
    console.error('❌ 패턴 룰 업데이트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '패턴 룰 업데이트 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

/**
 * 🗑️ 패턴 룰 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json({
        success: false,
        error: 'ruleId가 필요합니다'
      }, { status: 400 });
    }

    const engine = getPatternMatcherEngine();
    const result = engine.deleteRule(ruleId);

    return NextResponse.json({
      success: result,
      data: {
        action: 'delete_rule',
        ruleId,
        message: result ? '룰이 삭제되었습니다' : '룰을 찾을 수 없습니다'
      }
    });

  } catch (error) {
    console.error('❌ 패턴 룰 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '패턴 룰 삭제 중 오류가 발생했습니다'
    }, { status: 500 });
  }
} 