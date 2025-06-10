/**
 * 🤖 AI 자동 스케일링 API
 *
 * OpenManager AI v5.12.0 - 지능형 자동 스케일링
 * - 스케일링 의사결정 실행
 * - 정책 및 규칙 관리
 * - 스케일링 히스토리 조회
 * - 실시간 스케일링 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
} from '../../../../lib/api/errorHandler';
import { autoScalingEngine } from '../../../../services/ai/AutoScalingEngine';
import { cacheService } from '../../../../services/cacheService';

/**
 * 🤖 스케일링 의사결정 조회 (GET)
 */
async function getScalingDecisionHandler(request: NextRequest) {
  try {
    console.log('🤖 자동 스케일링 의사결정 API 호출');

    // 현재 서버 데이터 가져오기
    const cachedServers = await cacheService.getCachedServers();
    const servers = cachedServers?.servers || [];

    if (servers.length === 0) {
      return createErrorResponse('서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 스케일링 의사결정 실행
    const decision = await autoScalingEngine.makeScalingDecision(servers);

    // 현재 설정 조회
    const config = autoScalingEngine.getCurrentConfig();

    // 스케일링 통계 조회
    const stats = autoScalingEngine.getScalingStats();

    return createSuccessResponse(
      {
        decision,
        config,
        stats,
        serverCount: servers.length,
        analysis: {
          recommendedAction: decision.action,
          confidence: `${(decision.confidence * 100).toFixed(1)}%`,
          estimatedTime: decision.timeline.estimatedTime,
          costImpact:
            decision.costImpact.savings > 0
              ? `${decision.costImpact.savings.toFixed(0)}원/시간 절약`
              : `${Math.abs(decision.costImpact.savings).toFixed(0)}원/시간 증가`,
        },
      },
      '자동 스케일링 의사결정 완료'
    );
  } catch (error) {
    console.error('❌ 자동 스케일링 의사결정 실패:', error);
    return createErrorResponse(
      `자동 스케일링 의사결정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * ⚡ 스케일링 실행 (POST)
 */
async function executeScalingHandler(request: NextRequest) {
  try {
    console.log('⚡ 자동 스케일링 실행 API 호출');

    const body = await request.json().catch(() => ({}));
    const { force = false } = body;

    // 현재 서버 데이터 가져오기
    const cachedServers = await cacheService.getCachedServers();
    const servers = cachedServers?.servers || [];

    if (servers.length === 0) {
      return createErrorResponse('서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 스케일링 의사결정
    const decision = await autoScalingEngine.makeScalingDecision(servers);

    // 강제 실행이 아니고 maintain인 경우
    if (!force && decision.action === 'maintain') {
      return createSuccessResponse(
        {
          executed: false,
          decision,
          message: '현재 스케일링이 필요하지 않습니다',
          recommendation: '시스템이 안정적인 상태입니다',
        },
        '스케일링 불필요'
      );
    }

    // 스케일링 실행
    const result = await autoScalingEngine.executeScaling(decision);

    return createSuccessResponse(
      {
        executed: true,
        decision,
        result,
        summary: {
          action: decision.action,
          fromServers: decision.currentServers,
          toServers: result.actualServers,
          duration: `${result.duration}ms`,
          success: result.success,
          costImpact:
            decision.costImpact.savings > 0
              ? `${decision.costImpact.savings.toFixed(0)}원/시간 절약`
              : `${Math.abs(decision.costImpact.savings).toFixed(0)}원/시간 증가`,
        },
      },
      result.success ? '자동 스케일링 실행 완료' : '자동 스케일링 실행 실패'
    );
  } catch (error) {
    console.error('❌ 자동 스케일링 실행 실패:', error);
    return createErrorResponse(
      `자동 스케일링 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * ⚙️ 스케일링 정책 업데이트 (PUT)
 */
async function updateScalingPolicyHandler(request: NextRequest) {
  try {
    console.log('⚙️ 스케일링 정책 업데이트 API 호출');

    const body = await request.json();
    const { policy, rules, enabled } = body;

    // 정책 업데이트
    if (policy) {
      // 정책 검증
      if (
        policy.minServers &&
        (policy.minServers < 1 || policy.minServers > 50)
      ) {
        return createErrorResponse(
          '최소 서버 수는 1-50 사이여야 합니다',
          'VALIDATION_ERROR'
        );
      }

      if (
        policy.maxServers &&
        (policy.maxServers < 1 || policy.maxServers > 100)
      ) {
        return createErrorResponse(
          '최대 서버 수는 1-100 사이여야 합니다',
          'VALIDATION_ERROR'
        );
      }

      if (
        policy.minServers &&
        policy.maxServers &&
        policy.minServers >= policy.maxServers
      ) {
        return createErrorResponse(
          '최소 서버 수는 최대 서버 수보다 작아야 합니다',
          'VALIDATION_ERROR'
        );
      }

      autoScalingEngine.updatePolicy(policy);
    }

    // 규칙 업데이트
    if (rules && Array.isArray(rules)) {
      // 규칙 검증
      for (const rule of rules) {
        if (!rule.id || !rule.name || !rule.metric) {
          return createErrorResponse(
            '규칙에는 id, name, metric이 필요합니다',
            'VALIDATION_ERROR'
          );
        }

        if (
          !['cpu', 'memory', 'disk', 'response_time', 'composite'].includes(
            rule.metric
          )
        ) {
          return createErrorResponse(
            '지원하지 않는 메트릭입니다',
            'VALIDATION_ERROR'
          );
        }

        if (rule.weight < 0 || rule.weight > 1) {
          return createErrorResponse(
            '가중치는 0-1 사이여야 합니다',
            'VALIDATION_ERROR'
          );
        }
      }

      autoScalingEngine.updateRules(rules);
    }

    // 활성화/비활성화
    if (typeof enabled === 'boolean') {
      autoScalingEngine.setEnabled(enabled);
    }

    // 업데이트된 설정 조회
    const updatedConfig = autoScalingEngine.getCurrentConfig();

    return createSuccessResponse(
      {
        config: updatedConfig,
        updated: {
          policy: !!policy,
          rules: !!rules,
          enabled: typeof enabled === 'boolean',
        },
        message: '스케일링 설정이 업데이트되었습니다',
      },
      '스케일링 정책 업데이트 완료'
    );
  } catch (error) {
    console.error('❌ 스케일링 정책 업데이트 실패:', error);
    return createErrorResponse(
      `스케일링 정책 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 📊 스케일링 히스토리 조회 (GET /history)
 */
async function getScalingHistoryHandler(request: NextRequest) {
  try {
    console.log('📊 스케일링 히스토리 조회 API 호출');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action'); // 'scale_up', 'scale_down', 'maintain'

    if (limit < 1 || limit > 100) {
      return createErrorResponse(
        'limit은 1-100 사이여야 합니다',
        'VALIDATION_ERROR'
      );
    }

    // 스케일링 통계 조회
    const stats = autoScalingEngine.getScalingStats();

    // 필터링
    let history = stats.recentActions;
    if (action && ['scale_up', 'scale_down', 'maintain'].includes(action)) {
      history = history.filter(h => h.action === action);
    }

    // 제한
    history = history.slice(0, limit);

    // 통계 계산
    const totalActions = stats.totalActions;
    const successfulActions = history.filter(h => h.success).length;
    const failedActions = history.filter(h => !h.success).length;

    const scaleUpActions = history.filter(h => h.action === 'scale_up').length;
    const scaleDownActions = history.filter(
      h => h.action === 'scale_down'
    ).length;

    return createSuccessResponse(
      {
        history,
        statistics: {
          total: totalActions,
          successful: successfulActions,
          failed: failedActions,
          successRate: `${stats.successRate.toFixed(1)}%`,
          averageDuration: `${stats.averageDuration.toFixed(0)}ms`,
          actionDistribution: {
            scaleUp: scaleUpActions,
            scaleDown: scaleDownActions,
          },
        },
        lastAction: stats.lastAction,
        filters: {
          limit,
          action: action || 'all',
        },
      },
      '스케일링 히스토리 조회 완료'
    );
  } catch (error) {
    console.error('❌ 스케일링 히스토리 조회 실패:', error);
    return createErrorResponse(
      `스케일링 히스토리 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🔄 스케일링 시뮬레이션 (POST /simulate)
 */
async function simulateScalingHandler(request: NextRequest) {
  try {
    console.log('🔄 스케일링 시뮬레이션 API 호출');

    const body = await request.json();
    const {
      targetCpu = null,
      targetMemory = null,
      targetResponseTime = null,
      serverCount = null,
    } = body;

    // 현재 서버 데이터 가져오기
    const cachedServers = await cacheService.getCachedServers();
    let servers = cachedServers?.servers || [];

    if (servers.length === 0) {
      return createErrorResponse('서버 데이터가 없습니다', 'NOT_FOUND');
    }

    // 시뮬레이션을 위한 서버 데이터 수정
    if (
      targetCpu !== null ||
      targetMemory !== null ||
      targetResponseTime !== null
    ) {
      servers = servers.map(server => ({
        ...server,
        cpu_usage: targetCpu !== null ? targetCpu : server.cpu_usage,
        memory_usage:
          targetMemory !== null ? targetMemory : server.memory_usage,
        response_time:
          targetResponseTime !== null
            ? targetResponseTime
            : server.response_time,
      }));
    }

    // 서버 수 시뮬레이션
    if (serverCount !== null && serverCount > 0) {
      if (serverCount > servers.length) {
        // 서버 추가 시뮬레이션
        const additionalServers = serverCount - servers.length;
        for (let i = 0; i < additionalServers; i++) {
          const newServer = {
            ...servers[0],
            id: `sim-server-${servers.length + i + 1}`,
            hostname: `sim-server-${servers.length + i + 1}`,
          };
          servers.push(newServer);
        }
      } else if (serverCount < servers.length) {
        // 서버 제거 시뮬레이션
        servers = servers.slice(0, serverCount);
      }
    }

    // 시뮬레이션된 데이터로 스케일링 의사결정
    const decision = await autoScalingEngine.makeScalingDecision(servers);

    return createSuccessResponse(
      {
        simulation: {
          originalServerCount: cachedServers?.servers?.length || 0,
          simulatedServerCount: servers.length,
          simulatedMetrics: {
            avgCpu:
              targetCpu ||
              servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length,
            avgMemory:
              targetMemory ||
              servers.reduce((sum, s) => sum + s.memory_usage, 0) /
                servers.length,
            avgResponseTime:
              targetResponseTime ||
              servers.reduce((sum, s) => sum + s.response_time, 0) /
                servers.length,
          },
        },
        decision,
        analysis: {
          wouldScale: decision.action !== 'maintain',
          recommendation: decision.action,
          confidence: `${(decision.confidence * 100).toFixed(1)}%`,
          reasoning: decision.reasoning,
          costImpact: decision.costImpact,
        },
      },
      '스케일링 시뮬레이션 완료'
    );
  } catch (error) {
    console.error('❌ 스케일링 시뮬레이션 실패:', error);
    return createErrorResponse(
      `스케일링 시뮬레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

// 라우트 핸들러 매핑
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { pathname } = new URL(request.url);

  if (pathname.endsWith('/history')) {
    return getScalingHistoryHandler(request);
  } else {
    return getScalingDecisionHandler(request);
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { pathname } = new URL(request.url);

  if (pathname.endsWith('/simulate')) {
    return simulateScalingHandler(request);
  } else {
    return executeScalingHandler(request);
  }
});

export const PUT = withErrorHandler(updateScalingPolicyHandler);
