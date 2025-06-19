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
import {
  RealServerDataGenerator,
  realServerDataGenerator,
} from '@/services/data-generator/RealServerDataGenerator';
import { getRedisClient } from '@/lib/redis';
import { transformServerInstancesToServers } from '@/adapters/server-data-adapter';

export const dynamic = 'force-dynamic';

// 전역 변수로 생성기 상태 관리
let generator: RealServerDataGenerator | null = null;

export async function GET(request: NextRequest) {
  try {
    console.log('🔨 빌드 타임: 환경변수 검증 건너뜀');

    // Redis 클라이언트 초기화 시도
    try {
      const redis = await getRedisClient();
      console.log('✅ Redis 연결 성공 - 서버 데이터 저장 활성화');
    } catch (redisError) {
      console.warn('⚠️ Redis 환경변수 누락 → Enhanced Mock Redis로 자동 전환');
    }

    // 생성기 초기화 (한 번만)
    if (!generator) {
      generator = realServerDataGenerator;
      await generator.initialize();
    }

    // 현재 서버 데이터 가져오기
    const servers = generator.getAllServers();

    console.log(
      `초기화 실행 from /api/servers/realtime (서버 ${servers.length}개 감지)`
    );

    // 서버가 없으면 초기화 진행
    if (servers.length === 0) {
      console.log('🚀 RealServerDataGenerator 초기화 시작...');
      await generator.initialize();
      console.log('✅ RealServerDataGenerator 초기화 완료');
    }

    // 실시간 데이터 생성 시작 (아직 시작되지 않은 경우에만)
    if (!generator.getStatus().isRunning) {
      generator.startAutoGeneration();
    }

    // 🎯 Enhanced v2.0: 완전한 타입 안전 변환
    const latestServerInstances = generator.getAllServers();
    const latestServers = transformServerInstancesToServers(
      latestServerInstances
    );
    const dashboardSummary = generator.getDashboardSummary();

    // 🔒 변환 품질 검증
    const validServers = latestServers.filter(
      server => server && server.id && server.name && server.services
    );

    console.log(
      `🔄 Enhanced v2.0: ${latestServerInstances.length}개 ServerInstance → ${validServers.length}개 검증된 Server 변환 완료`
    );

    return NextResponse.json({
      success: true,
      data: validServers, // 🔒 검증된 Server[] 반환
      servers: validServers, // 호환성을 위해 유지
      summary: dashboardSummary,
      timestamp: Date.now(),
      count: validServers.length,
      transformation: {
        input: latestServerInstances.length,
        output: latestServers.length,
        valid: validServers.length,
        quality: Math.round(
          (validServers.length / latestServerInstances.length) * 100
        ),
      },
    });
  } catch (error) {
    console.error('❌ 실시간 서버 데이터 API 오류:', error);

    // 에러 발생 시에도 안정적인 응답 반환
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        servers: [], // 빈 배열로 안정적 응답
        summary: {
          servers: {
            total: 0,
            online: 0,
            warning: 0,
            offline: 0,
            avgCpu: 0,
            avgMemory: 0,
          },
          clusters: { total: 0, healthy: 0, warning: 0, critical: 0 },
          applications: {
            total: 0,
            healthy: 0,
            warning: 0,
            critical: 0,
            avgResponseTime: 0,
          },
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        count: 0,
      },
      { status: 200 }
    ); // 500 대신 200으로 안정적 응답
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (!generator) {
      generator = realServerDataGenerator;
      await generator.initialize();
    }

    switch (action) {
      case 'start':
        generator.startAutoGeneration();
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 시작되었습니다.',
          status: generator.getStatus(),
        });

      case 'stop':
        generator.stopAutoGeneration();
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 중지되었습니다.',
          status: generator.getStatus(),
        });

      case 'status':
        return NextResponse.json({
          success: true,
          status: generator.getStatus(),
          summary: generator.getDashboardSummary(),
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 실시간 서버 데이터 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
