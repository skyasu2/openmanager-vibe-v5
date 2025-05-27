/**
 * 🚨 Alerts Management API
 * 
 * 알림 시스템 관리 API
 * - 활성 알림 조회
 * - 알림 히스토리 조회
 * - 알림 확인/해결
 * - 알림 규칙 관리
 * - 알림 통계
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertSystem } from '@/services/AlertSystem';

// GET: 알림 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'active': {
        // 활성 알림 조회
        const activeAlerts = alertSystem.getActiveAlerts();
        
        return NextResponse.json({
          success: true,
          data: {
            alerts: activeAlerts,
            count: activeAlerts.length
          }
        });
      }

      case 'history': {
        // 알림 히스토리 조회
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = alertSystem.getAlertHistory(limit);
        
        return NextResponse.json({
          success: true,
          data: {
            alerts: history,
            count: history.length
          }
        });
      }

      case 'stats': {
        // 알림 통계 조회
        const stats = alertSystem.getAlertStats();
        
        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      case 'rules': {
        // 알림 규칙 조회
        const rules = alertSystem.getRules();
        
        return NextResponse.json({
          success: true,
          data: {
            rules,
            count: rules.length
          }
        });
      }

      case 'status': {
        // 알림 시스템 상태 조회
        const isRunning = alertSystem.isRunning;
        const activeAlerts = alertSystem.getActiveAlerts();
        const stats = alertSystem.getAlertStats();
        
        return NextResponse.json({
          success: true,
          data: {
            isRunning,
            activeAlertsCount: activeAlerts.length,
            criticalAlertsCount: activeAlerts.filter(a => a.severity === 'critical').length,
            stats,
            timestamp: new Date().toISOString()
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: active, history, stats, rules, status'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Alerts API] GET 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: 알림 시스템 관리 작업
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start-monitoring': {
        // 알림 모니터링 시작
        alertSystem.startMonitoring();
        
        return NextResponse.json({
          success: true,
          message: '알림 시스템 모니터링이 시작되었습니다.',
          data: {
            isRunning: alertSystem.isRunning,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'stop-monitoring': {
        // 알림 모니터링 중지
        alertSystem.stopMonitoring();
        
        return NextResponse.json({
          success: true,
          message: '알림 시스템 모니터링이 중지되었습니다.',
          data: {
            isRunning: alertSystem.isRunning,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'acknowledge': {
        // 알림 확인
        const { alertId, acknowledgedBy } = body;
        
        if (!alertId || !acknowledgedBy) {
          return NextResponse.json({
            success: false,
            error: 'alertId와 acknowledgedBy 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertSystem.acknowledgeAlert(alertId, acknowledgedBy);
        
        return NextResponse.json({
          success: true,
          message: '알림이 확인되었습니다.',
          data: {
            alertId,
            acknowledgedBy,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'resolve': {
        // 알림 해결
        const { alertId } = body;
        
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'alertId 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertSystem.resolveAlert(alertId);
        
        return NextResponse.json({
          success: true,
          message: '알림이 해결되었습니다.',
          data: {
            alertId,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'add-rule': {
        // 알림 규칙 추가
        const { rule } = body;
        
        if (!rule) {
          return NextResponse.json({
            success: false,
            error: 'rule 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertSystem.addRule(rule);
        
        return NextResponse.json({
          success: true,
          message: '알림 규칙이 추가되었습니다.',
          data: {
            ruleId: rule.id,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'update-rule': {
        // 알림 규칙 수정
        const { ruleId, updates } = body;
        
        if (!ruleId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'ruleId와 updates 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertSystem.updateRule(ruleId, updates);
        
        return NextResponse.json({
          success: true,
          message: '알림 규칙이 수정되었습니다.',
          data: {
            ruleId,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'delete-rule': {
        // 알림 규칙 삭제
        const { ruleId } = body;
        
        if (!ruleId) {
          return NextResponse.json({
            success: false,
            error: 'ruleId 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertSystem.deleteRule(ruleId);
        
        return NextResponse.json({
          success: true,
          message: '알림 규칙이 삭제되었습니다.',
          data: {
            ruleId,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'bulk-acknowledge': {
        // 여러 알림 일괄 확인
        const { alertIds, acknowledgedBy } = body;
        
        if (!alertIds || !Array.isArray(alertIds) || !acknowledgedBy) {
          return NextResponse.json({
            success: false,
            error: 'alertIds (배열)와 acknowledgedBy 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertIds.forEach((alertId: string) => {
          alertSystem.acknowledgeAlert(alertId, acknowledgedBy);
        });
        
        return NextResponse.json({
          success: true,
          message: `${alertIds.length}개의 알림이 확인되었습니다.`,
          data: {
            alertIds,
            acknowledgedBy,
            count: alertIds.length,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'bulk-resolve': {
        // 여러 알림 일괄 해결
        const { alertIds } = body;
        
        if (!alertIds || !Array.isArray(alertIds)) {
          return NextResponse.json({
            success: false,
            error: 'alertIds (배열) 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        alertIds.forEach((alertId: string) => {
          alertSystem.resolveAlert(alertId);
        });
        
        return NextResponse.json({
          success: true,
          message: `${alertIds.length}개의 알림이 해결되었습니다.`,
          data: {
            alertIds,
            count: alertIds.length,
            timestamp: new Date().toISOString()
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: start-monitoring, stop-monitoring, acknowledge, resolve, add-rule, update-rule, delete-rule, bulk-acknowledge, bulk-resolve'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Alerts API] POST 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 