/**
 * 🖥️ Virtual Servers API
 * 
 * 가상 서버 데이터 생성 및 관리 API
 * - 서버 초기화 및 24시간 히스토리 데이터 생성
 * - 실시간 데이터 생성 시작/중지
 * - 서버 상태 및 메트릭 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { virtualServerManager } from '@/services/VirtualServerManager';

// GET: 가상 서버 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status': {
        // 전체 시스템 상태 조회
        const systemStatus = await virtualServerManager.getSystemStatus();
        const generationStatus = virtualServerManager.getGenerationStatus();
        
        return NextResponse.json({
          success: true,
          data: {
            system: systemStatus,
            generation: generationStatus,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'servers': {
        // 서버 목록 조회
        const servers = virtualServerManager.getServers();
        
        return NextResponse.json({
          success: true,
          data: {
            servers,
            count: servers.length
          }
        });
      }

      case 'metrics': {
        // 특정 서버의 메트릭 조회
        const serverId = searchParams.get('serverId');
        const hours = parseInt(searchParams.get('hours') || '24');
        
        if (!serverId) {
          return NextResponse.json({
            success: false,
            error: 'serverId 파라미터가 필요합니다.'
          }, { status: 400 });
        }

        const latestMetrics = await virtualServerManager.getLatestMetrics(serverId);
        const historyMetrics = await virtualServerManager.getMetricsHistory(serverId, hours);
        
        return NextResponse.json({
          success: true,
          data: {
            serverId,
            latest: latestMetrics,
            history: historyMetrics,
            historyCount: historyMetrics.length
          }
        });
      }

      case 'all-metrics': {
        // 모든 서버의 최신 메트릭 조회
        const servers = virtualServerManager.getServers();
        const allMetrics = await Promise.all(
          servers.map(async (server) => ({
            server,
            metrics: await virtualServerManager.getLatestMetrics(server.id)
          }))
        );
        
        return NextResponse.json({
          success: true,
          data: {
            servers: allMetrics,
            timestamp: new Date().toISOString()
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: status, servers, metrics, all-metrics'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Virtual Servers API] GET 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: 가상 서버 관리 작업
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initialize': {
        // 가상 서버 시스템 초기화
        console.log('🚀 가상 서버 시스템 초기화 시작...');
        
        await virtualServerManager.initialize();
        const systemStatus = await virtualServerManager.getSystemStatus();
        
        return NextResponse.json({
          success: true,
          message: '가상 서버 시스템이 성공적으로 초기화되었습니다.',
          data: {
            systemStatus,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'start-realtime': {
        // 실시간 데이터 생성 시작
        console.log('🚀 실시간 데이터 생성 시작...');
        
        await virtualServerManager.startRealtimeGeneration();
        const generationStatus = virtualServerManager.getGenerationStatus();
        
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 시작되었습니다. (20분간 5초 간격)',
          data: {
            generationStatus,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'stop-realtime': {
        // 실시간 데이터 생성 중지
        console.log('⏹️ 실시간 데이터 생성 중지...');
        
        virtualServerManager.stopRealtimeGeneration();
        const generationStatus = virtualServerManager.getGenerationStatus();
        
        return NextResponse.json({
          success: true,
          message: '실시간 데이터 생성이 중지되었습니다.',
          data: {
            generationStatus,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'full-setup': {
        // 전체 시스템 설정 (초기화 + 실시간 시작)
        console.log('🚀 전체 가상 서버 시스템 설정 시작...');
        
        // 1. 초기화
        await virtualServerManager.initialize();
        
        // 2. 실시간 데이터 생성 시작
        await virtualServerManager.startRealtimeGeneration();
        
        const systemStatus = await virtualServerManager.getSystemStatus();
        const generationStatus = virtualServerManager.getGenerationStatus();
        
        return NextResponse.json({
          success: true,
          message: '가상 서버 시스템이 완전히 설정되었습니다.',
          data: {
            systemStatus,
            generationStatus,
            timestamp: new Date().toISOString()
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: initialize, start-realtime, stop-realtime, full-setup'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Virtual Servers API] POST 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: 가상 서버 데이터 정리
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'clear-metrics': {
        // 메트릭 데이터 정리 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          // 로컬 스토리지 정리
          if (typeof window !== 'undefined') {
            localStorage.removeItem('server_metrics');
            localStorage.removeItem('virtual_servers');
          }
          
          return NextResponse.json({
            success: true,
            message: '가상 서버 메트릭 데이터가 정리되었습니다.'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '프로덕션 환경에서는 지원되지 않는 작업입니다.'
          }, { status: 403 });
        }
      }

      case 'reset-system': {
        // 전체 시스템 리셋 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          // 실시간 생성 중지
          virtualServerManager.stopRealtimeGeneration();
          
          // 데이터 정리
          if (typeof window !== 'undefined') {
            localStorage.removeItem('server_metrics');
            localStorage.removeItem('virtual_servers');
          }
          
          return NextResponse.json({
            success: true,
            message: '가상 서버 시스템이 리셋되었습니다.'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '프로덕션 환경에서는 지원되지 않는 작업입니다.'
          }, { status: 403 });
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter. Available: clear-metrics, reset-system'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Virtual Servers API] DELETE 요청 처리 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 