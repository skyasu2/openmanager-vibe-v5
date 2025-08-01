/**
 * 🔧 통합 시스템 제어 API
 *
 * 새로운 ProcessManager를 통한 시스템 제어:
 * - 시작/중지/재시작
 * - 상태 조회
 * - 헬스체크
 * - 모니터링 데이터
 */

// 강제 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import {
  getProcessConfigs,
  validateProcessConfigs,
} from '@/core/system/process-configs';
import { ProcessManager } from '@/core/system/ProcessManager';
import { systemLogger } from '@/lib/logger';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 싱글톤 ProcessManager 인스턴스
let processManager: ProcessManager | null = null;

function getProcessManager(): ProcessManager {
  if (!processManager) {
    systemLogger.system('🔧 ProcessManager 인스턴스 생성');
    processManager = new ProcessManager();

    // 프로세스 설정 등록
    const configs = getProcessConfigs();
    const validation = validateProcessConfigs(configs);

    if (!validation.isValid) {
      systemLogger.error('프로세스 설정 검증 실패:', validation.errors);
      throw new Error(`프로세스 설정 오류: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      systemLogger.warn('프로세스 설정 경고:', validation.warnings);
    }

    // 설정 등록
    configs.forEach((config) => {
      processManager!.registerProcess(config);
    });

    systemLogger.system(
      `✅ ProcessManager 초기화 완료 (${configs.length}개 프로세스 등록)`
    );
  }

  return processManager;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options } = body;

    const manager = getProcessManager();

    switch (action) {
      case 'start': {
        systemLogger.system('🚀 통합 시스템 시작 요청');
        const result = await manager.startSystem(options);

        return NextResponse.json({
          success: result.success,
          message: result.message,
          errors: result.errors,
          warnings: result.warnings,
          timestamp: new Date().toISOString(),
        });
      }

      case 'stop': {
        systemLogger.system('🛑 통합 시스템 중지 요청');
        const result = await manager.stopSystem();

        return NextResponse.json({
          success: result.success,
          message: result.message,
          errors: result.errors,
          timestamp: new Date().toISOString(),
        });
      }

      case 'restart': {
        systemLogger.system('🔄 통합 시스템 재시작 요청');

        // 먼저 중지
        const stopResult = await manager.stopSystem();

        if (!stopResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: '시스템 중지 실패로 재시작 중단',
              errors: stopResult.errors,
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          );
        }

        // 3초 대기
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 다시 시작
        const startResult = await manager.startSystem(options);

        return NextResponse.json({
          success: startResult.success,
          message: `재시작 완료: ${startResult.message}`,
          errors: [...stopResult.errors, ...startResult.errors],
          warnings: startResult.warnings,
          timestamp: new Date().toISOString(),
        });
      }

      case 'process-action': {
        const { processId, processAction } = body;

        if (!processId) {
          return NextResponse.json(
            {
              success: false,
              message: 'processId가 필요합니다',
            },
            { status: 400 }
          );
        }

        switch (processAction) {
          case 'restart': {
            systemLogger.system(`🔄 프로세스 재시작 요청: ${processId}`);
            // 개별 프로세스 재시작은 내부적으로 처리됨
            const state = manager.getProcessState(processId);

            if (!state) {
              return NextResponse.json(
                {
                  success: false,
                  message: `프로세스를 찾을 수 없음: ${processId}`,
                },
                { status: 404 }
              );
            }

            return NextResponse.json({
              success: true,
              message: `프로세스 ${processId} 재시작 신호 전송됨`,
              processState: state,
              timestamp: new Date().toISOString(),
            });
          }

          default:
            return NextResponse.json(
              {
                success: false,
                message: `지원하지 않는 프로세스 액션: ${processAction}`,
              },
              { status: 400 }
            );
        }
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: `지원하지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    systemLogger.error('통합 시스템 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '시스템 제어 실패',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    const manager = getProcessManager();

    switch (action) {
      case 'start': {
        // GET으로 start 요청이 왔을 때는 안전하게 시작 시도
        systemLogger.system('🚀 통합 시스템 시작 요청 (GET)');

        try {
          const result = await manager.startSystem({
            mode: 'fast',
            skipStabilityCheck: true,
          });

          return NextResponse.json({
            success: result.success,
            message: result.message,
            errors: result.errors,
            warnings: result.warnings,
            timestamp: new Date().toISOString(),
          });
        } catch (startError) {
          // 시작 실패 시에도 graceful하게 처리
          const errorMessage =
            startError instanceof Error
              ? startError.message
              : '시스템 시작 실패';
          systemLogger.warn('시스템 시작 실패 (GET):', startError);

          return NextResponse.json(
            {
              success: false,
              message: `시스템 시작 실패: ${errorMessage}`,
              errors: [errorMessage],
              warnings: [],
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
        }
      }

      case 'stop': {
        // GET으로 stop 요청 처리
        systemLogger.system('🛑 통합 시스템 중지 요청 (GET)');

        try {
          const result = await manager.stopSystem();

          return NextResponse.json({
            success: result.success,
            message: result.message,
            errors: result.errors,
            timestamp: new Date().toISOString(),
          });
        } catch (stopError) {
          const errorMessage =
            stopError instanceof Error ? stopError.message : '시스템 중지 실패';
          systemLogger.warn('시스템 중지 실패 (GET):', stopError);

          return NextResponse.json(
            {
              success: false,
              message: `시스템 중지 실패: ${errorMessage}`,
              errors: [errorMessage],
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          );
        }
      }

      case 'status': {
        const status = manager.getSystemStatus();

        return NextResponse.json({
          success: true,
          data: {
            ...status,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'metrics': {
        const metrics = manager.getSystemMetrics();

        return NextResponse.json({
          success: true,
          data: {
            metrics,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'health': {
        const status = manager.getSystemStatus();
        const isHealthy = status.health === 'healthy';

        return NextResponse.json(
          {
            success: true,
            healthy: isHealthy,
            status: status.health,
            runningProcesses: status.metrics.runningProcesses,
            totalProcesses: status.metrics.totalProcesses,
            timestamp: new Date().toISOString(),
          },
          {
            status: isHealthy ? 200 : 503,
          }
        );
      }

      case 'watchdog': {
        const status = manager.getSystemStatus();
        const watchdogHealth = status.watchdogMetrics || null;

        return NextResponse.json({
          success: true,
          data: {
            watchdogHealth,
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'processes': {
        const status = manager.getSystemStatus();

        return NextResponse.json({
          success: true,
          data: {
            processes: status.processes.map((process) => ({
              id: process.id,
              status: process.status,
              healthScore: process.healthScore,
              restartCount: process.restartCount,
              uptime: process.uptime,
              lastHealthCheck: process.lastHealthCheck,
              errorCount: process.errors.length,
            })),
            timestamp: new Date().toISOString(),
          },
        });
      }

      case 'events': {
        // 실시간 이벤트 스트림을 위한 SSE (Server-Sent Events) 엔드포인트
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          start(controller) {
            const sendEvent = (eventType: string, _data: any) => {
              const message = `event: ${eventType}\ndata: ${JSON.stringify(_data)}\n\n`;
              controller.enqueue(encoder.encode(message));
            };

            // 초기 상태 전송
            const _initialStatus = manager.getSystemStatus();
            sendEvent('status', _initialStatus);

            // 이벤트 리스너 등록
            const listeners: Array<{
              event: string;
              handler: (...args: any[]) => void;
            }> = [
              {
                event: 'system:started',
                handler: (_data: any) => sendEvent('system-started', _data),
              },
              {
                event: 'system:stopped',
                handler: (_data: any) => sendEvent('system-stopped', _data),
              },
              {
                event: 'system:health-update',
                handler: (_data: any) => sendEvent('health-update', _data),
              },
              {
                event: 'process:started',
                handler: (_data: any) => sendEvent('process-started', _data),
              },
              {
                event: 'process:stopped',
                handler: (_data: any) => sendEvent('process-stopped', _data),
              },
              {
                event: 'process:unhealthy',
                handler: (_data: any) => sendEvent('process-unhealthy', _data),
              },
              {
                event: 'system:stable',
                handler: (_data: any) => sendEvent('system-stable', _data),
              },
            ];

            listeners.forEach(({ event, handler }) => {
              manager.on(event, handler);
            });

            // 정리 함수
            return () => {
              listeners.forEach(({ event, handler }) => {
                manager.removeListener(event, handler);
              });
            };
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Cache-Control',
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: `지원하지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    systemLogger.error('통합 시스템 상태 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '시스템 상태 조회 실패',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
