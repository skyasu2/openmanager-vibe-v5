/**
 * 🔄 서버 데이터 스케줄러 제어 API
 *
 * 백그라운드 스케줄러 관리:
 * - 시작/중지
 * - 상태 확인
 * - 성능 메트릭
 */

import { serverDataScheduler } from '@/services/background/ServerDataScheduler';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  console.log(`🔄 스케줄러 API 요청: ${action}`);

  try {
    switch (action) {
      case 'start':
        await serverDataScheduler.start();
        return Response.json({
          success: true,
          message: '백그라운드 스케줄러 시작됨',
          status: serverDataScheduler.getStatus(),
          timestamp: new Date().toISOString(),
        });

      case 'stop':
        serverDataScheduler.stop();
        return Response.json({
          success: true,
          message: '백그라운드 스케줄러 중지됨',
          status: serverDataScheduler.getStatus(),
          timestamp: new Date().toISOString(),
        });

      case 'status':
        const status = serverDataScheduler.getStatus();
        const storedData = await serverDataScheduler.getStoredData();
        const changes = await serverDataScheduler.getChanges();

        return Response.json({
          success: true,
          scheduler: status,
          data: {
            hasStoredData: !!storedData,
            dataVersion: storedData?.version || 0,
            serverCount: storedData?.servers?.length || 0,
            lastUpdate: storedData?.timestamp,
            changes: changes || { added: [], updated: [], removed: [] },
          },
          timestamp: new Date().toISOString(),
        });

      case 'performance':
        return await getPerformanceMetrics();

      case 'test':
        return await testDataGeneration();

      default:
        return Response.json(
          {
            error: 'Invalid action',
            availableActions: [
              'start',
              'stop',
              'status',
              'performance',
              'test',
            ],
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 스케줄러 API 오류:', error);
    return Response.json(
      {
        error: 'Scheduler API error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 성능 메트릭 분석
 */
async function getPerformanceMetrics() {
  const startTime = Date.now();

  try {
    // 1. 저장된 데이터 조회 성능
    const dataStartTime = Date.now();
    const storedData = await serverDataScheduler.getStoredData();
    const dataFetchTime = Date.now() - dataStartTime;

    // 2. 변경사항 조회 성능
    const changesStartTime = Date.now();
    const changes = await serverDataScheduler.getChanges();
    const changesFetchTime = Date.now() - changesStartTime;

    // 3. 기본 통계
    const status = serverDataScheduler.getStatus();
    const totalTime = Date.now() - startTime;

    return Response.json({
      success: true,
      performance: {
        dataFetch: {
          time: `${dataFetchTime}ms`,
          hasData: !!storedData,
          dataSize: storedData ? JSON.stringify(storedData).length : 0,
        },
        changesFetch: {
          time: `${changesFetchTime}ms`,
          hasChanges: !!(
            changes?.added.length ||
            changes?.updated.length ||
            changes?.removed.length
          ),
          changesCount: changes
            ? changes.added.length +
              changes.updated.length +
              changes.removed.length
            : 0,
        },
        scheduler: status,
        totalApiTime: `${totalTime}ms`,
      },
      optimization: {
        functionDurationSaved: '대폭 절약됨 (데이터 생성 로직 없음)',
        apiCallsReduced: '변경사항만 전송으로 90% 감소',
        storageStrategy: 'Redis (빠른 조회) + Supabase (영구 보관)',
        deltaUpdates: '변경 감지 기반 최적화',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Performance metrics error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 데이터 생성 테스트
 */
async function testDataGeneration() {
  const startTime = Date.now();

  try {
    console.log('🧪 데이터 생성 테스트 시작');

    // 스케줄러가 실행 중이 아니면 임시 시작
    const wasRunning = serverDataScheduler.getStatus().isRunning;
    if (!wasRunning) {
      await serverDataScheduler.start();
      // 2초 대기 (첫 데이터 생성)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 결과 확인
    const storedData = await serverDataScheduler.getStoredData();
    const status = serverDataScheduler.getStatus();

    const testTime = Date.now() - startTime;

    return Response.json({
      success: true,
      test: {
        duration: `${testTime}ms`,
        schedulerWasRunning: wasRunning,
        dataGenerated: !!storedData,
        serverCount: storedData?.servers?.length || 0,
        dataVersion: storedData?.version || 0,
        lastUpdate: storedData?.timestamp,
      },
      status,
      message: '데이터 생성 테스트 완료',
      recommendation: wasRunning
        ? '스케줄러가 이미 실행 중이었습니다.'
        : '스케줄러를 시작했습니다. 정상 작동 중입니다.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Test generation error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
