import { systemLogger } from '@/lib/logger';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';
import { NextRequest } from 'next/server';
import { systemStateManager } from '../../../../core/system/SystemStateManager';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandler,
} from '../../../../lib/api/errorHandler';

/**
 * 🚀 시스템 시작 API v2
 * POST /api/system/start
 * 통합 상태 관리자를 통한 시스템 초기화 및 시뮬레이션 시작
 */
async function startSystemHandler(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log(
      '🚀 시스템 시작 API 호출 (v2) - KST:',
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    );

    // 1. 데이터 생성기 초기화
    try {
      const generator = RealServerDataGenerator.getInstance();
      if (generator.getAllServers().length === 0) {
        await generator.initialize();
        generator.startAutoGeneration();
        systemLogger.info('✅ 데이터 생성기 초기화 완료');
      } else {
        systemLogger.info('👍 데이터 생성기는 이미 실행 중입니다.');
      }
    } catch (error) {
      systemLogger.error('❌ 데이터 생성기 초기화 실패:', error);
      // 데이터 생성기 실패는 치명적이지 않음
    }

    // 2. MCP 서버 웜업 (비동기, 실패해도 계속)
    MCPWarmupService.getInstance()
      .wakeupMCPServer()
      .then(() => {
        systemLogger.info('✅ MCP 서버 웜업 요청 완료 (백그라운드)');
      })
      .catch(error => {
        systemLogger.warn(
          `⚠️ MCP 서버 웜업 실패 (백그라운드): ${error.message}`
        );
      });

    // 3. 통합 상태 관리자를 통한 시뮬레이션 시작
    const result = await systemStateManager.startSimulation();

    if (!result.success) {
      return createErrorResponse(result.message, 'VALIDATION_ERROR');
    }

    // 현재 시스템 상태 조회
    const systemStatus = systemStateManager.getSystemStatus();

    // API 호출 추적
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, false);

    systemLogger.info('🎉 시스템 시작 완료');

    return createSuccessResponse(
      {
        isRunning: systemStatus.simulation.isRunning,
        runtime: systemStatus.simulation.runtime,
        dataCollected: systemStatus.simulation.dataCount,
        serverCount: systemStatus.simulation.serverCount,
        performance: {
          totalApiCalls: systemStatus.performance.apiCalls,
          averageResponseTime: systemStatus.performance.averageResponseTime,
          errorRate: systemStatus.performance.errorRate,
          responseTime: responseTime,
        },
        services: systemStatus.services,
        storageInfo: {
          lastUpdated: systemStatus.lastUpdated,
          health: systemStatus.health,
        },
      },
      result.message
    );
  } catch (error) {
    console.error('❌ 시스템 시작 오류:', error);

    // API 호출 추적 (에러)
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, true);

    throw error; // withErrorHandler가 처리
  }
}

// 에러 핸들러 래핑
export const POST = withErrorHandler(startSystemHandler);
