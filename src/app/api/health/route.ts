/**
 * 🏥 Health Check API v2.0
 *
 * OpenManager v5.44.1 - 시스템 헬스 체크 + 환경변수 백업/복구
 * GET: 전체 시스템 상태 확인 + 자동 환경변수 복구
 */

import { NextRequest, NextResponse } from 'next/server';
import EnvBackupManager from '@/lib/env-backup-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🏥 시스템 헬스 체크
 */
export async function GET(request: NextRequest) {
  try {
    // 🔓 Vercel Protection Bypass 헤더 설정
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
      'x-vercel-set-bypass-cookie': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, x-vercel-protection-bypass',
    });

    const startTime = Date.now();

    // 🔧 환경변수 백업 관리자 초기화
    const envBackupManager = EnvBackupManager.getInstance();

    // 🔍 환경변수 유효성 검증 및 자동 복구
    const envValidation = envBackupManager.validateEnvironment();
    let envRecoveryResult = null;

    // Critical 또는 Important 환경변수 문제 시 자동 복구 시도
    if (
      !envValidation.isValid &&
      ['critical', 'important'].includes(envValidation.priority)
    ) {
      console.log(
        `🚨 환경변수 문제 감지 (${envValidation.priority}): 자동 복구 시도`
      );
      const restorePriority =
        envValidation.priority === 'critical' ? 'critical' : 'important';
      envRecoveryResult =
        await envBackupManager.emergencyRestore(restorePriority);

      // 복구 후 재검증
      if (envRecoveryResult.success) {
        const revalidation = envBackupManager.validateEnvironment();
        envValidation.isValid = revalidation.isValid;
        envValidation.missing = revalidation.missing;
        envValidation.invalid = revalidation.invalid;
        envValidation.priority = revalidation.priority;
      }
    }

    // 🚀 빠른 기본 응답을 위한 최적화
    const systemInfo = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      environment: process.env.NODE_ENV || 'development',
      version: '5.44.1',
      phase: 'Phase 2 - 환경변수 자동 복구',
    };

    // 메모리 사용량 확인 (빠른 처리)
    let memoryInfo = null;
    try {
      if (process.memoryUsage) {
        const mem = process.memoryUsage();
        memoryInfo = {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          external: Math.round(mem.external / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
        };
      }
    } catch (error) {
      // 메모리 정보를 가져올 수 없는 환경
    }

    // Phase 1 모듈 상태 확인 (병렬 처리)
    let dataGeneratorStatus = 'active';
    let monitoringStatus = 'active';

    // 실제 데이터 생성기 상태 확인
    try {
      const globalStatus = (global as any)?.dataGeneratorStatus;
      if (globalStatus) {
        const timeSinceLastPing = Date.now() - (globalStatus.lastPing || 0);
        dataGeneratorStatus =
          timeSinceLastPing < 30000 && globalStatus.isHealthy
            ? 'active'
            : 'degraded';

        // 통신 상태도 확인
        if (!globalStatus.communicationOk) {
          monitoringStatus = 'degraded';
        }
      }
    } catch (error) {
      console.warn('데이터 생성기 상태 확인 실패:', error);
      dataGeneratorStatus = 'unknown';
    }

    const moduleStatus = {
      realTimeHub: 'active',
      patternMatcher: 'active',
      dataRetention: 'active',
      dataGenerator: dataGeneratorStatus, // 실제 상태 반영
      monitoring: monitoringStatus, // 실제 통신 상태 반영
    };

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;
    const isHealthy = responseTime < 2000; // 2초 이내 응답을 건강한 상태로 판정

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      system: systemInfo,
      memory: memoryInfo,
      modules: moduleStatus,
      performance: {
        responseTime,
        healthy: isHealthy,
        target: '<2000ms', // 목표 응답 시간 명시
      },
      checks: [
        {
          name: 'API Server',
          status: 'passing',
          message: 'API 서버 정상 동작',
        },
        {
          name: 'Memory Usage',
          status: memoryInfo ? 'passing' : 'warning',
          message: memoryInfo ? '메모리 사용량 정상' : '메모리 정보 확인 불가',
        },
        {
          name: 'Response Time',
          status: isHealthy ? 'passing' : 'warning',
          message: `응답 시간: ${responseTime}ms`,
        },
        {
          name: 'Data Generator',
          status:
            dataGeneratorStatus === 'active'
              ? 'passing'
              : dataGeneratorStatus === 'degraded'
                ? 'warning'
                : 'critical',
          message:
            dataGeneratorStatus === 'active'
              ? '데이터 생성기 정상 작동'
              : dataGeneratorStatus === 'degraded'
                ? '데이터 생성기 성능 저하'
                : '데이터 생성기 상태 확인 불가',
        },
        {
          name: 'Monitoring System',
          status: monitoringStatus === 'active' ? 'passing' : 'warning',
          message:
            monitoringStatus === 'active'
              ? '모니터링 시스템 정상 통신'
              : '모니터링 시스템 통신 문제',
        },
        {
          name: 'Environment Variables',
          status: envValidation.isValid
            ? 'passing'
            : envValidation.priority === 'critical'
              ? 'critical'
              : envValidation.priority === 'important'
                ? 'warning'
                : 'info',
          message: envValidation.isValid
            ? '환경변수 모두 정상'
            : `환경변수 문제 (${envValidation.priority}): 누락 ${envValidation.missing.length}개, 잘못된 값 ${envValidation.invalid.length}개`,
        },
      ],
      // 🚀 추가 진단 정보
      diagnostics: {
        ready: true,
        dataFlowHealthy: dataGeneratorStatus === 'active',
        communicationOk: monitoringStatus === 'active',
        lastHealthCheck: new Date().toISOString(),
        dataGenerator: {
          status: dataGeneratorStatus,
          lastPing: (global as any)?.dataGeneratorStatus?.lastPing || null,
          consecutiveFailures:
            (global as any)?.dataGeneratorStatus?.consecutiveFailures || 0,
          recoveryAttempts: (global as any)?.dataGeneratorStatus
            ?.recoveryAttempt
            ? 1
            : 0,
        },
        monitoring: {
          status: monitoringStatus,
          lastSuccessfulCommunication:
            (global as any)?.dataGeneratorStatus?.lastSuccessfulCommunication ||
            null,
        },
        // 🔧 환경변수 백업/복구 시스템 상태
        environmentBackup: {
          validation: envValidation,
          backupStatus: envBackupManager.getBackupStatus(),
          recovery: envRecoveryResult,
          autoRecoveryEnabled: true,
          lastCheck: new Date().toISOString(),
        },
      },
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('⚠️ 헬스 체크 오류 - 서버는 정상 동작 중입니다:', error);

    const errorHeaders = new Headers({
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
      'x-vercel-set-bypass-cookie': 'true',
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 200,
        headers: errorHeaders,
      }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, x-vercel-protection-bypass, x-vercel-set-bypass-cookie',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
    },
  });
}
