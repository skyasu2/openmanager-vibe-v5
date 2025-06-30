/**
 * 🔄 서버 데이터 스케줄러 제어 API (TDD 구현)
 *
 * 백그라운드 스케줄러 관리:
 * - 시작/중지 제어
 * - 상태 확인
 * - 성능 메트릭
 * - 생성/수집 주기 분리 최적화
 */

import { serverDataScheduler } from '@/services/background/ServerDataScheduler';
import KoreanTimeUtil from '@/utils/koreanTime';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  console.log(`🔄 스케줄러 API 요청: ${action} (${KoreanTimeUtil.now()})`);

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
        const performance = serverDataScheduler.getPerformanceMetrics();
        return Response.json({
          success: true,
          performance,
          timestamp: new Date().toISOString(),
        });

      case 'clear-cache':
        await serverDataScheduler.clearCache();
        return Response.json({
          success: true,
          message: '캐시 클리어 완료',
          timestamp: new Date().toISOString(),
        });

      default:
        return Response.json(
          {
            success: false,
            error: '지원하지 않는 액션입니다',
            availableActions: [
              'start',
              'stop',
              'status',
              'performance',
              'clear-cache',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 스케줄러 API 오류:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
