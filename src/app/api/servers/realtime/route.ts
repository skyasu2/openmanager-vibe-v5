/**
 * 🚀 실시간 서버 데이터 API
 * 
 * 기능:
 * - 실시간 서버 메트릭 제공
 * - 클러스터 상태 정보
 * - 애플리케이션 성능 지표
 * - 대시보드용 요약 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

export const runtime = 'nodejs';

// 데이터 생성기 초기화 (한 번만)
let isInitialized = false;
const initializeGenerator = async () => {
  if (!isInitialized) {
    await realServerDataGenerator.initialize();
    isInitialized = true;
  }
};

export async function GET(request: NextRequest) {
  try {
    // 데이터 생성기 초기화
    await initializeGenerator();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const serverId = searchParams.get('serverId');
    const clusterId = searchParams.get('clusterId');

    switch (type) {
      case 'summary':
        return NextResponse.json({
          success: true,
          data: realServerDataGenerator.getDashboardSummary(),
          timestamp: new Date().toISOString()
        });

      case 'servers':
        if (serverId) {
          const server = realServerDataGenerator.getServerById(serverId);
          if (!server) {
            return NextResponse.json(
              { success: false, error: '서버를 찾을 수 없습니다' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: server,
            timestamp: new Date().toISOString()
          });
        } else {
          // 🚦 서버 목록 개수 제한 (기본 20, 최대 100) + 변경분 필터링
          const limitParam = searchParams.get('limit');
          const sinceParam = searchParams.get('since');

          // limit 계산
          const limit = Math.min(
            Math.max(parseInt(limitParam || '20', 10) || 20, 1),
            100
          );

          // sinceTimestamp 계산 (epoch 또는 ISO)
          let sinceTimestamp: number | null = null;
          if (sinceParam) {
            const num = Number(sinceParam);
            if (!isNaN(num)) {
              sinceTimestamp = num;
            } else {
              const iso = Date.parse(sinceParam);
              if (!isNaN(iso)) sinceTimestamp = iso;
            }
          }

          let allServers = realServerDataGenerator.getAllServers();

          // 변경분 필터링
          if (sinceTimestamp) {
            allServers = allServers.filter(s => {
              const last = s.last_updated
                ? Date.parse(s.last_updated)
                : s.timestamp || 0;
              return last > (sinceTimestamp as number);
            });
          }

          return NextResponse.json({
            success: true,
            data: allServers.slice(0, limit),
            total: allServers.length,
            limit,
            delta_mode: Boolean(sinceTimestamp),
            timestamp: new Date().toISOString()
          });
        }

      case 'clusters':
        if (clusterId) {
          const cluster = realServerDataGenerator.getClusterById(clusterId);
          if (!cluster) {
            return NextResponse.json(
              { success: false, error: '클러스터를 찾을 수 없습니다' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: cluster,
            timestamp: new Date().toISOString()
          });
        } else {
          const limitParam = searchParams.get('limit');
          const limit = Math.min(
            Math.max(parseInt(limitParam || '10', 10) || 10, 1),
            50
          );
          const allClusters = realServerDataGenerator.getAllClusters();
          return NextResponse.json({
            success: true,
            data: allClusters.slice(0, limit),
            total: allClusters.length,
            limit,
            timestamp: new Date().toISOString()
          });
        }

      case 'applications':
        const limitParam = searchParams.get('limit');
        const limit = Math.min(
          Math.max(parseInt(limitParam || '15', 10) || 15, 1),
          100
        );
        const allApplications = realServerDataGenerator.getAllApplications();
        return NextResponse.json({
          success: true,
          data: allApplications.slice(0, limit),
          total: allApplications.length,
          limit,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const healthData = await realServerDataGenerator.healthCheck();
        return NextResponse.json({
          success: true,
          data: healthData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 타입입니다' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ 실시간 서버 데이터 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 데이터를 가져오는데 실패했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeGenerator();
    
    const body = await request.json();
    const { action, serverId, config } = body;

    switch (action) {
      case 'start-generation':
        realServerDataGenerator.startAutoGeneration();
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 시작되었습니다',
          timestamp: new Date().toISOString()
        });

      case 'stop-generation':
        realServerDataGenerator.stopAutoGeneration();
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 중지되었습니다',
          timestamp: new Date().toISOString()
        });

      case 'simulate-incident':
        // 특정 서버에 장애 시뮬레이션
        if (!serverId) {
          return NextResponse.json(
            { success: false, error: 'serverId가 필요합니다' },
            { status: 400 }
          );
        }
        
        // 여기서는 간단한 응답만 (실제 시뮬레이션은 데이터 생성기 내부에서 자동으로)
        return NextResponse.json({
          success: true,
          message: `서버 ${serverId}에 대한 장애 시뮬레이션이 요청되었습니다`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ 실시간 서버 데이터 POST API 오류:', error);
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